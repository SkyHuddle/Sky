# 4. Gameplay and scoring recommendations

Covers deliverable 4 and Part 6. Everything here is a **[R] recommendation**, unless it cites a competitor. All numbers are starting values to calibrate by back-testing on historical events before launch (see [calibration](#calibration-plan)).

## Design goals, in priority order

1. **Explainable.** A fan can recompute any score from the match page and the rules page.
2. **Fair across formats.** Neither BO1/BO3/BO5 nor overtime should decide the contest.
3. **Rewards judgement, not homework.** Picking good players on teams that go deep should win, not knowing threshold tables.
4. **Fun to the end.** Losing two players in Stage 1 shouldn't end your tournament.
5. **Only verifiable inputs.** Every input must come from a licensed data feed and have an unambiguous definition.

---

## The flagship format: Tournament Fantasy (CS2)

| Rule | Recommendation | Why |
|---|---|---|
| Roster | **5 players** | Matches the CS team size and HLTV's convention; small enough for a two-minute build. |
| Salary cap | **$1,000,000** | Fans already know it from HLTV. |
| Prices | **$100k–$300k in $5k steps**; average needed per slot is $200k | Stars ($260k+) force a cheap pick elsewhere. HLTV stars sit at $200k–$260k [V]. |
| Team limit | **At most 2 per team** | Prevents stacking the favourite; forces bracket spread. HLTV uses the same [S]. |
| Captain | **One captain, 1.5x points**, changeable at each stage window | One meaningful decision; DraftKings proves the mechanic [S]. Captain costs no extra salary (simpler than DraftKings' two prices). |
| Roles / boosters | **None at launch** | Biggest source of HLTV's complexity. Re-test one booster in Phase 2. |
| Contest scope | **One entry for the whole tournament**, with stage transfers | The "tournament journey" differentiator. |
| Stage leaderboards | Views on the same entries, ranked by stage points | Late joiners and players having a bad start still have something to play for. |
| Late entry | Allowed until the last stage lock; score counts from entry | Lets newcomers join mid-event. |
| Lock | **The whole lineup locks at the scheduled start of the stage's first match** | One clear deadline per stage. No per-player late swap at launch. |
| Transfers | At each stage window: **free replacement of eliminated players + 2 other transfers.** Unused transfers don't carry over | Strategy for enthusiasts without endless rebuilding. |
| Autopilot | **On by default**: if you don't act by a window's deadline, eliminated players are replaced automatically | See [Autopilot](#autopilot). |
| Price changes | **Prices are fixed for the whole tournament** | Avoids "my team value changed" confusion. Revisit for long events. |

### Majors: two contests

A CS2 Major runs three Swiss stages (16 teams each, 8 advance) and an 8-team single-elimination playoff with a BO5 final. Higher-seeded teams enter at Stage 2 or 3. [S] [Wikipedia](https://en.wikipedia.org/wiki/IEM_Cologne_Major_2026), [games.gg](https://games.gg/news/cs2-major-pick-em-guide/)

Most famous players don't play until Stage 3. Make the casual path obvious:

| Contest | Starts | Pool | For |
|---|---|---|---|
| **Major: Main Event** (default) | Stage 3 | The 16 Stage 3 teams; window before playoffs | Everyone. All the stars, about 9 days. |
| **Major: Full Run** | Stage 1 | Teams playing in the current stage; new teams join the pool at each window | Enthusiasts. Over 2.5 weeks with three windows. |

Non-Major events (IEM, BLAST, EPL) have one contest, with one window before the playoffs.

### Autopilot

Inspired by Underdog's "no management" principle [S]; designed for short tournaments. [R]

- **When a window closes,** an entry with Autopilot on replaces each eliminated player with the **most-picked affordable player still in the tournament** (fits the cap and the team limit).
- **If the captain was eliminated,** the captaincy passes to the highest-priced remaining player.
- **Autopilot never touches players who are still alive,** and never uses the 2 discretionary transfers.
- **The live view tags auto-replacements** so they're clearly marked.

Why most-picked rather than "best projected": it is explainable, needs no projection model, and produces the "average" choice, so an absent user stays competitive but can't win by being absent.

---

## CS2 scoring: three models compared

### Model A: raw events (DraftKings style)

Sum of event points over every map played.

- **Pro:** simple, intuitive, every number visible.
- **Con:** a 2-1 series gives 50% more scoring opportunity than a 2-0. A losing team's star in a long series can outscore the winner. Overtime inflates totals. DraftKings needs length adjustments and sweep bonuses to patch this. [S]

### Model B: rating-based (HLTV style)

Points = (player rating − 1.00) × 50 per match, + team win/loss points + roles + boosters, with BO1 halved and BO5 ×1.25. [S/V]

- **Pro:** a single rating captures impact well; already normalised per round.
- **Con:**
  - We have no licence to HLTV Rating, and it isn't published in full.
  - Building our own composite "rating" recreates the black box.
  - Small rating differences are hard to explain to fans ("why −2.5?").

### Model C (recommended): per-map events, averaged per series

1. **Score each map** from published events (table below).
2. **Overtime cap:** if a map ran over 24 rounds, scale its event points by 24 ÷ rounds played. Short maps are not scaled up.
3. **Add map result:** +3 if the player's team won the map.
4. **Average** the map scores in the series. A 2-1 series is not worth more than a 2-0.
5. **Add series result:** +3 for a series win.
6. **Apply the format weight:** BO1 ×0.8, BO3 ×1.0, BO5 ×1.2.
7. **Swiss and group advancement credit:** when a team advances having played fewer series than the longest possible path (e.g. 3-0 instead of 3-2), each player gets **25 points per unplayed series**.
8. **Captain** ×1.5 on the player's total.

**Why the advancement credit:** without it, a team that goes 3-2 in a Swiss stage plays five series and can outscore a team that went 3-0 in three. DraftKings solved the same problem for LoL with a 2-0 sweep bonus "in lieu of" the unplayed game. [S] The credit value approximates a typical series score and must be calibrated.

**Why the format weights:** BO1s are noisier and mostly early-stage, and BO5s are finals. HLTV moves in the same direction more aggressively (×0.5 / ×1.25). [V] The weights are mild because averaging already removes most of the map-count effect.

### CS2 event points (per map, before overtime cap)

| Event | Points | Notes |
|---|---|---|
| Kill | +2 | Team kills excluded. |
| Death | −1 | Suicides count as deaths. |
| Assist | +1 | Use the data provider's definition; publish it. Flash assists only if the feed reports them. |
| Opening kill (first kill of a round) | +1 | Added on top of the kill. |
| 3-kill round / 4-kill round / ace | +1 / +2 / +4 | One bonus per round, the highest that applies. |
| Clutch won (1vN) | 1v1 +2, 1v2 +3, 1v3 +4, 1v4 +5, 1v5 +6 | Only if the feed defines clutches as a round won by the last alive player. |
| Map won | +3 | Team result; not scaled by the overtime cap. |

**Deliberately excluded:**
- **Opening deaths:** they would punish entry fraggers for their role.
- **Damage/ADR:** heavily correlated with kills, and it adds a second scale to explain.
- **Headshots, AWP kills, utility damage:** low strategic value and not reliably available in every feed.
- **Any rating or composite score.**

### Worked examples

All players are hypothetical. Scores keep full precision internally and display to one decimal.

**Example 1: star rifler, BO3, won 2-1, captain**

| Map | Rounds | K | D | A | Opening kills | Multi-kills | Clutch | Events | OT cap | Map win | Map score |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 (W 13-9) | 22 | 22 | 14 | 4 | 4 | 3K, 4K (+3) | 1v2 (+3) | 44 − 14 + 4 + 4 + 3 + 3 = **44** | ×1 | +3 | **47.0** |
| 2 (L 10-13) | 23 | 15 | 17 | 3 | 2 | 3K (+1) | — | 30 − 17 + 3 + 2 + 1 = **19** | ×1 | 0 | **19.0** |
| 3 (W 16-14 OT) | 30 | 27 | 20 | 5 | 3 | 3K, 3K (+2) | 1v1 (+2) | 54 − 20 + 5 + 3 + 2 + 2 = **46** | ×0.8 | +3 | **39.8** |

- **Average of maps:** (47.0 + 19.0 + 39.8) ÷ 3 = 35.27
- **Series win:** +3 = 38.27
- **BO3 weight** ×1.0 = **38.3**
- **As captain** ×1.5 = **57.4**

**Example 2: BO1 stomp, won 13-3**

- **Events:** 18 K, 5 D, 2 A, 5 opening kills, one ace (+4), one 3K (+1) → 36 − 5 + 2 + 5 + 4 + 1 = **43**
- **Map:** 16 rounds, no cap; +3 map win = 46.0
- **Series:** 46.0 + 3 = 49.0; **BO1 ×0.8 = 39.2**

**Example 3: support player, BO3, lost 0-2 (eliminated)**

| Map | K | D | A | Opening kills | Other | Events | Map score |
|---|---|---|---|---|---|---|---|
| 1 (L 8-13) | 12 | 16 | 6 | 1 | — | 24 − 16 + 6 + 1 = 15 | 15.0 |
| 2 (L 11-13) | 14 | 17 | 5 | 1 | 1v1 (+2) | 28 − 17 + 5 + 1 + 2 = 19 | 19.0 |

- **Series:** average 17.0, no win bonus, ×1.0 = **17.0**
- The player then scores 0 until replaced at the next window (free replacement, or Autopilot).

**Example 4: BO5 grand final, won 3-1**

- **Map event totals:** 30, 22, 35, 41; maps 1, 3 and 4 won → 33, 22, 38, 44
- **Average:** 34.25; +3 series win = 37.25; **BO5 ×1.2 = 44.7**

**Example 5: Swiss stage, 3-0 vs 3-2**

| | Series played | Series scores | Advancement credit | Stage total |
|---|---|---|---|---|
| Player on 3-0 team | 3 (all wins) | 34 + 33 + 38 = 105 | 2 unplayed × 25 = 50 | **155** |
| Player on 3-2 team | 5 (3 wins, 2 losses) | 34 + 33 + 38 + 16 + 18 = 139 | 0 | **139** |

Without the credit, the 3-2 player would win by 34 points despite their team doing worse.

### How the three models handle the same performances

| Performance | Model A (raw) | Model B (HLTV-style, hypothetical ratings) | Model C (recommended) |
|---|---|---|---|
| Ex 1: star, 2-1 BO3 | 44 + 19 + 46 + 6 map wins + 3 = **118** | ratings 1.35 / 0.95 / 1.20 → 17.5 − 2.5 + 10 + 6 win = **31** | **38.3** |
| Ex 2: BO1 stomp | 43 + 3 + 3 = **49** | rating 1.80 → (40 + 6) ÷ 2 = **23** | **39.2** |
| Ratio Ex1 ÷ Ex2 | 2.4x (map count dominates) | 1.3x | 1.0x (individual performance dominates) |

Model C keeps a dominant BO1 and a strong BO3 in the same range, as both were excellent. In Model A, the BO3 player scores 2.4x simply by playing more maps.

---

## League of Legends (Phase 3)

| Rule | Recommendation | Why |
|---|---|---|
| Roster | **5 players, one per position** (Top, Jungle, Mid, ADC, Support) | Matches how fans think about teams. DraftKings and KBOOM both require positions [S/V]. **Position slots remove the need to balance scoring across roles,** since you only ever choose between supports for the support slot. |
| Cap / team limit / captain | $1M, max 2 per team, captain 1.5x | Same core game across esports. |
| Per-game points | Kill +3, assist +2, death −1, CS +0.02 each, first blood +2 (player who gets it), game won +2, 10+ kills or assists in a game +2 | Close to the industry baseline (Sleeper beta, Esports One, DraftKings) [S]. Objectives (dragons, barons, towers) stay out of player scoring at launch to keep individual attribution clean. |
| Long games | Long-game cap: games over 35 minutes scale by 35 ÷ duration | Long games inflate kills and CS; same principle as the CS2 overtime cap. |
| Series | Average of games; +3 series win; BO1 ×0.8 / BO3 ×1.0 / BO5 ×1.2; Swiss credit | Riot's LCS Fantasy averages per game "to account for the variable number of games in a series" [V]. |
| Champion pick/ban | **No** in tournament fantasy; consider for Mode B draft leagues | Sleeper's mechanic is fun weekly homework for draft leagues [V], too much for casual tournament fans. |

## VALORANT (Phase 3)

| Rule | Recommendation | Why |
|---|---|---|
| Roster | **5 players, no role slots** | Players change agents and sometimes roles map to map; slotting by "primary role" is ambiguous and would cause disputes. |
| Role fairness | **Prices absorb role differences** (controllers are cheaper), and assists carry more weight than in CS2 | Controllers naturally have lower ACS [S] [VLR](https://vlr.gg/post/1217662). Pricing them from their own fantasy history makes them value picks rather than traps. |
| Per-map points | Kill +2, death −1, assist +1.5, first kill +1, multi-kill round 3K/4K/5K +1/+2/+4, clutch as in CS2, map won +3 | Mirrors CS2 so fans of both learn one system. No first-death penalty (duelists' role). |
| ACS | **Not used** | Riot hasn't published the formula officially as far as found [S]; the same black-box problem as HLTV Rating. |
| Overtime | Cap at 24 rounds, as in CS2 | VALORANT maps also play to 13. |
| Series | Same as CS2 | One mental model. |
| Check against the data | Plants, defuses and utility stats only if GRID's feed provides them reliably | Do not score anything the feed can't provide consistently. |

---

## Universal rules (all esports)

| Topic | Rule |
|---|---|
| **Transparency** | Every rule on one rules page per game and version. Every player score shows a per-map breakdown linked to the match. Rule changes create a new version; contests keep the version they started with. |
| **Ties** | Contest ranks: (1) more total points; (2) more captain points; (3) fewer discretionary transfers used; (4) earlier final lineup submission. Remaining ties **share the rank**, and any prize is split. **Never random**: random tiebreaks add chance, a legal risk for prize contests. [S] [Stinson](https://stinson.com/newsroom-publications-running-a-legal-sweepstakes-or-contest-in-the-esports-and-online-gaming-world) |
| **Lock** | The lineup locks at the scheduled start of a stage's first match. If that match is moved earlier, the lock moves with it, and users are notified. The lock time is shown in the user's local time with a countdown. |
| **Elimination** | Players score 0 after their team is eliminated. Free replacement at the next window (or Autopilot). |
| **Did not play** | A rostered player who doesn't play a series scores 0 for that series. No advancement credit for series they didn't play. |
| **Stand-ins and roster changes** | If a team officially replaces a player for the rest of the tournament, owners get a free replacement at the next window. Stand-ins join the pool at the next window at a flat price (the pool median). |
| **Postponed matches** | Count for the stage they're played in. If a match moves past a stage lock, affected entries get no extra transfers; scores update when it's played. |
| **Cancelled / forfeit** | No points for either team's players for that series. The advancing team's players get advancement credit for the unplayed series. |
| **Score states** | **Provisional** (after each map, from the live or post-map feed) → **Official** (feed confirms the match) → **Settled** (24 hours after the stage ends). Leaderboards show which state they're in. |
| **Corrections** | Before settlement: applied automatically with a visible change log. After settlement: only by an administrator, for a clear data error, with a public note, and before any reward is issued. |
| **Disputes** | In-app "report a score" on any player breakdown. Reviewed against the official feed; the feed is final unless the organiser corrects it. |
| **Inputs** | Only events defined by the licensed feed. No ratings, ACS, "impact" or anything not reproducible from the events. |

---

## Pick'Ems (Phase 2, CS2 first)

| Rule | Recommendation | Basis |
|---|---|---|
| Swiss stages | Valve-style slots: two 3-0, six advance (3-1 or 3-2), two 0-3 | Familiar to CS fans; makes a simple prediction strategic. [S] |
| Playoffs | Full bracket picked before the playoffs; points double each round (QF 2, SF 4, F 8) | Rewards getting the late rounds right. |
| Contrarian bonus | +50% for a correct pick that under 25% of players made | Rewards insight over following the crowd (KBOOM does the same). [V] |
| Windows | Before each stage; bracket after the last Swiss stage | Riot's two-phase model. [S] |
| Separation | Pick'Em points never mix with fantasy points; a separate leaderboard and a separate career track | Brief requirement. |
| Funnel | After submitting picks: "Turn your picks into a fantasy team" prefills a lineup from the teams you backed | Pick'Ems as an on-ramp to fantasy. |

## Draft leagues (Mode B, Phase 3)

| Question | Answer |
|---|---|
| Fits short tournaments? | Only for long events (Majors from Stage 3, Worlds, Champions) and 4–8 managers. With 8 managers × 5 = 40 players, there are enough for a 16-team stage. |
| Trading | **No** at launch. With 1–3 week events, trading adds negotiation without enough time to pay off. |
| Between-stage changes | **Yes, essential.** Free-agent pickups at each stage window, in reverse order of standings, so eliminated players can be replaced. |
| Draft room | Snake order; fast (30 s) and slow (8 h with quiet hours) timers; pre-draft queue; auto-pick from the queue, then by price. Learned from Sleeper and Underdog. |
| Scoring | The same rules as tournament fantasy, so draft leagues need no separate engine. |
| Format | Total points standings, not head-to-head (too few scoring periods). |

---

## Fantasy career rating

A ranking that rewards how well you finish, not how often you play. HLTV's percentile-based season points are the precedent. [S]

For each public contest (at least 100 entries):

```
percentile p     = rank / entries                 (0.001 = top 0.1%)
finish points    = 100 × (1 − √p)                 (top 1% ≈ 90, top 10% ≈ 68, median ≈ 29)
field factor     = min(1, log10(entries) / 4)     (100 entries → 0.5, 1,000 → 0.75, 10,000+ → 1.0)
tier weight      = Major 1.5, Tier-1 event 1.0, other 0.6
contest rating   = finish points × field factor × tier weight
```

- **Season rating per game** = the sum of the best 6 contest ratings in the season. More entries can only add up to six results, so volume helps only until a player has six good finishes.
- **No combined cross-game score.** The profile shows each game's rank side by side. Percentiles are comparable; raw points are not.
- **Private leagues** award league trophies, not career rating. A 10-person league isn't evidence of skill.
- **Shown on the profile:** season rank, best finishes, average percentile, trophies.

---

## Calibration plan

Before launch, replay the scoring rules against at least 20 historical CS2 events from the licensed feed:

1. **Format fairness:** the average series score should differ by under 10% between BO1, BO3 and BO5 after weights. Adjust the weights until it does.
2. **Swiss credit:** set the credit so a 3-0 team's players average slightly more than a 3-2 team's.
3. **Score spread:** individual performance should explain most of the variance in a player's tournament score; team results should be significant but secondary. Check the share coming from map and series wins.
4. **Prices:** generate prices from the trailing data, then check that no single price tier is a guaranteed best choice (value per $ roughly flat across tiers on average).
5. **Simulation:** simulate 10,000 entries with sensible strategies (favourites, value, contrarian) and check that the top 1% isn't dominated by one strategy.
