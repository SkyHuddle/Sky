# Live esports data sources for a free-to-play fantasy app (CS2 first, LoL/VALORANT later)

Research date: 2026-10-10. Not legal advice.

**Method and limits.** WebFetch could not reach the sites (`getaddrinfo ENOTFOUND developer.riotgames.com`), so every claim
below comes from WebSearch result extracts, not from full pages read directly. Labels:

- **[V]** comes from an official or primary source: the publisher, the vendor's own site or docs, or the rights holder's press release. These were seen only as search extracts, so re-read the live page before you sign anything.
- **[S]** comes from a secondary or community source: trade press, GitHub wrappers, scrapers, or competitor blogs.
- **[?]** means the claim is unknown or I found no source for it.

---

## 1. League of Legends

### 1a. The community-documented lolesports.com API

| Endpoint | What it exposes | Label / source |
|---|---|---|
| `esports-api.lolesports.com/persisted/gw/getSchedule` | Paged match list (events, teams, league, state). Each page holds up to about 80 events, and a cursor in `pages.older` pages backward in time | [S] https://apify.com/jungle_synthesizer/lol-esports-worlds-2026-schedule-results-scraper.md |
| `.../persisted/gw/getLive` | Matches that are live now. Community wrappers list it but some never implemented it (`irelia` has it under "to do") | [S] https://pypi.org/project/irelia/ |
| `.../persisted/gw/getEventDetails?id={matchId}` | Match/event detail, including game IDs used for livestats. Implemented in `irelia` | [S] https://pypi.org/project/irelia/ |
| `feed.lolesports.com/livestats/v1/window/{gameId}` | A series of game-state snapshots ("frames"). Optional start time. Wrapper docs say it needs no authorization | [S] https://github.com/xadamxk/lolesports-js-sdk/blob/master/docs/MatchDetailsApi.md ; https://libraries.io/npm/lol-live |
| `feed.lolesports.com/livestats/v1/details/{gameId}` | Like window but per player: champion level, stats, creep score, gold earned, ability level-up order, items | [S] https://libraries.io/npm/lol-live ; https://github.com/xadamxk/lolesports-js-sdk/blob/master/docs/MatchDetailsApi.md |

- **Per-player stats.** Community docs list per-player kills, deaths, assists, minions killed (CS), total gold and item slots. One of those docs describes an older format, so field names may have changed. [S] https://github.com/cable729/LolEsportsApi
- **Exact `participantFrames` schema.** I did not confirm the current schema of the window and details endpoints. The main unofficial docs site is https://vickz84259.github.io/lolesports-api-docs/, linked from https://pypi.org/project/irelia/, and I could not read it. [?]
- **Update cadence.** The "about 10-second frame windows" is not confirmed by any source. The only evidence is that the `lol-live` CLI polls every 10 seconds by default and caches past frames. [S] https://libraries.io/npm/lol-live
  - The exact rounding of `startingTime` is not confirmed. [?]
  - A request on Riot's own developer-relations tracker notes that spectator-style data runs about 3 minutes behind. [S] https://github.com/RiotGames/developer-relations/issues/216
- **Authentication.** The `persisted/gw` endpoints take an `x-api-key` header with a shared key that is publicly posted and widely copied in third-party code. It is not issued to you, it is unsupported, and it can be rotated at any time. The key is deliberately left out of this file. [S] https://apify.com/jungle_synthesizer/lol-esports-worlds-2026-schedule-results-scraper.md
- **Coverage.** The API covers the leagues shown on lolesports.com. I found no source that lists which leagues or tournaments have livestats; whether the LPL has them is unconfirmed. [?]
- **Reliability.** The API "is not officially supported and may change at any time without warning", and the unofficial docs "might not be accurate or up-to-date". [S] https://github.com/FloPrm/lol_analytics
  - Esports tournament-server matches are not reachable through the official Riot API. [S] https://github.com/FloPrm/lol_analytics
- **Usage rights.** I found no licence, terms or grant that permits third-party or commercial use of the lolesports.com endpoints. [?] The evidence points against it:
  - Riot states that live, fixture and A/V data are "only available for commercial purposes through GRID". [V] https://riotesportsdata.com/league-of-legends
  - Riot calls GRID the "only distributor of real-time official esports data". [V] https://grid.gg/riot-games-and-grid-announce-exclusive-global-esports-data-partnership/
  - **Conclusion (inference):** a commercial fantasy product built on the lolesports.com feed would be unlicensed use of data that Riot licenses exclusively through GRID. Do not ship on it.

