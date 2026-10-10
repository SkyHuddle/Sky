# 7. MVP roadmap, business model and retention

Covers deliverable 9 and Parts 8 and 9. All **[R]** unless cited.

## Live scoring at launch: decision

**Launch with per-map settlement, not live per-kill scoring.**

- **Cost:** PandaScore's live tier is €1,000 per game per month versus €400 for post-match [V]; GRID is quoted per contract.
- **Correctness:** live feeds produce more provisional numbers to correct; post-map data arrives once, cleaner.
- **Experience:** a CS2 map lasts 30–60 minutes. Updating after each map still gives "my score just moved" several times per match day, which captures most of the excitement.
- **Phase 2 adds live** once the ledger, corrections and leaderboard pipeline are proven.

## Phases

### Phase 0: now → first test event (about 8 weeks)

**Goal:** prove the core loop and the scoring with real people before building the product.

- **Data:**
  - Apply to GRID Open Access.
  - Start commercial conversations with GRID and PandaScore, including PGL's data rights for the Singapore Major.
  - Get a Liquipedia commercial API quote.
- **Scoring:** back-test the scoring rules on historical events ([calibration plan](04-gameplay-and-scoring.md#calibration-plan)).
- **Closed alpha:** run the **PGL Singapore Major (25 Nov – 13 Dec 2026)** [S] as a closed alpha with 50–200 invited players:
  - A minimal lineup builder and leaderboard.
  - Scores computed post-match from whatever licensed data is available, checked by hand.
  - Measure: build time, confusion points, transfer usage, Autopilot acceptance, how often people return.
- **Hands-on competitor pass:** once the network allows the reference domains (see [risks](08-risks-and-open-questions.md#research-gaps-to-close)).
- **Brand:** working name, visual identity exploration, legal entity, trademark search.

### Phase 1: CS2 Fantasy MVP (public beta in early 2027, full launch for the first 2027 Major)

| Feature | Priority | Complexity | Data dependency | Notes |
|---|---|---|---|---|
| Events, stages, schedule, bracket | Must | M | Fixtures, formats | Liquipedia API or provider |
| Contest engine (cap, team limit, captain, windows, locks) | Must | M | Rosters, schedule | Core rules in [scoring doc](04-gameplay-and-scoring.md) |
| Lineup builder (mobile-first), suggested team | Must | M | Prices, per-map stats | The most important screen |
| Price generation | Must | M | 6+ months of historical stats | Calibrated, with an admin override |
| Scoring ledger + per-map settlement | Must | L | Post-match stats | Includes corrections and replay |
| Stage transfers + Autopilot | Must | M | Results | Differentiator |
| Global, stage and friends leaderboards | Must | M | — | Redis sorted sets |
| Private leagues, invite links, one entry in many leagues | Must | M | — | Growth engine |
| Player detail (facts only) | Must | S | Historical stats | No projections |
| Profile with event history | Must | S | — | Career rating in P2 |
| Auth (Google, Discord, Steam OpenID, email), try-before-sign-up | Must | S | — | |
| Notifications (lock reminders, windows, live, results) | Must | M | Schedule | Email + web push |
| Admin console (rosters, schedule, disputes, settlement) | Must | M | — | Two-person approval for manual stats |
| Share card for final results | Should | S | — | Cheap growth |
| Ownership % after lock | Should | S | — | |
| League chat | Won't (P2) | M | — | Use Discord links in P1 |

**Build order:**
1. Data ingestion and the esports domain
2. Scoring ledger with replay tests
3. Contest engine and locks
4. Lineup builder
5. Leaderboards
6. Leagues and invites
7. Live view
8. Notifications
9. Admin tools
10. Profile and history

Run each 2027 CS2 event in beta before the Major.

### Phase 2: Social and competitive expansion

In order of value per effort:

1. **Creator leagues:** branded public pages, short links, share cards, member caps.
2. **CS2 Pick'Ems:** Swiss slots and a bracket; linked to fantasy ("turn your picks into a team").
3. **Career rating and trophies:** percentile model, per-game ladders.
4. **Live in-match scoring:** adds the live data tier.
5. **League chat and reactions.**
6. **Rivalries:** head-to-head records against friends.
7. **Labelled projections:** only after a model is back-tested.
8. **One booster experiment:** A/B test against the no-booster game with enthusiasts only.

### Phase 3: Multi-esport platform

1. **VALORANT** first, if the GRID terms work: a format closest to CS2, so the least new design. Champions and Masters are big international events.
2. **League of Legends:** position slots; Worlds, MSI, then regional leagues. Faces Riot's own LCS Fantasy.
3. **Draft leagues (Mode B)** for long events.
4. **Creator tools:** overlays, giveaways with compliant rules.
5. **Premium cosmetics and supporter subscription.**
6. **More esports** (Dota 2, Rocket League) only where a licensed feed exists and the event calendar has enough tier-1 events.

### What we're deliberately not building early

Native apps, real-money anything, cards or packs, chat moderation at scale, streaming overlays, projections, every esport at once.

## Business model

### Principles

- **Free to play, always.**
- **No purchase changes a score,** a price or what information you can see that affects your choices.
- **Nothing gambling-adjacent:** no betting or skin-gambling sponsors, odds or "bet builder" links. HLTV takes such sponsors [V]; we don't, for three reasons:
  - It keeps publishers open (Riot's policies already forbid associating its data with crypto and NFTs) [V] [Riot](https://support-developer.riotgames.com/hc/en-us/articles/22698591841939-General-Policies).
  - It keeps app-store and age requirements simple.
  - It makes the product something creators can recommend without caveats.

### Revenue options, assessed

| Option | Fit | Assessment |
|---|---|---|
| **Event and brand sponsorships** (peripherals, energy drinks, PC brands, telecoms) | High | The main revenue line. A sponsored event contest ("Main Event presented by X") with prizes and branding. Needs audience scale: realistic only after tens of thousands of entries per event. |
| **Creator league tiers** (bigger caps, branding, giveaway tools, analytics) | High | Creators get value directly; low cost to serve. Start free; charge only above a size where the creator monetises. |
| **Cosmetics** (profile themes, roster card styles, badges) | Medium | No effect on fairness. Revenue tends to be small until the community is large. |
| **Supporter subscription** (cosmetics, deeper history, early features) | Medium | Works once there's an identity worth investing in (after the career system). |
| **Premium statistics** | **Low; avoid** | Paying for decision-relevant information is a paid advantage in a prize contest. Keep all decision data free. |
| **Paid commissioner tools** | Low | Friend groups won't pay; creators are covered by creator tiers. |
| **Organiser or publisher partnerships** (official fantasy for an event) | High upside, uncertain | The strongest long-term path: run an organiser's official fantasy. Needs a proven product first. |
| **Ads** | Low | Hurts the premium feel; small revenue at our scale. |

### Costs to plan for (indicative)

| Item | Early-stage monthly estimate |
|---|---|
| Esports data (CS2, post-match) | €400–1,500 [V for PandaScore floor] |
| Live data (Phase 2) | +€600 to €1,500 per game |
| Tournament format data (Liquipedia commercial) | Unknown; quote needed |
| Hosting, database, cache, email, push | $100–500 at launch scale [I] |
| Prize pools for sponsored contests | Paid by sponsors; never committed without sponsor cover |
| Legal (contest rules per jurisdiction, terms, privacy) | Up-front, one-off; significant |
| Moderation and support | Grows with leagues and chat |

**Honest assessment:** revenue will lag the product by a year or more. HLTV funds a $10,000 season from sponsors on the back of the largest CS audience [V]; we'll have a fraction of that reach at first. Plan to be **cheap to run** (post-match data, web app, small team) and treat the first year as audience building, with sponsorships as the first revenue. [I]

### Prize contests: legal guardrails

- **Free entry removes "consideration"; skill removes "chance".** Keep both:
  - No purchase or paid boost.
  - No random tiebreaks. [S] [Stinson](https://stinson.com/newsroom-publications-running-a-legal-sweepstakes-or-contest-in-the-esports-and-online-gaming-world)
- **Official rules per sponsored contest:** eligibility, age, territories, "void where prohibited", tax responsibilities. Some states are stricter than others. [S]
- **Legal advice before the first prize contest,** especially for US states and the EU.

## Retention: built on the esports calendar

### Why users come back

| Trigger | Mechanism |
|---|---|
| A new event opens | "IEM fantasy is open; your leagues are in" (one per event, a week before lock) |
| Lock is near | Reminder 24 h and 2 h before lock, **only if the user hasn't entered** |
| Their team is playing | "3 of your players are live" (once per match day, not per match) |
| A stage changes | "Stage 3 window open: 2 players eliminated" |
| Standings moved | End-of-day digest: rank change, friends passed |
| Friends or creators compete | "Your friend joined your league", "Creator X's league just hit 1,000 players" |
| Long-term ranking | Season rank and percentile shown after every event |

Each notification type can be turned off; defaults are conservative (lock reminders and results on; live alerts opt-in).

### Between Majors

- **CS2 has tier-1 events almost every month** (IEM, BLAST, ESL Pro League, PGL, StarLadder). Pickstop alone was running StarSeries and BLAST picks in autumn 2026. [V] Every one is a contest, so the calendar fills itself.
- **Smaller events:** offer only a lightweight contest (one stage, no transfers) so they don't dilute attention, and give them a lower tier weight in career rating.
- **Off-weeks:** the profile, the season ladder and league history give a reason to look back. Don't invent daily rewards.
- **The December break** (after the Singapore Major) is a natural "season review": a shareable year-in-review card for each user.

### Metrics to watch

| Metric | Why |
|---|---|
| Lineup completion rate (builder opened → confirmed) | Tests the two-minute promise |
| Median build time | Same |
| Entries per event and % returning from the previous event | The core retention measure |
| % of entries in at least one league; invites sent per entry | The growth engine |
| Window action rate vs Autopilot rate | Engagement of enthusiasts vs casual players |
| Live view sessions per entry per match day | Whether the tournament stays fun |
| Disputes per 1,000 player-maps | Data quality |
