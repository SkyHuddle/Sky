# Esports Fantasy Platform: Research and Product Blueprint

Phase 0 deliverables. Read in order; each document builds on the previous one.

| # | Document | Brief deliverables covered |
|---|----------|----------------------------|
| 1 | [Competitive research](01-competitive-research.md) | Deliverable 1, Parts 2 and 3 |
| 2 | [Feature comparison matrix](02-feature-matrix.md) | Deliverable 2 |
| 3 | [Positioning and differentiation](03-positioning-and-differentiation.md) | Deliverables 3 and 10, Part 5 |
| 4 | [Gameplay and scoring](04-gameplay-and-scoring.md) | Deliverable 4, Part 6 |
| 5 | [Information architecture, screens and journeys](05-ia-screens-journeys.md) | Deliverables 5, 6 and 7, Parts 4 and 11 |
| 6 | [Data and scoring architecture](06-data-and-scoring-architecture.md) | Deliverable 8, Part 7 |
| 7 | [MVP roadmap, business model and retention](07-roadmap-business-retention.md) | Deliverable 9, Parts 8 and 9 |
| 8 | [Risks and open questions](08-risks-and-open-questions.md) | Deliverable 11 |
| 9 | [Product requirements document](09-prd.md) | Deliverable 12 |

## The short version

1. **Launch one game mode, for CS2, built around full-tournament contests.** One entry per tournament, five players, a $1,000,000 cap, at most two players per team, a captain at 1.5x, and a short transfer window between stages. Everything else waits until this loop is proven.
2. **Make scoring fair across BO1, BO3 and BO5.** Score each map from transparent, published events, normalise for round count, average the maps in a series, then apply a small format weight. HLTV's own fix (halving BO1 points, multiplying BO5 by 1.25) shows the problem is real.
3. **One entry, many leaderboards.** A fantasy team joins the global board, a friends board, any number of private leagues and creator leagues without being rebuilt. Riot's LCS Fantasy already works this way. This is the main growth mechanism.
4. **Don't copy HLTV's roles and boosters.** They add real depth, but HLTV has had to keep rebalancing them, and they are the main barrier for casual fans. Use one captain decision plus stage transfers. Revisit a single booster later, but only if testing shows it's needed.
5. **Settle scores after each map at launch, not live.** Live per-kill scoring costs 2.5x more per game from PandaScore (Pro Live) and is harder to correct. Map-by-map updates already give most of the "my score just changed" feeling.
6. **Data licensing decides what we can build.** GRID holds exclusive official data rights for LoL and VALORANT (Riot) and for ESL FACEIT Group's CS2 events. PandaScore covers most events but restricts stats plans to non-betting use. Do not build on scraped HLTV, Liquipedia or VLR data.
7. **CS2 is the opening; LoL and VALORANT are harder.** Riot runs its own free LCS Fantasy and in-client Pick'Ems with real in-game rewards, and KBOOM already covers LoL and VALORANT. Expanding needs a reason those players would switch, not just support for the game.

## How this research was done, and its limits

This session's network policy blocked direct access to every reference site (hltv.org, sleeper.com, draftkings.com, kboom.gg, lolesports.com, pickstop.gg, liquipedia.net, vlr.gg, pandascore.co and others). I could not open the products, sign in, or take screenshots.

Every finding comes from web search over indexed pages: official help pages, rules and news posts where the index had them, plus third-party guides and press. So:

- **No screen-level walkthroughs.** Where the brief asks how a screen looks or flows, the documents say "not examined" rather than guess.
- **Some sources are dated.** Several HLTV rule details come from 2021–2023 posts. Where a rule may have changed, it is flagged.
- **A hands-on pass is still needed.** Once the reference domains are allowed in the environment's network settings, the REA tooling installed in this session can capture page structure, scripts and network calls for each product. The [risks document](08-risks-and-open-questions.md#research-gaps-to-close) lists exactly what to check.

### Evidence labels used throughout

| Label | Meaning |
|-------|---------|
| **[V]** Verified | Stated by the product's own site, rules, help centre or official news, as returned by search. |
| **[S]** Secondary | Reported by a third-party guide, press article or forum, or an official source more than about two years old. |
| **[I]** Inference | My reasoning from the evidence; not stated by any source. |
| **[R]** Recommendation | An original product proposal. |
| **[Not examined]** | The brief asked for it, but I could not access it. |