### 1b. Riot developer policies (Riot API products)

- **Betting.** "Your product cannot feature betting or gambling functionality." The same rule appears in the per-game policies. [V] https://developer.riotgames.com/policies/general (last updated 11 March 2025)
- **Monetisation.** A product must be registered and hold an Approved or Acknowledged status before it can earn money. Charging players requires a free tier and transformative content. [V] https://developer.riotgames.com/policies/general
- **Data brokering.** The LoL policy bars "apps serving as a 'data broker' between our API and another third-party company". [V] https://developer.riotgames.com/policies.html
- **Fantasy.** No Riot developer policy that I found addresses non-gambling fantasy products directly. [?]
  - Riot's community-competition guidelines list "Fantasy esports operators (including daily fantasy)" as prohibited sponsors. [V] https://developer.riotgames.com:443/policies/na-tournaments ; https://developer.riotgames.com:443/policies/oce-tournaments
  - **Inference:** Riot treats fantasy as gambling-adjacent, so expect scrutiny.
- **Scope of these policies.** They govern the Riot API (developer.riotgames.com), not esports data. Esports data is licensed separately through GRID (section 1c). [V] https://riotesportsdata.com/league-of-legends

### 1c. Official licensed route: GRID (current) and Bayes (historical)

| Item | Detail | Label / source |
|---|---|---|
| Current partner | GRID is the exclusive worldwide official esports data partner for LoL Esports and VCT under a multi-year deal announced around 30 Nov 2023. Riot took an equity stake in GRID | [V] https://grid.gg/riot-games-and-grid-announce-exclusive-global-esports-data-partnership/ ; [S] https://sbcnews.co.uk/europe/2023/12/01/riot-games-takes-equity-stake-in-grid-as-partnership-majorly-expanded/ |
| What's offered | Live in-game, fixture and A/V data, commercial use only, through API integration. Pro teams use the LoL Data Portal | [V] https://riotesportsdata.com/league-of-legends |
| Non-commercial | Riot is "working towards" opening the LoL Esports Data Portal to the community for non-commercial use. No date given | [V] https://riotesportsdata.com/league-of-legends |
| Historical partner | Bayes Esports held exclusive worldwide LoL distribution rights (live in-game, fixture and A/V, aimed at betting) from 2019, extended to 2024. GRID has since replaced it | [V] https://bayesesports.com/press-releases/riot-and-bayes-to-extend-exclusive-data-distribution-partnership-until-2024 ; [S] https://sbcnews.co.uk/esports-fantasy/2021/11/04/bayes-esports-adds-three-year-extension-to-riot-games-deal/ |
| Third-party resale | PandaScore sells LoL live data (WebSocket `wss://live.pandascore.co`, events and frames with per-player fields). Whether it holds Riot or GRID rights is not confirmed | [V] https://developers.pandascore.co/docs/data-sample-league-of-legends ; https://www.pandascore.co/blog/lol-live-data-api-pandascore-guide ; rights [?] |

---

## 2. Counter-Strike 2

### 2a. Provider comparison

