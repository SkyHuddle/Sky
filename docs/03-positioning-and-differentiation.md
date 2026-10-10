# 3. Product positioning and differentiation

Covers deliverable 3 (positioning), deliverable 10 (the five strongest differentiators) and the Part 5 evaluation of the proposed differentiators.

## Positioning

**For** fans who follow the big CS2 events,
**who** want more than watching but find HLTV Fantasy's roles, boosters and opaque rating maths a chore,
**our platform is** a free tournament fantasy game
**that** takes two minutes to enter, stays fun for the whole event, and is played with friends and the creators they watch.
**Unlike HLTV Fantasy,** every point is explained, one team covers the whole tournament and every league you're in, and your results build a permanent fantasy record.

### Why a CS2 fan would choose us over HLTV Fantasy

Be honest about the starting point: HLTV owns the audience, the stats and the habit. A fan won't switch for a nicer button. They'll switch, or play both, for these reasons:

| Reason | What we do | HLTV today | Strength of claim |
|---|---|---|---|
| **"I understand why I scored that."** | Every point traces to a published rule and a match event, with a per-map breakdown. | Points come mainly from HLTV Rating, which isn't published in full and changed twice in 2025. [S] | Strong, verifiable |
| **"My friends are in it."** | One entry counts in your global board and in every friends, Discord and creator league. Invite by link. | Private and public leagues exist [S]; experience not examined. | Strong if executed; this is the growth bet |
| **"One team for the whole Major."** | One entry from Stage 1 to the final, with stage transfers and Autopilot. | Often split into separate games per stage. [V] | Medium-strong |
| **"It's quick."** | A good lineup in two minutes: a suggested lineup, then tweak. No roles or boosters to configure. | Roles and boosters must be set. [S] | Strong for casual fans; neutral for experts |
| **"It works on my phone."** | Mobile-first builder and live view. | Not examined. | Unknown until the hands-on pass |
| **"My record follows me."** | Career profile, percentile finishes, trophies, rivalries. | A season ranking exists. [S] | Medium; becomes strong over time |

**What we won't claim:** better stats than HLTV, or bigger prizes. HLTV pays $10,000 a season from betting and skin sponsors. [V] Prizes are not our edge.

### Who it's for (and in what order)

1. **The tournament watcher.** Watches Majors and big IEM and BLAST events, knows the top 20 players, doesn't play fantasy weekly. Biggest group, lowest retention by default. Needs the two-minute entry and Autopilot.
2. **The CS2 fantasy regular.** Plays HLTV Fantasy every event. Smaller group, high engagement, sets the tone. Needs depth: prices, ownership, transfers, a career ladder.
3. **The community host.** A creator, Discord admin or friend-group organiser. Very few people, but each brings dozens to thousands. Needs one-click leagues, branded boards and shareable results.

Build for 1 and 3 first; make sure 2 is not insulted. [R]

## Evaluation of the brief's proposed differentiators (Part 5)

| # | Proposed differentiator | Verdict | Reasoning |
|---|---|---|---|
| 1 | **Multi-esport fantasy, one account** | **Keep, but not as a launch claim.** | Valuable long-term (one identity across CS2, LoL and VALORANT), but zero value at launch with one game. In LoL and VALORANT, Riot's free official products and KBOOM exist [V]. Architect for it from day one; market it only when LoL ships. |
| 2 | **Complete tournament journey** | **Keep. Core of the product.** | Directly addresses HLTV's split per-stage games [V] and the drop-off after a roster is eliminated. Needs stage transfers, Autopilot, and a UI that changes with the tournament's phase. |
| 3 | **Simple entry, deep strategy** | **Keep. Core.** | Achieved through *progressive disclosure*: the same five-player game for everyone. Depth comes from information (prices, form, ownership, schedule) and from transfers, not from extra rule systems. Cutting roles and boosters is what makes this possible. |
| 4 | **Fantasy career** | **Keep. Phase 1 history, Phase 2 ranking.** | HLTV's percentile-based season shows the idea works [S]. Our version must rank on *percentile within a contest*, use the best N results to avoid rewarding volume, and keep separate ladders per game. Model in the [scoring doc](04-gameplay-and-scoring.md#fantasy-career-rating). |
| 5 | **Creator-led competitions** | **Keep. Phase 1 basic, Phase 2 full.** | The strongest growth lever. Riot already runs streamer leagues and influencer factions [V/S]; Discord communities already run HLTV leagues [S]. *Cut streaming overlays from early phases*: high effort and needs a creator base first. Keep branded league pages and share cards. |
| 6 | **Better player research** | **Keep facts, delay predictions.** | Ship historical facts (recent fantasy points per map, consistency, upcoming opponents, ownership after lock) in Phase 1. Projected points and advancement odds only after a model has been back-tested on at least two seasons of events. Label every prediction as one. |

## Five strongest differentiators (deliverable 10)

Ranked by expected effect on whether users choose and return to us.

1. **One entry, every leaderboard.** Build a team once; it competes globally, with friends, in any number of private and creator leagues. Removes the biggest friction in social fantasy (re-entering per league) and makes every invite free for the invitee. Evidence it works: LCS Fantasy's unlimited leaderboards. [V]
2. **Transparent, fair scoring.** Points from published events, normalised for round count, averaged per map, weighted by format, and shown per map with an audit trail. Fixes the two biggest scoring complaints in the space at once: series-length luck and black-box ratings.
3. **The tournament-long journey with Autopilot.** One team for the whole event; stage transfers for enthusiasts; automatic replacement of eliminated players for everyone else. Keeps casual users in the standings until the final instead of quitting after Stage 1.
4. **Creator leagues as a first-class product.** A creator gets a branded league page, a short invite link, a public leaderboard and end-of-event share cards. Every creator league recruits an audience that already trusts the host.
5. **A permanent fantasy identity.** Percentile-based career rating, per-game ladders, trophies, event history, personal bests and head-to-head records against friends. This is what brings someone back for the next event, a reason HLTV's per-season points only partly provide.

## Ideas to cut

| Idea | Why cut |
|---|---|
| Collectible player cards with multipliers | Luck or purchases change scores; breaks fairness; loot-box exposure. KBOOM shows the retention upside, but the cost to competitive integrity is too high. |
| HLTV-style roles and boosters at launch | Most of HLTV's onboarding burden, and HLTV keeps rebalancing them. Reconsider one simple booster later only if testing shows experts want more decisions. |
| Weekly head-to-head matchups in tournament fantasy | Tournaments are too short; half the field would be idle or eliminated. |
| Real-money entry or wagering | Legal risk (the history of Vulcun and AlphaDraft), policy conflicts with publishers, and it changes who the product is for. |
| LoL/VALORANT Pick'Ems at launch | Riot's in-client Pick'Ems with skin rewards are hard to beat. |
| Streaming overlays before Phase 3 | Needs creators first; costly to support. |
| Daily login rewards | The brief is right: return visits should follow the esports calendar, not artificial streaks. |
