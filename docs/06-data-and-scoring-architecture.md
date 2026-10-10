# 6. Data and scoring architecture

Covers deliverable 8 and Part 7. Provider facts are labelled **[V]** verified or **[S]** secondary; design is **[R]**.

## Part A: Data providers

### Who controls the data

| Game / organiser | Official data distributor | Evidence |
|---|---|---|
| League of Legends (Riot) | **GRID**, exclusive; took over from Bayes in the 2024-25 season | [V] [riotesportsdata.com](https://riotesportsdata.com/en-us/league-of-legends/), [GRID](https://grid.gg/riot-games-and-grid-announce-exclusive-global-esports-data-partnership/) |
| VALORANT (Riot) | **GRID**, exclusive | [V] [riotesportsdata.com](https://riotesportsdata.com/en-us/valorant/) |
| CS2: ESL FACEIT Group (IEM, ESL Pro League, ESL One) | **GRID**, exclusive from IEM Cologne 2025, multi-year | [V] [GRID–EFG](https://grid.gg/esl-faceit-grid-esports-data-partnership/), [Dot Esports](https://dotesports.com/gambling/news/grid-exclusive-data-rights-esl-faceit-cs2-dota2) |
| CS2: BLAST | GRID lists BLAST among its direct agreements; exclusivity terms not public | [S] [GRID live data](https://grid.gg/products/live-data/) |
| CS2: Elisa events | GRID, exclusive through 2027 | [V] [GRID](https://grid.gg/grid-secures-exclusive-elisa-esports-data-rights-through-2027/) |
| CS2: PGL (runs the Singapore Major, Nov–Dec 2026) | **Unknown.** Must be confirmed before any Major contest | [Not found] |
| CS2: Valve Majors overall | Rotate between organisers; data rights follow the organiser | [I] |

**Implication:** GRID is the most likely primary partner for every game we want. Any plan should begin with a GRID conversation. [I]

### Provider comparison

| | GRID | PandaScore | Bayes Esports | Abios (Kambi) | Liquipedia API |
|---|---|---|---|---|---|
| **Games** | LoL, VALORANT, CS2, Dota 2, R6, PUBG, and others [V] | LoL, CS2, Dota 2, VALORANT, and others [V] | Lost Riot rights to GRID [V]; current CS2 coverage unclear | CS2, Dota 2, LoL (2021) [S] | Every game, tournament structure |
| **Official?** | Yes, for Riot and many TOs | Mostly aggregated; check per event | Was official for LoL | Unclear | Community wiki |
| **Pre-match** (fixtures, rosters, formats) | Yes | Yes (free tier: calendar and pre-match, 1,000 requests/h) [V] | ? | Yes | Yes, best for formats and brackets |
| **Post-match player stats** | Yes | "Historical & Post-Match" from **€400 per game per month** [V] | ? | Yes | Partial |
| **Live in-match** | Yes, real-time from game servers [V] | From **€1,000 per game per month**. CS2 frames about every 2 s; play-by-play events need Pro Live [V] | Yes | Yes | No |
| **Fantasy use** | Has a "Betting & Fantasy" tier (custom quote); powers Spectatr/FanClash, E-GO and PUBG fantasy [S] | Stats plans "only available to customers with non-betting usage" [V]; powered Sleeper's esports fantasy [V] | — | Betting-focused | Free tier is non-commercial only; commercial plans available [V] |
| **Free option** | Open Access for pre-revenue startups and independent developers; may exclude series events data [V/S] | Free tier (static and pre-match) [V] | — | — | Free for non-commercial use, 60 requests/h [V] |
| **Images and logos** | Unknown | Unknown; image rights usually belong to teams, players and publishers [S] | — | — | Some media CC-BY-SA |

### Answers to Part 7's ten questions (CS2 MVP)

| # | Question | Answer |
|---|---|---|
| 1 | Pre-match data | Fixtures, teams, rosters and stage formats are available from PandaScore's free tier and GRID; tournament formats best from the Liquipedia API (paid for commercial use). [V] |
| 2 | Player stats | Kills, deaths, assists and economy are confirmed in PandaScore's CS2 feeds [V]. Opening kills, multi-kills and clutches are **unconfirmed**; they may need to be derived from play-by-play (Pro Live) or GRID's series events. **Must verify before finalising the scoring table.** |
| 3 | Live or post-match | Both exist; live costs about 2.5x on PandaScore [V]. Recommendation: post-map at launch. |
| 4 | Historical coverage | Needed for prices and calibration (20+ events). PandaScore's historical tier covers this [V]; GRID's depth unknown. |
| 5 | Pricing | PandaScore: €400 per game per month (historical and post-match), €1,000+ (live) [V]. GRID: custom quote. Liquipedia: commercial plans, price not found. |
| 6 | Refresh and latency | PandaScore live frames about every 2 s [V]. Post-match latency not published; measure in a trial. |
| 7 | Tiers and esports covered | GRID: official for Riot and over 70 CS2/Dota tournament organisers [S]. PandaScore: broad. |
| 8 | Is the scoring possible with each feed? | K/D/A and map results: yes with any. Opening kills, multi-kills, clutches: needs play-by-play or derived events. Plan a fallback scoring table without them. |
| 9 | Names, images, logos, branding | Player names and stats are generally usable as facts in US fantasy (CBC v. MLBAM [S]), but **logos are trademarks** and **photos are owned by teams or photographers**. Event and league marks need permission; Riot policy restricts unofficial use of its esports marks. [S] [Riot policy](https://developer.riotgames.com:443/policies/oce-tournaments) Launch with typographic player cards and text team tags; seek licences for logos and photos. |
| 10 | Caching, display, commercial use | Contract-specific. Must be written into the provider agreement: caching period, display in a free fantasy product, use in sponsored prize contests, and retention after contract end (needed for career history). |

**Do not use scraped HLTV, Liquipedia (outside the API), VLR or gol.gg data.** Liquipedia forbids automated access to its HTML pages [V]; HLTV's terms weren't retrieved, and scrapers' existence isn't permission. [S]

### Data plan

| Phase | Source | Cost (indicative) |
|---|---|---|
| **Prototype (now)** | PandaScore free tier (fixtures, rosters) + GRID Open Access application (CS2 stats, if accepted as pre-revenue) | €0 |
| **MVP (CS2)** | GRID commercial (fantasy tier) **or** PandaScore Historical & Post-Match for CS2 (€400/month) + Liquipedia commercial API for formats | ~€400–1,500/month plus Liquipedia |
| **Phase 2** | Add live (PandaScore €1,000/month for CS2, or GRID live) | +€600/month or GRID quote |
| **Phase 3** | LoL and VALORANT via GRID (Riot exclusive) | GRID quote, per game |

Have two providers for CS2 where possible: the primary for scoring, a secondary to cross-check results before settlement.

---

## Part B: Platform architecture

### Domains (separate modules, separate tables)

```
Esports domain (from providers, read-mostly)
  Game · Event · Stage · Match · Map · Team · Player · TeamRoster (dated)
  PlayerMapStats (versioned) · ProviderRecord (raw payloads)

Fantasy domain (ours)
  ScoringRuleSet (versioned) · Contest · ContestWindow · PlayerPrice · Eligibility
  Entry · EntryRoster (one row per window: players, captain, transfers used)
  ScoringEvent (append-only ledger) · EntryScore (materialised) · Leaderboard snapshots

Social domain
  User · Profile · League · LeagueMembership · Invite · Follow (P2) · Trophy · CareerRating

Operations domain
  AdminAction (audit log) · Correction · Dispute · FeedHealth · Notification
```

Rules that matter:
- **Leaderboards are derived,** never written by hand.
- **Leagues reference entries;** they don't own them.
- **Stats are versioned:** a correction from the provider creates a new version, never an overwrite.

### The scoring ledger

Every point a user ever sees comes from an append-only ledger:

```
ScoringEvent
  id, contest_id, player_id, match_id, map_id,
  rule_set_version, stats_version,
  component      (kill | death | assist | opening_kill | multikill | clutch | map_win
                  | series_win | ot_cap | format_weight | advancement_credit),
  quantity, points,
  state          (provisional | official | settled),
  supersedes_id  (when a correction replaces an earlier event),
  created_at
```

- **Player score for a series** = the sum of current (non-superseded) events. Entry score = the sum over its rostered players for the windows they were rostered in, with captain applied.
- **A correction** writes new events that supersede old ones. History stays visible ("assist count corrected 4 → 3 by official data, −1.0").
- **A rule change** never rewrites history. Contests pin a `rule_set_version`. A full replay from `PlayerMapStats` under any rule version must produce identical results (tested in CI).
- **The breakdown UI reads straight from the ledger,** so what users see is exactly what was summed.

### Ingestion pipeline

```
Provider webhook/poll ─► Raw store (ProviderRecord, immutable)
                        ─► Normaliser (provider format → PlayerMapStats vN)
                        ─► Validator (checks below) ─► Scoring worker ─► Ledger
                                                                   ─► Leaderboard recompute
                                                                   ─► Notifications
```

**Validator checks before scoring:**
- Team kills in a map equal the other team's deaths (± suicides).
- Rounds played match the map score.
- Every rostered player has a stats row, or is marked as not having played.
- Match is in the expected stage.
- The second provider agrees on map winners.

Failures go to the admin queue; scores stay provisional.

**Leaderboards:**
- **Store:** sorted sets (e.g. Redis) keyed per board, rebuilt from EntryScore after each scoring batch.
- **Snapshots:** taken at each settlement for history and "movement since last visit".
- **Scale:** at 100k entries, a full recompute is cheap; the incremental path is an optimisation, not a requirement.

### Contest lifecycle and locks

```
draft ─► open ─► locked(window n) ─► window_open(n+1) ─► locked(n+1) … ─► settling ─► settled ─► archived
```

- **Locks are enforced server-side** by comparing request time to the window's lock timestamp (derived from the scheduled first match and re-evaluated when the schedule changes).
- **Edits after lock are rejected** with a clear error; the client also disables them.
- **Autopilot** runs as a job at each window's close, logged as `AdminAction(actor=system)`.

### API surface (public, versioned)

| Endpoint | Purpose |
|---|---|
| `GET /events?game=&status=` | Event lists |
| `GET /events/{id}` | Event, stages, schedule, contests |
| `GET /contests/{id}/players` | Pool with prices, eligibility, stats summaries |
| `PUT /contests/{id}/entry` | Create or update the user's entry (validates cap, team limit, lock) |
| `GET /entries/{id}` | Entry, roster per window, score, breakdown |
| `GET /contests/{id}/leaderboards/{board}?around=me` | Global, stage, friends, league boards |
| `GET /players/{id}` | Player detail and history |
| `POST /leagues` · `POST /leagues/{id}/join` | Leagues and invites |
| `GET /users/{id}/career` | Career and history |
| `POST /disputes` | Report a score |

Validation errors return machine-readable codes (`OVER_CAP`, `TEAM_LIMIT`, `LOCKED`, `INELIGIBLE_PLAYER`, `TRANSFER_LIMIT`) that the client maps to inline messages.

### Admin workflows

| Situation | Workflow |
|---|---|
| **Stand-in announced** | Admin marks the roster change (date-effective) → the stand-in is added to the pool at the flat price for the next window → affected entries flagged for free replacement → users notified. |
| **Postponed match** | The schedule sync detects a change → the lock is recomputed if it was the stage's first match → users notified if the lock moved → scoring waits for the match. |
| **Cancelled / forfeit** | Admin marks the series result type → advancement credit applied → audit note. |
| **Feed outage** | Feed health monitor alerts → scores frozen as provisional with a banner ("Stats delayed from data provider") → manual entry from the official match page only with two-person approval, marked as such in the ledger. |
| **Disputed stat** | Dispute queue → compare to the second provider and the organiser's official page → if the feed is wrong, request a provider correction; manual override with two-person approval if it isn't fixed before settlement. |
| **Settlement** | 24 hours after the stage ends: checklist (no open disputes, validators green, all matches official) → admin confirms → state becomes settled → leaderboards snapshotted. |
| **Final results** | After the last settlement: rewards and trophies issued, career ratings updated, share cards generated. |

Every admin action is in `AdminAction` with the actor, reason and before/after values.

### Suggested stack (for discussion)

| Concern | Choice | Why |
|---|---|---|
| Web app | TypeScript, React (Next.js), installable PWA | Mobile-first web reaches everyone without app-store review; native apps later if retention justifies it. |
| API | TypeScript (Node) or Go; REST with OpenAPI | One language across client and server keeps a small team fast. |
| Database | PostgreSQL | Relational integrity for contests and entries; the ledger is plain append-only tables. |
| Leaderboards and cache | Redis | Sorted sets fit ranking. |
| Jobs | A durable queue (e.g. a Postgres-backed queue) | Ingestion, scoring, Autopilot, notifications. |
| Auth | OAuth (Google, Discord, Steam OpenID) + email | Discord matters for communities; Steam OpenID for CS fans. Never ask for Steam authentication codes. |
| Hosting | Managed cloud, single region at launch | Cost; the ledger makes multi-region unnecessary early. |