| Provider | Live per-player stats? | Rights basis | Fantasy / licence terms | Label / source |
|---|---|---|---|---|
| **GRID** | Yes. Series State (GraphQL, `x-api-key`) gives team and player stats (kills, deaths, items). Series Events (WebSocket) gives play-by-play. Live delivery is push-first over WebSocket and Kafka. The CS2 page lists round economy, kill feed, positions, bomb events, and "clutch events" | Exclusive rights to ESL FACEIT Group CS2 and Dota 2 (IEM, ESL Pro League, ESL One) from 3 Aug 2025, replacing Bayes. Also Elisa Esports (2026–27), Generation NSTLGA (to end 2027), Kokonister events, BLAST (renewed Oct 2024; current status [?]), and EWC 2025 | All plans are commercial and custom-priced. The "Media" plan excludes betting. A separate "Betting & Fantasy" tier exists, so **fantasy is grouped with betting**. Use is licensed within the scope, territory and term of each agreement | [V] https://grid.helpjuice.com/3776591 ; https://grid.gg/products/live-data/ ; https://grid.gg/data/games/counter-strike-2/ ; https://grid.gg/esl-faceit-grid-esports-data-partnership/ ; https://grid.gg/grid-secures-exclusive-elisa-esports-data-rights-through-2027/ ; https://grid.gg/generation-nstlga-partners-with-grid-for-official-cs2-esports-data/ ; https://grid.gg/kokonister-partners-with-grid-for-official-esports-data-rights-across-cs2-events/ ; https://grid.gg/plans/ ; https://grid.gg/get-access/ ; [S] https://esports.gg/news/esports/grid-exclusive-data-partner-efg/ ; https://sbcnews.co.uk/europe/2024/10/31/grid-blast-data-deal/ |
| **PandaScore** | Live Basic (from €1,000 per game per month): "team & player scores in real time for LoL and CS", WebSockets and a live replay API. Live Pro (quote only): all statistics plus play-by-play. The CS2 feed has Events (kills, round ends) and Frames (a snapshot every 2 s). Not every match has live data (`live_supported`). ADR, multikill and clutch fields not confirmed [?] | Not stated publicly [?] | Stats plans are for non-betting customers only. Betting-related use must go to sales@pandascore.co. Whether fantasy counts as "betting-related" is ambiguous: one search extract of the pricing page grouped fantasy with betting, another found no fantasy clause. PandaScore also runs its own B2B daily-fantasy product | [V] https://pandascore.co/pricing ; https://www.pandascore.co/blog/cs2-live-stats-api-dashboard-developer-guide ; https://developers.pandascore.co/docs/getting-started ; [S] https://oddspapi.io/blog/pandascore-api-alternative-free-esports-odds/ ; https://igamingfuture.com/pandascore-launches-daily-fantasy-esports-platform/ |
| **Bayes Esports** | Yes. "Undelayed and high-granularity" live match data, which it markets to fantasy platforms | Lost ESL FACEIT Group to GRID (Aug 2025). Earlier: BLAST (2023–24), Elisa, Relog. 2025 women's events (ESL Impact). Current CS2 portfolio [?] | Contract only. Mainly a betting supplier (Oddin.gg partnership, Jan 2025) | [V] https://bayesesports.com/product/live-match-data ; https://bayesesports.com/press-releases/bayes-esports-and-oddin-enter-strategic-partnership ; https://bayesesports.com/press-releases/bayes-esports-is-the-official-data-provider-for-2025s-top-womens-esports-tournaments |
| **Abios (Kambi)** | Live push channels include player KDA and items. CS2 real-time data comes through Bayes | Resells Bayes rights. "Pricing, terms, availability and granularity differs between tournaments" | Says it powers "sportsbooks, teams and fantasy leagues". Price on request | [V] https://abiosgaming.com/packaging ; https://abiosgaming.com/esports-data-api ; [S] https://sbcnews.co.uk/latestnews/2024/07/15/abios-launches-additional-data-feeds-through-bayes-esports-deal/ |
| **Oddin.gg / Sportradar** | Betting-focused (odds and A/V). Player-level data for fantasy not documented [?] | Oddin: Exort Series (tier 2, multi-year) and PGL Copenhagen Major 2024. Sportradar distributes Oddin's CS2 streams to sportsbooks | Betting-oriented. Sportradar's old ESL "fantasy-level" deal is undated and likely superseded [?] | [S] https://igamingbusiness.com/company-news/oddin-gg-and-exort-announce-multiyear-data-partnership-for-exort-series-counter-strike-2-events ; https://europeangaming.eu/portal/latest-news/2023/11/29/148368/oddin-gg-secures-a-landmark-official-data-rights-deal-for-the-first-ever-counter-strike-2-major/ ; https://cdcgaming.com/sportradar-and-oddin-gg-enter-esports-live-streaming-partnership/ ; https://www.gamingintelligence.com/markets/26805-sportradar-taps-into-fast-growing-esports-market-with-esl-partnership/ |
| **Runestone** | Unknown [?] | Reported as official data and integrity partner for PGL's CS2 circuit through 2029 and the FiReMAJOR Buenos Aires 2027. Also worked with StarLadder on the Budapest Major 2025 | Unknown [?] | [S] https://esports.gg/news/cs2-buenos-aires-major-2027/ |
| **HLTV** | No public API that I found [?] | None granted to third parties | Scrapers and wrappers exist, some of which advertise Cloudflare bypass. I could not retrieve HLTV's terms of use, so the claim that scraping is prohibited is **unverified** [?]. Treat it as unauthorized: no licence exists to cite | [S] https://apify.com/solidcode/hltv-scraper.md ; https://pypi.org/project/hltv-crawler/ ; https://www.jack.bio/blog/hltv |

