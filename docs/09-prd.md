# 9. Product requirements document: CS2 Tournament Fantasy (Phase 1)

Status: **draft for review**. Scope: Phase 1 only. Phases 2–3 are summarised in the [roadmap](07-roadmap-business-retention.md#phases).

This document is written to be implemented by an AI coding assistant and a development team. It references the other documents for reasoning; the requirements below are authoritative where they differ.

## 1. Summary

A free, mobile-first web app where CS2 fans build a five-player fantasy team for a real tournament, score points from real match performances, and compete globally, with friends and in community leagues, across the whole event.

**Success at the end of Phase 1** (first 2027 Major):
- At least 70% of users who open the lineup builder confirm a lineup.
- Median build time under 3 minutes for first-time users.
- At least 40% of entries belong to at least one league.
- At least 35% of users who entered one event enter the next.
- Under 1 dispute per 1,000 player-maps; no settled result reversed.

## 2. Users

| Persona | Need | Phase 1 support |
|---|---|---|
| Tournament watcher | Quick entry, stays involved | Suggested team, Autopilot, notifications, friends' boards |
| Fantasy regular | Depth, fairness, transparency | Value sorting, ownership after lock, transfers, per-map breakdowns |
| Community host | Run a league for a group or audience | Leagues with invite links, public boards, share cards |

## 3. Glossary

| Term | Meaning |
|---|---|
| Event | A real tournament (e.g. a CS2 Major) |
| Stage | A phase of an event (Stage 1–3, Playoffs, Group, etc.) |
| Contest | A fantasy game on an event (e.g. "Main Event") |
| Window | The period before a stage's lock when entries can be changed |
| Entry | One user's team in one contest (one per user per contest) |
| League | A persistent group of users; shows members' entries; not a separate game |
| Board | A leaderboard view: global, stage, friends or league |
| Ledger | Append-only record of every scoring event |

## 4. Functional requirements

### 4.1 Events and data

| ID | Requirement | Acceptance criteria |
|---|---|---|
| EV-1 | Import events, stages, teams, rosters, schedules and results from licensed providers | An event appears with stages, teams and scheduled matches within 1 hour of the provider publishing them |
| EV-2 | Represent stage formats: Swiss (with entry stage per team), groups, single and double elimination | A Major shows three Swiss stages with correct entry stages, and an 8-team playoff |
| EV-3 | Show schedule and bracket per stage | Swiss standings (W-L) and the playoff bracket render on mobile and desktop |
| EV-4 | Version all stats; never overwrite | A provider correction creates a new stats version, visible in the audit log |
| EV-5 | Validate every match before scoring (see [validator](06-data-and-scoring-architecture.md#ingestion-pipeline)) | A failing check keeps the match provisional and creates an admin task |

### 4.2 Contests and rules

| ID | Requirement | Acceptance criteria |
|---|---|---|
| CO-1 | Contests per event; for Majors, "Main Event" (from Stage 3) and "Full Run" (from Stage 1) | Both appear on the event page with their own lock times |
| CO-2 | Roster: 5 players, $1,000,000 cap, at most 2 per team, exactly 1 captain | The server rejects invalid rosters with `OVER_CAP`, `TEAM_LIMIT`, `ROSTER_SIZE` or `CAPTAIN_REQUIRED` |
| CO-3 | Prices $100k–$300k in $5k steps, fixed for the contest; generated from historical stats with an admin override | Every eligible player has a price before the contest opens; overrides are audited |
| CO-4 | Pool eligibility: players on teams playing in the current or later window's stage, per contest rules | Players from eliminated teams can't be added; players not yet entering are labelled |
| CO-5 | Lock at the scheduled start of each window's first match; recompute when the schedule changes | Edits after lock return `LOCKED`; a moved schedule updates the countdown and notifies entrants |
| CO-6 | Windows: free replacement of eliminated players + 2 discretionary transfers; captain re-pick | Using a third discretionary transfer returns `TRANSFER_LIMIT`; replacing an eliminated player doesn't count |
| CO-7 | Autopilot, on by default: at window close, replace eliminated players with the most-picked affordable eligible player; move the captaincy if needed | An inactive entry with 2 eliminated players has 2 valid replacements after the window closes, marked "Auto" |
| CO-8 | Late entry until the final window's lock; points count from entry | A user joining at Stage 3 appears on the global board with Stage 3 points onward |
| CO-9 | Rules page per contest, pinned to a rule-set version | Changing rules for future contests doesn't change a running contest's scores |

### 4.3 Scoring

Rules as specified in [CS2 scoring](04-gameplay-and-scoring.md#model-c-recommended-per-map-events-averaged-per-series) and [universal rules](04-gameplay-and-scoring.md#universal-rules-all-esports). All values configurable per rule-set version.

| ID | Requirement | Acceptance criteria |
|---|---|---|
| SC-1 | Per-map event points (kill, death, assist, opening kill, multi-kill round, clutch, map win) | The worked examples in the scoring doc reproduce exactly in unit tests |
| SC-2 | Overtime cap at 24 rounds (scale down only) | A 30-round map's event points are multiplied by 0.8 |
| SC-3 | Series score = average of map scores + series win bonus, × format weight | Examples 1–4 reproduce exactly |
| SC-4 | Advancement credit for unplayed series in Swiss and group stages | Example 5 reproduces exactly |
| SC-5 | Captain ×1.5 on the captain's points for the windows they were captain | Changing captain at a window applies the multiplier only from that window |
| SC-6 | Did-not-play, forfeit, cancellation and stand-in handling per universal rules | Each case has a unit test |
| SC-7 | Ledger: every point is a ScoringEvent with component, rule version, stats version and state | The sum of ledger events equals displayed scores for every entry (nightly consistency job) |
| SC-8 | Replay: recompute any contest from stored stats under its rule version | Replay output equals stored scores in CI |
| SC-9 | States: provisional → official → settled (24 h after stage end, admin-confirmed) | Boards display the state; settled scores change only via an audited admin correction |
| SC-10 | Fallback rule set if the feed lacks opening kills, multi-kills or clutches | A rule set with only K/D/A and map/series results can be selected per contest before it opens |
| SC-11 | Tiebreak: total → captain points → fewer discretionary transfers → earlier final submission → shared rank | No random element anywhere in ranking |

### 4.4 Lineup builder

| ID | Requirement | Acceptance criteria |
|---|---|---|
| LB-1 | Usable without an account; the lineup is stored on the device until sign-up | A signed-out user can build a full lineup and is asked to sign in only at "Confirm" |
| LB-2 | "Suggest a team" produces a valid lineup (most-picked within budget; "balanced" when ownership isn't yet available) | One tap gives a valid 5-player lineup with a captain |
| LB-3 | Player list with search, team filter, price filter, "fits my budget"; sort by price, points per map, value, most picked (after lock) | Filtering 160 players responds in under 100 ms on a mid-range phone |
| LB-4 | Invalid options disabled with the reason inline | A third player from one team shows "2 from Team X already" and can't be added |
| LB-5 | Sticky budget bar: remaining salary and average per open slot | Updates instantly on every add or remove |
| LB-6 | Review screen: roster, captain, total, lock time in local time, Autopilot toggle | Confirming shows the lock time and the share/invite options |
| LB-7 | "Start from your last team" for returning users | Prefills still-eligible players at current prices |

### 4.5 Player detail

| ID | Requirement | Acceptance criteria |
|---|---|---|
| PD-1 | Bottom sheet with: price, team, last 10 maps' fantasy points (chart), average, consistency, upcoming opponents, schedule; ownership after lock | All values trace to the ledger or stats tables; no unlicensed metrics |
| PD-2 | No projections in Phase 1 | No predictive number appears anywhere |

### 4.6 Live view and leaderboards

| ID | Requirement | Acceptance criteria |
|---|---|---|
| LV-1 | Entry view: total, rank, percentile, movement, state; per-player status (live, next match, done, eliminated) | Status matches the schedule within 5 minutes |
| LV-2 | Per-player breakdown by series and map, showing every ledger component | Tapping a number links to the match detail |
| LV-3 | Updates after every map (from post-map data) | A map's points appear within 15 minutes of the provider publishing stats |
| LV-4 | Boards: global, stage, friends, each league; "around me" with the user's row pinned | A 100,000-entry board loads the user's neighbourhood in under 500 ms |
| LV-5 | Compare any row's roster with yours | Shared players highlighted |

### 4.7 Leagues

| ID | Requirement | Acceptance criteria |
|---|---|---|
| LG-1 | Create a league in 3 steps (name, game, scope), with an invite link | Link generated immediately; owner can regenerate it |
| LG-2 | Joining a league attaches the user's existing entries; no re-entry | After joining, the user's current entry appears on the league board instantly |
| LG-3 | League persists across events; shows this event's board and history | A league created for Event A shows Event B automatically when members enter it |
| LG-4 | Public or link-only; owner can remove members | Removed members disappear from the board; their entries are unaffected |
| LG-5 | No limit on leagues per user in Phase 1 (rate-limited joins) | A user in 20 leagues sees one entry in all 20 |

### 4.8 Accounts, profile, notifications

| ID | Requirement | Acceptance criteria |
|---|---|---|
| AC-1 | Sign-in: Google, Discord, Steam OpenID, email magic link | No password storage; never request Steam authentication codes |
| AC-2 | Profile: username, avatar, favourite game, event history (rank, percentile, points, roster) | Every completed entry appears in history after settlement |
| AC-3 | Notifications (email and web push): event open (leagues), lock reminders 24 h and 2 h (only if no entry), window open, live (opt-in, once per match day), final results | Each type can be turned off individually |
| AC-4 | Share card image for final results and for "I entered" | Generated server-side; contains no personal data beyond username |

### 4.9 Administration

| ID | Requirement | Acceptance criteria |
|---|---|---|
| AD-1 | Manage roster changes, stand-ins, schedule changes, forfeits | Each action logged with actor, reason, before/after |
| AD-2 | Dispute queue linked to ledger entries | A dispute shows the stats from both providers side by side |
| AD-3 | Manual stat entry only with two-person approval, marked in the ledger | Single-person submissions can't be applied |
| AD-4 | Settlement checklist and confirmation per stage | Settlement is blocked while disputes are open or validators fail |
| AD-5 | Feed health dashboard and banner control | Turning on "stats delayed" shows a banner on affected live views |

## 5. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | Builder interactive in under 2 s on a mid-range phone over 4G; entry save under 300 ms at the 95th percentile |
| Load | Sustain 2,000 entry saves per minute in the last 10 minutes before lock |
| Availability | 99.9% during event days; the read paths (live view, boards) degrade to cached data rather than fail |
| Accessibility | WCAG 2.2 AA; tabular numbers; reduced motion respected; colour never the only signal |
| Security | OAuth only; rate limits on joins, saves and disputes; server-side validation of every rule |
| Privacy | GDPR/CCPA-ready; data export and deletion; profiles can be friends-only |
| Integrity | No purchases affecting gameplay; no random tiebreaks; full audit log |
| Localisation | English at launch; strings externalised; times in the user's time zone; currency shown as fictional "$" only |
| Analytics | Events for the success metrics in section 1, without third-party ad trackers |

## 6. Out of scope (Phase 1)

Pick'Ems, creator branding, career rating, live in-match scoring, chat, projections, boosters, LoL, VALORANT, draft leagues, native apps, any payment.

## 7. Dependencies and decisions needed before build

1. **Data contract** (GRID or PandaScore) confirming the CS2 fields and fantasy use. Blocks SC-1 vs SC-10.
2. **Tournament format source:** Liquipedia commercial API or the provider's structure data.
3. **Legal review** of free prize contests, only if prizes are offered in Phase 1.
4. **Working name and visual identity.**
5. **Back-test results** fixing the format weights, advancement credit and price model.

## 8. Release plan

1. **Closed alpha:** the PGL Singapore Major (Nov–Dec 2026), a minimal builder and board, invited users.
2. **Public beta:** early-2027 CS2 events, full Phase 1 scope, no prizes.
3. **Launch:** the first 2027 Major, with a sponsored prize contest if legal review and sponsors allow.
