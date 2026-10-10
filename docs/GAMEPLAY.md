# Gameplay rules (CS2 Tournament Fantasy)

**Authoritative** for how the game is played: rosters, windows, transfers, captains, Autopilot, ranking and score states. Where this file disagrees with docs/04 or docs/09, this file wins. Those documents keep the research and reasoning behind the rules; they are not edited to hide earlier assumptions.

- **Scoring formula** (points per event, overtime, averaging, advancement credit): [docs/04](04-gameplay-and-scoring.md#model-c-recommended-per-map-events-averaged-per-series), pinned as rule set `cs2-v2`. The evidence for it is in [SCORING_FAIRNESS.md](SCORING_FAIRNESS.md).
- **Unresolved rules:** [GAMEPLAY_OPEN_QUESTIONS.md](GAMEPLAY_OPEN_QUESTIONS.md). Every rule below that is still a proposal links to its question there.
- **Configurable per tournament:** everything in the table under "Rule values" is stored per contest (`contests.rules`) or per window (`contest_windows.transfers_allowed`, `contest_windows.max_per_team`). Changing a value means creating the contest with different values, not editing code. There is no admin screen for this yet ([IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md), milestone 7).

## The shape of the game

One draft, then light management between stages. Never a mandatory redraft.

1. **Draft** five players under the salary cap before the first lock.
2. **Follow** them through the stage. The lineup is locked while the stage is played.
3. **Manage** at each transfer window between stages. Eliminated players are free to replace; a small number of other changes are allowed.
4. **Points carry through** the whole tournament. A transfer never changes points already earned.
5. **Finish** with a final placement, a recap and stage cups.

## Rule values

| Rule | Default | Where it lives |
|---|---|---|
| Roster | 5 players | `rules.rosterSize` |
| Salary cap | $1,000,000 (fictional, no money involved) | `rules.salaryCap` |
| Prices | $100K–$290K in $5K steps, set per window from history up to that window | `player_prices`, `roster_selections.price` |
| Team limit | At most 2 players from one team | `rules.maxPerTeam` |
| Team limit, Grand Final window | At most 3 from one team (only two teams remain, so 3 + 2 is the only way to field five) | `contest_windows.max_per_team = 3` |
| Captain | One captain scores 1.5× | `rules.captainMultiplier` |
| Strategic transfers, Swiss windows (Full Run only) | 2 per window | `rules.transfersPerWindow` |
| Strategic transfers, playoff windows (QF, SF, Final) | 1 per window ([G-4](GAMEPLAY_OPEN_QUESTIONS.md#g-4-playoff-transfer-count)) | `contest_windows.transfers_allowed = 1` |
| Replacing an eliminated player | Always free, never counts as a transfer | Domain rule |
| Unused transfers | Do not carry over | Domain rule |
| Ownership | Non-exclusive: any number of managers can pick the same player | Domain rule |

## Contests and windows

A window is the period before a stage locks, in which you can change your lineup for that stage. The window **locks at the scheduled start of the stage's first match**. If that match moves earlier, the lock moves with it.

### CS2 Major

| Window | Stage it covers | Main Event (default) | Full Run |
|---|---|---|---|
| 1 | Stage 1 (Swiss) | — | Draft |
| 2 | Stage 2 (Swiss) | — | Free replacements + 2 |
| 3 | Stage 3 (Swiss) | **Draft** | Free replacements + 2 |
| 4 | Quarterfinals | Free replacements + 1 | Free replacements + 1 |
| 5 | Semifinals | Free replacements + 1 | Free replacements + 1 |
| 6 | Grand Final (BO5) | Free replacements + 1, max 3 per team | Free replacements + 1, max 3 per team |

During a Swiss stage the lineup stays locked across all its rounds. There is no window between Swiss rounds.

**Main Event timing.** Main Event opens when Stage 3's 16 teams are known, so its draft window is short (about a day). See [G-2](GAMEPLAY_OPEN_QUESTIONS.md#g-2-main-event-draft-window).

### Other events

Other events have one contest, Tournament Fantasy, with a window before each stage the event has. The same rules apply: the playoff windows give 1 strategic transfer, and the last single-elimination window allows 3 per team.

### Late entry

You can enter until the last window locks. You score from the first window your lineup is locked in. Earlier stages count as zero for you; the stage cups give late joiners something to win.

## Transfers

| Question | Rule |
|---|---|
| When do transfers open? | When the previous stage's field is known: the window shows the teams still in the event. |
| When do they lock? | At the window's lock time (above). |
| What counts as a transfer? | Each player in your new lineup who was not in your lineup at the **previous window's lock**. Saving several times before a lock never uses extra transfers. |
| Which players can I remove? | Anyone. |
| Which players can I add? | Players whose team is still in the tournament and appears in this window's pool. |
| Free replacements | Each eliminated player you swap out is free. You cannot "bank" a free replacement for a player who is still alive. |
| Do points I've earned change? | Never. Transfers only affect stages that haven't started. You cannot change a lineup for matches that have already been played. |
| What does a kept player cost? | **The price you paid when you signed them** (acquisition salary). New signings cost the current window price. The cap check uses these prices. See [G-3](GAMEPLAY_OPEN_QUESTIONS.md#g-3-acquisition-salary). |
| What if prices change? | A lineup that was legal stays legal. Price changes never invalidate a roster or force a sale. |
| What if there aren't enough eligible players? | The pool is the players on teams still in the event. The Grand Final has 10 players, and its team limit is 3 so a five-player lineup always exists. If a legal lineup still can't be built (for example, because acquisition prices push you over the cap), the builder says why, and the empty slot scores zero. Nothing is invented. See [G-5](GAMEPLAY_OPEN_QUESTIONS.md#g-5-final-stage-pool). |
| Abandoned lineups | The lineup carries forward unchanged. Eliminated players stay in it, marked "Out", and score zero until replaced. If Autopilot is on, it replaces them at lock (below). |

## Captain

- One captain per window, scoring 1.5×. Choosing a captain costs nothing.
- The captain carries forward to the next window. You can change it at every window without using a transfer.
- If your captain is eliminated and you don't act, Autopilot (if on) passes the captaincy to the highest-priced remaining player. If Autopilot is off, the captaincy stays on the eliminated player, who scores zero, so there is no captain bonus until you change it.

## Autopilot

Autopilot exists so that missing a window doesn't end your tournament. It doesn't play better than you would.

| Property | Rule |
|---|---|
| Optional | It's a switch on the Review screen, shown before you submit and changeable until any lock. It is on by default; see [G-6](GAMEPLAY_OPEN_QUESTIONS.md#g-6-autopilot-default-and-priority-list). |
| When it runs | Exactly once per window, at lock, and only for entries that still contain eliminated players. |
| What it changes | Only eliminated players. It never touches players who are still alive and never uses strategic transfers. |
| How it picks | Deterministic order: most picked in this contest, then higher fantasy average, then higher price, then player id. A candidate is accepted only if it fits the cap and the team limit **and** the remaining slots can still be filled legally. |
| What it knows | Only information available at the lock: ownership at lock and averages from completed matches. Never results from after the lock. |
| No legal replacement | The slot stays empty and the entry page says so. It never fabricates a player. |
| Audit | Every change is written to `transfers` (kind `autopilot`) and `admin_audit_log`. The entry page tags auto-replacements. |
| Priority list | **Not built.** The brief asks for a user-ordered replacement list. See [G-6](GAMEPLAY_OPEN_QUESTIONS.md#g-6-autopilot-default-and-priority-list). |

## Leaderboards and ranking

- **One entry, many boards:** global, friends, every private league the entry is in, and a stage cup per window.
- **Stage cups** rank entries by points scored in one stage only. Anyone with a lineup locked for that stage is in its cup. Equal stage points share a rank (the full tiebreak below applies to the overall board only).
- **Ties** are never random. The order is total points, then captain points, then fewer strategic transfers used, then earlier final submission. Entries still tied after that share the rank.
- **Privacy:** a lineup for an open window is private. It becomes visible to others when that window locks. Shared images follow the same rule ([DESIGN.md §5.11](DESIGN.md)).

## Score states

| State | Meaning | Shown as |
|---|---|---|
| Live (map in progress) | Points for a map that hasn't finished. Shown next to the player only, **not added to totals**. See [G-1](GAMEPLAY_OPEN_QUESTIONS.md#g-1-live-totals-under-map-averaging). | "map pts · live" |
| Provisional | Finished maps of a series that is still in progress. Counted in totals, but the series result is not in yet. | "Provisional" |
| Official | The series is complete, including the series win and advancement credit. | "Official" |
| Settled | 24 hours after the final stage ends. Final standings snapshot. | "Settled" |

**Corrections.** Before settlement, a stats correction appends new ledger rows that supersede the old ones and are marked "Corrected". Nothing is overwritten. After settlement, only an administrator can correct a score, for a clear data error, with a public note. That workflow isn't built yet.

## Not in the game

None of these are built, and they won't be at launch (brief Part 22): real money, betting, prizes bought with money, card packs, virtual currencies, login streak rewards, mandatory redrafts, exclusive-ownership drafts, LoL or VALORANT fantasy, predictions that haven't been validated, and multiple game formats.
