# Gameplay open questions

These are rules that the brief proposes or that the build had to settle provisionally. Every one of them needs closed-beta data, real historical stats, or a product decision before it is final. [GAMEPLAY.md](GAMEPLAY.md) states the rule as it currently runs and links here. When a question is closed, record the decision and the evidence, then update GAMEPLAY.md. Don't delete the question.

| ID | Question | Current rule | Decide by |
|---|---|---|---|
| G-1 | Do live in-map points count toward totals? | No. They are shown per player; totals move at map end | Beta feedback on live feel |
| G-2 | When does the Main Event draft open? | When Stage 3's teams are known (about a day) | Beta: entry rates per contest |
| G-3 | Do kept players stay at their acquisition salary? | Yes | Simulated managers over full events |
| G-4 | How many strategic transfers in playoff windows? | 1 (Swiss windows: 2) | Beta: transfer usage, rank churn |
| G-5 | What if the final-stage pool can't make a legal lineup? | Team limit 3 in the final; otherwise the slot stays empty | Simulation over acquisition prices |
| G-6 | Should Autopilot be on by default? Is a priority list needed? | On by default, most-picked replacement; no priority list | Beta: opt-out rate, absent-user ranks |
| G-7 | How are stand-ins and permanent roster changes handled? | Temporary stand-ins not in the pool; permanent changes need the admin tool (not built) | Before launch, with admin tooling |
| G-8 | How does a seasonal rating work? | Not built | After two or more events have run |
| G-9 | Is advancement credit worth the right amount? Are prices calibrated? | 3–0 scores about 11% more than 3–2; history-percentile prices | Licensed historical data |

---

## G-1. Live totals under map averaging

**The tension.** The brief wants Sleeper-style totals that move with every kill. Scoring `cs2-v2` averages the maps in a series so that BO1, BO3 and BO5 are worth the same (format spread 1.2%; see [SCORING_FAIRNESS.md §1](SCORING_FAIRNESS.md)). Under averaging, adding a half-played map to the average makes a player's running score fall in **74.5%** of cases (§6). A total that drops when your player gets a kill would feel broken.

**Current rule.**
- A map in progress shows **map points** next to each player, labelled "live". They come from the real snapshot in the pipeline.
- Totals, ranks and the activity feed update when each map ends, which is the first moment the score is well defined.
- The Live screen says so in words: "Map in progress · updates when it ends".

**Options.**
1. Keep the current rule. It is honest and fair, but totals are less "live".
2. A projected total that adds the live map as if it were complete, clearly labelled "projected". It could still drop at map end.
3. A sum-based model that ticks with every kill. It is unfair across formats (raw-sum spread 103%; §1).

**Evidence needed.** Beta sessions: do users understand that map points are not yet in the total? How much time do they spend on Live during a map compared with at map end?

## G-2. Main Event draft window

Main Event (the default casual contest) covers Stage 3 onward, but Stage 3's teams are known only when Stage 2 ends. Its draft window is therefore about a day, the shortest of any contest.

**Options.**
1. Keep it as is. The UI says "Opens when Stage 3 is set".
2. Open it at the start of the event with the 8 directly invited teams plus 8 "TBD" slots.
3. Lock at the last round of Stage 2.

**Evidence needed.** Entry conversion for Main Event against Full Run in the beta.

## G-3. Acquisition salary

**Current rule** (the brief's preferred model). A kept player counts at the price you paid. New signings cost the window's price. Prices are re-set at each window from history up to that window (docs/10 §2).

**Risk.** A manager who signed a cheap breakout player keeps a cap advantage for the whole event. That's intended, and it rewards early judgement. But it could become dominant if prices move a lot between windows.

**Not yet tested.** The fairness report checks scoring, not transfer strategy. Needed: simulated managers (hold, chase form, chase price) over full events, comparing final ranks under acquisition pricing against current-price-for-everyone.

## G-4. Playoff transfer count

**Current rule.** 1 strategic transfer per playoff window (the brief's proposal); 2 per Swiss window in Full Run (docs/04). Eliminated players are always free.

**Question.** Is 1 enough? A manager whose players all advanced has almost no decisions left, while one with three eliminated players rebuilds for free. Is that fair, or does it reward having been wrong?

**Evidence needed.** Beta: transfers used per window, and rank changes between the QF lock and the final.

## G-5. Final-stage pool

Only 10 players remain for the Grand Final. With a team limit of 3, five-player lineups always exist at current prices. But a manager holding expensive kept players at acquisition salary can still be unable to afford a legal lineup. Today the builder explains the problem and the empty slot scores zero.

**Options.** Re-price kept players to current prices in the final window only, or relax the cap for the final. **Evidence needed:** how often this happens in simulation (G-3's simulation can measure it).

## G-6. Autopilot default and priority list

**Brief.** Autopilot is optional, users can enable it, users may set a replacement priority list, and it must be deterministic and audited.

**Current state.**
- Optional, deterministic and audited: done.
- **On by default**, disclosed on Review before submit (docs/04 reasoning: an absent manager stays competitive but can't win by being absent).
- **No priority list.** Replacements follow the most-picked order.

**Questions.**
- Should the default be off (pure opt-in)?
- Is a priority list worth its UI cost in a five-player game? A lighter option: "prefer players from team X".

**Evidence needed.** Beta opt-out rate, and the final ranks of entries whose changes were all made by Autopilot.

## G-7. Stand-ins and roster changes

**Current rule.** A temporary stand-in is not added to the pool. The rostered regular scores 0 for that series ("Did not play"). Permanent changes (a team replaces a player for the rest of the event) should give owners a free replacement, but that needs the admin console, which isn't built.

**Question.** Should a stand-in who plays a whole stage be pickable at the next window, and at what price? docs/04 suggests the pool median.

## G-8. Seasonal rating

The brief (Part 12) asks for a permanent fantasy identity across events. docs/04 proposes a percentile-based career rating. It is not built, and it needs at least two completed events to mean anything. **Decide:** whether the rating weights event size and tier, and whether it decays.

## G-9. Advancement credit and price calibration

- **Advancement credit.** In simulation, 3–0 players score 145.6, 3–1 players 139.7 and 3–2 players 130.8 (SCORING_FAIRNESS.md §2). That's about 11% more for the cleanest run, in line with docs/04's "slightly more". Re-check with real data.
- **Prices.** Percentile prices from simulated history work, but real CS2 data needs the docs/04 calibration: value per dollar should be roughly flat across price tiers.
- **Needs** licensed historical stats (GRID Open Access is a candidate; see [LIVE_DATA.md](LIVE_DATA.md)).
