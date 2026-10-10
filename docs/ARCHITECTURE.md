# Architecture

**Authoritative** for how the application is built: domains, the data pipeline, the scoring ledger, realtime delivery and security. Game rules are in [GAMEPLAY.md](GAMEPLAY.md). Provider coverage and live behaviour are in [LIVE_DATA.md](LIVE_DATA.md). The original design reasoning is in [docs/06](06-data-and-scoring-architecture.md); where the two differ, this file describes what was built.

## Stack

| Layer | Choice |
|---|---|
| App | Next.js 15 (App Router, server components, route handlers), React 19, TypeScript strict |
| UI | Tailwind CSS 4 with DESIGN.md tokens, `motion` for animation, `vaul` for bottom sheets, Geist |
| Data | PostgreSQL with Drizzle ORM. SQL migrations live in `drizzle/` |
| Realtime | Server-Sent Events from route handlers |
| Images | `next/og` (Satori) for share cards |
| Tests | Vitest (unit and integration against Postgres), Playwright (e2e and axe accessibility) |

**Separation from other projects.** The app lives only in this repository's `esports-fantasy` branch. It has its own database (`lockin`), its own auth, its own brand and its own history. It shares no code, credentials or assets with Sky, KnowBall, Huddle or any other project.

## Layout

```
src/domain/        Pure rules: no I/O. Roster validation, scoring (cs2.ts, stage.ts, advancement.ts),
                   Autopilot, Swiss pairing, standings and tiebreaks. Shared by server and client.
src/server/
  providers/       Provider adapters → normalized model (types.ts). demo/ is the replay provider;
                   pandascore/ is a stub that throws.
  ingest/          The pipeline: sync, validate, score (ledger), contests (windows, locks, Autopilot),
                   pricing, standings.
  services/        Write paths with authorization: entries, leagues, leaderboards, demo controls.
  queries/         Read models for screens: contest, live, match, recap, tournament, people.
  auth/            Passwords (scrypt) and sessions.
  sse.ts fresh.ts  Realtime fan-out and the shared pipeline trigger.
  clock.ts         Server clock (demo offset and speed).
src/app/           Routes. (main)/ holds the pages; api/ holds JSON, SSE and OG endpoints.
src/components/    UI by screen (builder, live, entry, board, player, tournament) plus ui/ primitives.
```

## Domains and tables

| Domain | Tables |
|---|---|
| Identity | `users`, `sessions` |
| Esports | `games`, `teams`, `players`, `player_team_memberships`, `external_ids` |
| Competition | `tournaments`, `stages`, `stage_teams`, `matches`, `maps`, `player_map_stats`, `live_maps` |
| Fantasy | `scoring_rule_sets`, `contests`, `contest_windows`, `player_prices`, `window_pool`, `entries`, `roster_versions`, `roster_selections`, `transfers` |
| Scoring | `scoring_events` (the ledger), `entry_window_scores`, `standings_snapshots`, `score_corrections` |
| Social | `leagues`, `league_members`, `league_entries` |
| Live operations | `provider_records`, `ingestion_runs` |
| Administration | `admin_audit_log`, `app_settings` |

## The pipeline

```
Provider (demo replay today; GRID or PandaScore later)
  ↓ adapter: provider payload → NormTournament / NormMatch / NormLiveMap      providers/*/adapter.ts
  ↓ validate: reject impossible stats, unknown players, inconsistent maps     ingest/validate.ts
  ↓ sync: upsert by external id, hash each match, version corrected stats      ingest/sync.ts
  ↓    └─ live_maps: latest in-map snapshot (provisional, outside the ledger)
  ↓ score: rescore changed stages → ledger rows                               ingest/score.ts
  ↓ contests: open/lock windows, run Autopilot at lock, settle                ingest/contests.ts
  ↓ standings: entry totals, ranks, tiebreaks, snapshots                       ingest/standings.ts
  ↓ realtime: pipeline version++ → open SSE streams recompute and push         sse.ts
  ↓ UI: Live GameDay, Match Center, entry page, leaderboards
```

`runPipeline` (`ingest/pipeline.ts`) runs these steps in order. Every step is idempotent, so running the pipeline twice changes nothing. Today it runs on demand: `ensureFresh` triggers it from page loads at most once a minute, and every 5 s while a live stream is open. Only one run happens at a time per process. In production this becomes a scheduled worker, with a push consumer for the provider's WebSocket.

**Locks don't depend on the pipeline.** Saving an entry checks the window's lock time against the server clock. A slow pipeline can delay results, but it can never let a late change through.

## Scoring engine and ledger