**Key observations**

- Counter-Strike data rights are held per tournament organizer, not by Valve. Coverage therefore splits across vendors, and no single vendor covers every event:
  - GRID: ESL FACEIT Group, BLAST(?), Elisa
  - Runestone or Oddin: PGL
  - Oddin: Exort
  - (sources in the table above)
- GRID Open Access is free, but it covers CS2 and Dota 2 **historical** data only. Live data is for commercial partners. It is open to pre-revenue startups, independent developers and academics. [V] https://grid.gg/open-access/
  - This suits building and testing a scoring engine on real data before you sign a licence.

### 2b. CS2 Game State Integration (GSI)

- **What GSI is.** The game client POSTs JSON game state to an HTTP endpoint named in a `gamestate_integration_*.cfg` file, and sends an update whenever state changes. [V] https://developer.valvesoftware.com/wiki/Counter-Strike:_Global_Offensive_Game_State_Integration
- **All-player data needs an observer.** The `allplayers_*` blocks (match stats, state, weapons, position) take effect only in GOTV/HLTV or observer mode. A playing client exposes only the local player. [V] https://developer.valvesoftware.com/wiki/Zh/Counter-Strike:_Global_Offensive_Game_State_Integration ; [S] https://github.com/antonpup/CounterStrike2GSI
- **Why it cannot feed pro-match fantasy.** GSI runs on a client you control. Pro matches run on organizer-controlled servers and observer machines, and their data rights are sold exclusively (2a). Taking GSI from a GOTV relay of a pro match would mean sourcing rights-holder data without a licence. [inference]
- **Known issues.** `allplayers` can be empty for some players. [V] https://developer.Valvesoftware.com/wiki/Talk:Counter-Strike:_Global_Offensive_Game_State_Integration
- **Data format.** Some numeric fields arrive as strings, field casing is inconsistent, and some sub-objects are optional. [S] https://docs.rs/crate/cs2-gsi/0.1.1
- **Valid uses.** Your own community or test matches, internal QA, and generating realistic fixture data for development.

---

## 3. VALORANT

| Source | Live per-player stats? | Rights / terms | Label / source |
|---|---|---|---|
| Riot / GRID (official) | Yes. GRID is the exclusive distributor of live VALORANT data straight from Riot (in-game, fixture, A/V) | Commercial use only through GRID. Riot is "working towards" community access for non-commercial use | [V] https://riotesportsdata.com/valorant ; https://grid.gg/riot-games-and-grid-announce-exclusive-global-esports-data-partnership/ |
| GRID Open Access | **No VALORANT.** Covers CS2 and Dota 2 historical only | n/a | [V] https://grid.gg/open-access/ |
| Riot VALORANT developer API | Not an esports live feed. Needs a production key, and RSO access requires one. Pro-match coverage not confirmed [?]. Same no-betting rule as LoL | Riot developer policies | [V] https://developer.riotgames.com/docs/valorant ; https://support-developer.riotgames.com/hc/en-us/articles/22698769097107 |
| PandaScore | **No live or real-time plan for VALORANT.** Post-game events and rounds only, with depth depending on tier. The Historical Pro plan (Feb 2026) is explicitly not real-time | Same non-betting restriction on stats plans | [V] https://developers.pandascore.co/docs/plan-reference ; https://www.pandascore.co/blog/pandascore-valorant-historical-pro-plan-release |
| vlr.gg scrapers (vlrggapi, vlresports, vlrdevapi, Apify actors) | Scraped scores and stats, no rights attached. vlr.gg has no official API | **UNAUTHORIZED.** Not affiliated with vlr.gg or Riot. I could not retrieve vlr.gg's terms [?]. Do not use in production | [S] https://github.com/axsddlr/vlrggapi ; https://awesome.ecosyste.ms/projects/github.com%2Forloxx23%2Fvlresports ; https://awesome.ecosyste.ms/projects/github.com%2Fvanshbordia%2Fvlrdevapi ; https://apify.com/crawlerbros/vlrgg-scraper/api |

