# Implementation plan

**Authoritative** for development milestones and their status. This file records what is built, how it was checked, and what is left. Status uses: **Done** (built and covered by tests or browser checks), **Partial** (built with known gaps, listed), **Not started**.

The milestones follow the master brief, Part 21. Each milestone keeps the earlier ones working; nothing is reported done that is untested.

## Milestone 1 — Foundation: Done

- Read the research (docs 01–09); contradictions are resolved in [docs/10](10-implementation-decisions.md) and [GAMEPLAY.md](GAMEPLAY.md).
- [DESIGN.md](DESIGN.md) holds the tokens and type scale (gap analysis in [docs/11](11-design-gap-analysis.md)).
- App shell:
  - five tabs: Home, Fantasy, Live, Leagues, Profile;
  - sport switcher, with LoL and VALORANT shown as "Coming later";
  - demo banner.
- Reusable components:
  - `src/components/ui`: buttons, sheets, chips, pills, identity art (silhouette portraits, name-driven crests, radar event art);
  - `motion` for animation and `vaul` for sheets.
- Development data: a deterministic demo universe of 32 fictional teams and 160 fictional players. Every tournament is simulated round by round.

## Milestone 2 — Core fantasy experience: Done

| Screen | Route | Notes |
|---|---|---|
| Home (conditional) | `/` | Hero CTA changes with state (Build, Edit, Make Transfers, Join Late, View My Team, View Standings). Shows a live card when your players are playing. |
| Tournament detail | `/t/[slug]`, plus `/fantasy`, `/matches`, `/bracket`, `/standings` | |
| Contest selection | `/t/[slug]/fantasy` | Main Event and Full Run for Majors |
| Roster builder | `/c/[contestId]/build` | Search, filters, sort, salary and roster validation, sticky summary, lineup sheet |
| Player details | `/players/[id]` and an in-builder sheet | Overview, Stats and Matches tabs; form chart |
| Roster reveal | Builder → Review | Captain-centred showcase; tap a player to make them captain |
| Entry confirmation | Builder → Done | Showcase, share, next steps |

## Milestone 3 — Persistent gameplay: Done

- Accounts: username or email plus password. OAuth providers are not started (no credentials).
- Postgres with Drizzle; three migrations.
- Server-side validation of size, cap, team limit, eligibility, captain, transfers and lock (ARCHITECTURE.md).
- Roster versions; one entry per user per contest, with concurrent-save protection.
- Lock at the scheduled start of the stage's first match.

## Milestone 4 — Live fantasy engine: Partial

**Done**
- Provider adapter boundary and normalized model.
- Demo replay provider with per-round snapshots.
- Deterministic `cs2-v2` scoring and an append-only ledger with corrections.
- SSE fan-out.
- Live GameDay at `/live`:
  - score card;
  - Playing now / Up next / Finished;
  - live map points;
  - activity feed derived from ledger rows;
  - Rival Watch;
  - league ranks;
  - connection and stale states.
- Match Center at `/live/match/[id]`.
- Per-map scoring breakdowns on the entry page.
- Leaderboards update from pipeline runs.
- Scoring fairness report: [SCORING_FAIRNESS.md](SCORING_FAIRNESS.md).

**Not done**
- Real team logos and player headshots. The UI renders `teams.logo_url` and `players.portrait_url` when present, and the sync stores them from the adapter. They need the provider's image rights in the contract; until then the demo uses generated crests and illustrated fictional players.
- A licensed provider adapter: GRID is recommended ([LIVE_DATA.md](LIVE_DATA.md)). Needs a contract, credentials and field verification.
- A dedicated ingestion worker and a live-only fast path. Today a tick takes about 3–4 s inside web requests.
- Cross-process fan-out (Postgres NOTIFY or Redis).
- Calibration on licensed historical data (G-9).

## Milestone 5 — Social competition: Partial

**Done**
- Global, friends and league boards; stage cups.
- Contest-scoped private leagues with invite codes and links, join, leave and member removal.
- One entry on many boards.
- Public profiles with current contests and tournament history.

**Not done**
- Persistent leagues that roll from event to event.
- Creator leagues and branding.
- Seasonal rankings and the career rating (G-8).
- League chat. Large chat is out of scope (brief Part 22).

## Milestone 6 — Tournament progression: Partial

**Done**
- Playoffs are modelled as QF, SF and Grand Final stages, each with its own window.
- Free replacements for eliminated players; 2 strategic transfers in Swiss windows and 1 in playoff windows.
- The team limit rises to 3 in the final window.
- Acquisition salary for kept players.
- Optional, deterministic, audited Autopilot.
- Results recap: placement, percentile, Fantasy MVP, captain bonus, best value, awards, league placements.
- Share card image (`/api/og/entry/[id]`) that hides names before lock.

**Not done**
- An Autopilot priority list (G-6).
- A separate transfer-management screen. Transfers happen in the builder; its review step lists who leaves and who arrives, with free and strategic counts.
- A notification centre and push or email reminders ("window opens", "lock in 1 hour", "your player is live").

## Milestone 7 — Full polish: Partial

**Done**
- Two screenshot QA passes at 375, 390, 430, 768 and 1440 px.
- axe checks on the main pages.
- Loading and error boundaries.
- Reduced-motion support.
- Data-honesty labels: demo data, provisional, official and settled states, stale notices.

**Not done**
- Admin console:
  - tournament configuration;
  - permanent roster changes and stand-ins (G-7);
  - disputes;
  - manual stats with two-person approval;
  - settlement confirmation.
- Settings and a notification centre.
- A guided, interactive onboarding (brief Part 14). Today: guests can build a full team without an account (the draft is kept on the device, sign-in is asked for at submit), and Home explains the game in three steps until the first entry.
- Light theme.
- Performance budget measured on real devices.

## Milestone 8 — Closed beta: Not started

Needs:
- a licensed data source (or a beta explicitly run on replayed demo data);
- a deployed environment with its own database;
- analytics events (brief Part 19);
- 50–200 invited users.

Success is measured by whether people complete the full loop (draft, follow, transfer, finish) and come back for a second event. The open questions in [GAMEPLAY_OPEN_QUESTIONS.md](GAMEPLAY_OPEN_QUESTIONS.md) list what the beta must answer.

## How work is verified

| Check | Command |
|---|---|
| Types | `npx tsc --noEmit` |
| Lint | `npm run lint` |
| Unit and integration (Postgres) | `npm test` |
| End to end, accessibility, desktop | `npm run test:e2e` (production build) |
| Fairness report | `npx tsx scripts/fairness-report.ts > docs/SCORING_FAIRNESS.md` |
| Screenshots | `docs/screenshots/` |