- **Deterministic.** `src/domain/scoring` is pure: the same normalized stats and the same rule-set version always give the same points. [SCORING_FAIRNESS.md](SCORING_FAIRNESS.md) §5 checks this by scoring 12 tournaments twice and comparing hashes.
- **Versioned rules.** Each contest pins a rule set (`cs2-v2`). Older sets (`cs2-v1`) stay registered so historic contests replay exactly.
- **Ledger rows** (`scoring_events`) record each map score, series win and advancement credit per player, with:
  - their **input hash** (the stats that produced them);
  - the rule set;
  - the score state (provisional, official or settled);
  - a `superseded_by_id` link.
- **Idempotent.** A row whose input hash and state are unchanged is skipped. Duplicate provider messages therefore never double-score.
- **Append-only corrections.** Changed stats create a new `player_map_stats` version and new ledger rows. The old rows are superseded, never edited, and `score_corrections` records the change. Standings are recomputed from the live (non-superseded) rows, so every total can be rebuilt from the ledger.
- **Captain bonus** is applied when entry totals are computed (`domain/entryScoring.ts`), from the roster version locked for each window. It is not stored on player rows.
- **Live maps are not in the ledger.** `live_maps` holds the latest snapshot for display, and map points for it are computed on read. Totals change only when a map completes (GAMEPLAY.md, G-1).

## Realtime

- **Transport: SSE.** Updates go one way (server to client), pass through proxies and CDNs as plain HTTP, and the browser's `EventSource` reconnects automatically. WebSockets would add a stateful upgrade path and buy nothing until clients need to send messages.
- **Endpoints:**
  - `/api/live/stream?entry=` sends a fantasy GameDay payload.
  - `/api/live/match/[matchId]` sends a Match Center payload.
- **Fan-out:**
  - One pipeline run per process serves every stream.
  - Each stream recomputes only when `pipelineVersion()` changes, and sends only when its payload hash changes.
  - Clients never poll providers.
- **Scaling path:**
  - Run the pipeline in a single worker that publishes "contest X changed" over Postgres `LISTEN/NOTIFY` (or Redis).
  - Web processes subscribe and recompute per contest, not per stream.
  - Cache the shared parts of each payload (match scoreboards, the top of the leaderboard) per contest version, so a thousand viewers of one match cost one computation.
- **Honesty:**
  - The stream reports `delayed` when the pipeline fails.
  - Payloads carry freshness timestamps.
  - The client shows Connecting, Live, Reconnecting, Delayed or Offline, plus a stale notice ([LIVE_DATA.md](LIVE_DATA.md#what-the-user-sees-when-data-is-late)).

## Server authority and security

| Concern | Implementation |
|---|---|
| Roster rules | `saveEntry` re-validates everything on the server, using the same domain functions as the client: size, cap (with acquisition prices), team limit (with window overrides), eligibility, captain, transfer count and lock. Client checks only drive the UI. |
| Concurrent saves | Each save is a single transaction. One entry per user per contest is enforced by a unique constraint (a race returns a clear "saved from another tab" error). Roster versions are numbered per entry and window. |
| Duplicate scoring | Ledger idempotency on the input hash (above). Match hashes skip unchanged matches. |
| Authentication | Username or email plus password. scrypt N=2¹⁷, r=8, p=1. Opaque random session tokens, stored hashed. httpOnly, SameSite=Lax cookies. A dummy hash on unknown users keeps login timing constant. |
| Authorization | Entry pages show a roster only after its window locks, unless you own it. League boards need membership. The OG image hides names before lock. Demo controls need a signed-in user. |
| Rate limits | In-process limits on sign-up, login, entry saves, league create and join, and demo controls. A shared store (Redis) is needed before running more than one process. |
| Input validation | Route handlers parse and bound every input. Errors return typed codes (`AppError`). |
| Secrets | Read only from server environment variables (`.env`, git-ignored). There are no provider keys in the client bundle and none in the repository. |
| Audit | `admin_audit_log` records Autopilot changes and settlement. `transfers` records every change with its kind (`free`, `discretionary` for strategic transfers, `autopilot`). |

## Replay mode

The demo provider (`providers/demo`) simulates tournaments from fixed seeds: Swiss pairing, BO1/BO3/BO5 series, and per-round player stats. It stores a packed snapshot after every round. `viewAt(time)` returns what a provider would report at that time:

- finished maps;
- the live map up to its last completed round;
- statuses.

The server clock (`clock.ts`) has an offset and a speed. "Watch live" sets the speed to 20×, so a map plays out in minutes through the real adapter, sync, ledger and SSE layers. Nothing on the client simulates updates.

## Known limits

- The pipeline runs inside web requests; a dedicated worker is needed for production.
- A demo tick takes about 3–4 s. A licensed live feed needs a live-only fast path that updates `live_maps` without a full sync.
- Rate limiting and pipeline single-flight are per process.
- There is no admin console; the data model and audit log for it exist.