---

## 4. Recommendation

**Closed beta (development replay, fictional data)**

1. Build an internal replay harness that emits a **vendor-neutral event schema**: kill, death, assist, damage, round end, and map end. Feed it fictional rosters and matches.
2. Write adapters later, one per vendor:
   - GRID: Series Events and Series State
   - PandaScore: Events and Frames
3. Optional sources of realistic data:
   - Run your own CS2 matches with a GSI observer (2b).
   - Apply for **GRID Open Access** to get historical CS2 data for tuning the scoring rules. Confirm first that its terms allow internal test use and do not allow showing it to beta users (https://grid.gg/open-access/).
4. Do **not** use any of these, even in beta:
   - the lolesports.com persisted or livestats feeds
   - HLTV
   - vlr.gg scrapers
   - GSI from GOTV relays of pro matches

**Launch (CS2)**

- **Primary: GRID.** It holds the largest official tier-1 CS2 portfolio found here (ESL FACEIT Group: IEM and ESL Pro League; Elisa; possibly BLAST), and it is also the only route to LoL and VALORANT later. That makes it one integration for all three titles.
- **Alternative or supplement: PandaScore Live Pro.** Use it only if the vendor confirms in writing that a free-to-play fantasy product is not "betting-related" use.
- **Gaps:** Bayes (via Abios) and Runestone/Oddin cover other tournaments. Add them only if tournaments the app must cover (e.g. PGL events) fall outside GRID.

**Confirm in writing with each vendor**

| Item | GRID | PandaScore | Others (Bayes/Abios, Runestone, Oddin) |
|---|---|---|---|
| Which tier applies to free-to-play fantasy (Media vs "Betting & Fantasy"), and its price | yes | yes ("betting-related" definition) | yes |
| Tournament list with live per-player stats (by organizer and tier), and rights expiry dates | yes (BLAST status, PGL) | yes (and whether PandaScore holds the rights) | yes |
| Exact fields: K/D/A, damage or ADR, headshots, multikills, clutches (provided directly, or derived from events) | yes | yes | yes |
| Latency and update cadence, SLA, uptime, and fallback when a match is not `live_supported` | yes | yes | yes |
| Display and redistribution rights in the app UI, how long data may be stored, and use of historical data for scoring disputes or settlement | yes | yes | yes |
| Whether prizes or rewards (even free ones) make the product "fantasy/betting" | yes | yes | yes |
| Use of player names and likenesses, team logos, and any required attribution | yes | yes | yes |
| Territory, term, termination, and dev/sandbox or replay access for testing | yes | yes | yes |
| For LoL/VALORANT: Riot's position on fantasy products, given that Riot lists fantasy operators as prohibited sponsors | yes (via Riot) | n/a | n/a |

---

## Could not verify

- Riot's or lolesports.com's own terms covering the `persisted/gw` and `livestats` endpoints, and any explicit ban on scraping them.
- The exact cadence of livestats frames (about 10 s), the `startingTime` rounding, and the current per-player field names in `window` and `details`.
- Which leagues have livestats on lolesports.com (for example the LPL).
- Whether non-gambling fantasy is allowed under Riot developer policies. The policies ban betting, and Riot lists fantasy operators only as prohibited sponsors.
- Whether PandaScore counts free-to-play fantasy as "betting-related". The search extracts conflicted.
- PandaScore Live Pro pricing, its CS2 field list (ADR, multikills, clutches), and the basis of PandaScore's data rights.
- GRID's current CS2 Series State schema for damage, headshots, multikills and clutches, and all GRID prices.
- Whether the BLAST and GRID deal is still active after 2024, and who holds PGL's live CS2 data rights in 2026 (Runestone reported; Oddin and IMG held them earlier).
- HLTV's and vlr.gg's terms of use, which I could not retrieve.
- Whether the Riot VALORANT API exposes pro or esports matches.
- Sportradar's current CS2 fantasy-level data rights.
