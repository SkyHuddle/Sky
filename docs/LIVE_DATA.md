# Live data

**Authoritative** for data sources, provider coverage and usage rights, and how live updates behave in the app. How the pipeline is built is in [ARCHITECTURE.md](ARCHITECTURE.md). What a live score means for the game is in [GAMEPLAY.md](GAMEPLAY.md#score-states).

## Status today

| | State |
|---|---|
| Licensed live feed | **None.** No provider contract or credentials exist. pandascore.co and grid.gg were not reachable from the build environment. |
| What the app runs on | A **demo replay provider**: fictional teams, players and tournaments, simulated round by round and replayed through the real adapter, ingestion, scoring and realtime layers. Every screen says "Demo data". |
| Verified end to end | Demo replay → adapter → `live_maps` / ledger → SSE → Live GameDay and Match Center, in the browser. |
| Not verified | Any real provider. **No claim is made that a real live feed works.** `src/server/providers/pandascore/adapter.ts` is a stub that throws instead of returning data. |

## Sources: what we found

Research date: 2026-10-10. This is not legal advice.

The sites themselves were blocked from the build environment, so every finding comes from search extracts of the vendor or publisher pages. The full notes, with a source for every claim, are in [research/live-data-sources.md](research/live-data-sources.md). Labels: **[V]** official or primary source, **[S]** secondary, **[?]** unverified.

### Counter-Strike 2 (launch game)

- **Rights belong to the tournament organiser, not to Valve.** No single vendor covers every event.

| Provider | Live per-player stats | Holds rights for | Fantasy terms |
|---|---|---|---|
| **GRID** | Yes. Series State is GraphQL (team and player stats). Series Events is WebSocket play-by-play (kills, rounds, bomb, clutches) [V] | **ESL FACEIT Group exclusively from Aug 2025** (IEM, ESL Pro League); Elisa, NSTLGA, Kokonister, EWC 2025; BLAST since 2024 (current status [?]) [V] | "Betting & Fantasy" is its own commercial tier. Custom pricing [V] |
| **PandaScore** | Live Basic from €1,000 per game per month (scores and player stats). Live Pro (quote only): play-by-play, plus frames every 2 s. Not every match has live data [V] | Not stated [?] | Stats plans are for non-betting customers only. Whether free fantasy counts as "betting-related" is ambiguous [V/?] |
| **Bayes / Abios** | Yes, live match data [V] | Lost ESL FACEIT Group to GRID. Current portfolio [?] | Contract only. Betting-focused, but markets to fantasy [V] |
| **Runestone** | Unknown [?] | Reported for PGL's CS2 circuit through 2029 [S] | Unknown [?] |
| **Oddin.gg** | Not documented for fantasy [?] | Exort Series; PGL Copenhagen Major 2024 [S] | Betting-oriented |
| **GRID Open Access** | **Historical only**, CS2 and Dota 2. Free for startups and researchers [V] | — | Useful for calibrating scoring, but confirm it allows internal test use |
| **CS2 Game State Integration** | Only on a server or observer you control [V] | — | Fine for our own test matches; **not** for pro matches, whose data rights are sold exclusively |
| **HLTV** | No API | None | **Not used.** Scraping is unauthorized |

### League of Legends (later)

- **The lolesports.com endpoints** (`getLive`, `getSchedule`, `getEventDetails`, `livestats/v1/window`, `livestats/v1/details`) are community-documented.
  - They expose schedules, live matches and per-player frames (KDA, CS, gold, items).
  - Authentication is a shared, publicly posted `x-api-key`. It is unsupported and can be rotated at any time.
  - Cadence: community clients poll every 10 s; the data is reported to run about 3 minutes behind.
  - Coverage per league (including the LPL) is unverified.
- **Usage rights:** none found. Riot states that live and fixture data are "only available for commercial purposes through GRID" [V]. **Being publicly reachable does not grant commercial rights. We will not ship on these endpoints.**
- **Riot developer policies** ban betting and gambling, and Riot lists fantasy operators as prohibited tournament sponsors [V]. Riot's position on free fantasy is unverified.

### VALORANT (later)

- **GRID is the exclusive commercial distributor** of live VALORANT data [V].
- GRID Open Access has no VALORANT data.
- PandaScore has **no live VALORANT plan**; only post-game and historical data [V].
- vlr.gg has no API. Scrapers exist but have no rights. **Not used.**
- **Do not assume VALORANT works like CS2 or LoL:** the only live route is GRID.

### Recommendation

1. **Beta:** the demo replay harness (built). Optionally add GRID Open Access history to calibrate scoring, and our own GSI test matches.
2. **Launch:** license **GRID** for CS2. It covers the largest tier-1 portfolio and is the only route to LoL and VALORANT later. Use PandaScore Live Pro only if they confirm in writing that free fantasy is not "betting-related". Add Bayes or Runestone only if required events (for example PGL) fall outside GRID.
3. **Get in writing before signing:**
   - which tier free fantasy falls under, and its price;
   - the tournament list and rights expiry dates;
   - the exact fields (K/D/A, damage, multikills, clutches);
   - latency and SLA;
   - display, storage and redistribution rights;
   - player names and likeness, and attribution;
   - whether free prizes change the classification;
   - sandbox or replay access for testing.

## How live updates behave

### What the provider gives us, and what we show

The app shows only what the feed actually provides.

| The feed provides | The app shows |
|---|---|
| A per-round **scoreboard snapshot** (round score, each player's K/D/A and other counted stats) | Map score, round number, player stat lines, live **map points** per player |
| Completed map stats | Map points move into the series average, totals update, and an activity item appears |
| Series result | Series win and advancement credit, totals update, score state becomes Official |
| A correction | New ledger rows supersede the old ones. The series is marked "Corrected" and a feed item says "Score corrected" |

**The demo feed is snapshot-based,** like PandaScore frames or GRID Series State. So the Match Center shows scoreboards and the score, **not a kill-by-kill feed**. It never invents round-by-round events the provider didn't send (brief Part 8.3). Activity items come only from ledger rows and standings snapshots. There are no generated messages.

### Pipeline cadence

| Step | Interval | Code |
|---|---|---|
| Provider sync (all live matches, one process) | At most every 5 s while anyone is watching; otherwise once a minute on page load | `ensureFresh`, `src/server/fresh.ts` |
| Each open stream checks for a new pipeline run | 4 s | `src/server/sse.ts` |
| Stream sends | Only when its payload changed | Payload hash |
| Keep-alive | 15 s comment ping; the browser retries after 3 s | |

**Fan-out.** One ingestion run per server process serves every open stream. Browsers never contact a provider. Provider credentials (when there are any) are read only on the server, from environment variables.

**Measured cost.** A demo pipeline tick takes about 3–4 s locally. That's acceptable for the demo, but a licensed feed needs a dedicated worker and a cheaper live-only sync ([IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)).

### Reliability rules (implemented)

- **Duplicate messages:** each match is hashed (the live map is excluded). An unchanged match is skipped, and the ledger is idempotent on its input hash.
- **Out-of-order snapshots:** a live snapshot older than the stored one, or with fewer rounds played, is ignored.
- **Multiple tournaments:** live-map rows are scoped to their own tournament, so one sync can't delete another tournament's live state.
- **Provider failure:** the pipeline catches the error, the app stays up, and the stream sends `delayed`.
- **Incomplete maps:** they are never added to totals (G-1).

### What the user sees when data is late

| Condition | Shown |
|---|---|
| Connecting | "Connecting" chip |
| Stream connected, data fresh | "Live" chip, plus "Updated Ns ago" |
| Connection dropped | "Reconnecting" chip. The browser reconnects by itself |
| Device offline | "Offline" chip |
| Pipeline error | "Data delayed" chip |
| A live map has had no new snapshot for 10 minutes (demo clock), **or** no successful sync for 3 minutes | A **stale notice** above the scores: "Live stats are delayed", with the time of the last update. Numbers stay visible but are clearly marked |

### Replay mode (development and demos)

- **Demo controls:**
  - **"Watch live"** jumps the server clock to just before the next match and runs it at 20× speed.
  - **"Back to real time"** stops the speed-up.
  - **"Skip ahead"** jumps to the end of the next stage.
- **What drives the replay:** the simulator records a snapshot after every round. `viewAt(time)` exposes only the rounds completed by the clock's time, and never the final round early.
- **How updates travel:** they go through the real adapter, sync, scoring and SSE layers. The front end receives real application updates. Nothing on the client increments numbers by itself.
- **Labelling:** demo data is labelled on every screen. Demo controls need a signed-in user and are rate-limited. They only exist when `DEMO_MODE=true`.

## Restrictions we follow

- No scraping of HLTV, Liquipedia, VLR or any other site.
- No use of lolesports.com endpoints, or of GSI from pro matches, without a licence.
- No provider credentials in client code, and none committed to the repository.
- Demo results are never presented as real tournament data.
- No win probabilities, odds or predictions.
