# 8. Risks and open questions

Covers deliverable 11. Each item says what kind of validation it needs: **user testing**, **technical validation**, **licensing review** or **legal advice**.

## Biggest risks

| # | Risk | Likelihood | Impact | Mitigation | Validation |
|---|---|---|---|---|---|
| 1 | **No affordable, licensed CS2 stats for the events we need** (e.g. PGL Majors' rights unknown; GRID exclusive for ESL FACEIT Group) | Medium | Critical | Talk to GRID and PandaScore first; design a fallback scoring table that needs only K/D/A and map results | Licensing |
| 2 | **HLTV's distribution advantage:** fans don't leave the site they already use | High | High | Don't compete on stats or prizes; compete on social leagues, creators and UX. Measure invites per entry | User testing |
| 3 | **Scoring feels wrong to experts** (e.g. undervalues AWPers or supports) | Medium | High | Back-test on 20+ events; publish the rules early and invite expert feedback during the alpha | Technical + user testing |
| 4 | **Too simple for enthusiasts** after cutting roles and boosters | Medium | Medium | Transfers, ownership and value tools provide depth; a booster A/B test in Phase 2 | User testing |
| 5 | **Casual users leave after their players are eliminated** | High | High | Autopilot, stage leaderboards, friends' boards | User testing |
| 6 | **Logos, photos and event marks** used without rights | Medium | Medium | Typographic cards by default; licence before using; no organiser marks in contest names without permission | Licensing + legal |
| 7 | **Prize contests breach state or country rules** | Low–Medium | High | Free entry, skill-only, no random tiebreaks, per-contest official rules, legal review | Legal |
| 8 | **Riot policy blocks LoL and VALORANT features** (data use, branding, "official"-sounding names) | Medium | High (Phase 3) | Engage Riot or GRID early; avoid words like "Championship" or "League" without approval [S] | Licensing |
| 9 | **Data corrections after users have seen results** erode trust | Medium | Medium | Provisional/official/settled states, a visible change log, a 24 h settlement delay | Technical |
| 10 | **Revenue doesn't arrive** before money runs out | High | High | Keep costs small; sponsorship pipeline from the alpha onward; organiser partnerships as the upside | Business |
| 11 | **Child safety and age:** esports audiences skew young | Medium | High | Age gate for prize contests (18+, or the local age of majority); moderation for chat (P2); no gambling-adjacent sponsors | Legal |
| 12 | **Peak load at lock time** (everyone edits in the last minutes) | Medium | Medium | Load test the entry endpoint and leaderboard recompute; static caching for read paths | Technical |

## Open questions

### Product (user testing in the alpha)

1. Does a casual fan actually finish a lineup in two minutes with "Suggest a team"? What's the completion rate?
2. Do people prefer the **Main Event** (starts at Stage 3) or the **Full Run**? Should Full Run exist at launch at all?
3. Is the **2 transfers per window** limit right, or would 1 or 3 create better decisions?
4. Does **Autopilot** feel fair to enthusiasts who make their own changes? Should Autopilot entries be marked on the leaderboard?
5. Is a **1.5x captain** enough of a decision, or should captains change per stage only (current proposal) or per match?
6. Do people want **ownership visible before lock** (DraftKings convention) or only after (proposed, to reduce herding)?
7. Which sign-in option do CS fans prefer (Steam OpenID, Discord, Google)?
8. What makes someone **invite a friend**: the share card, the league, or the rivalry?

### Scoring (technical validation)

9. Does the licensed feed provide **opening kills, multi-kill rounds and clutches**, or must they be derived from play-by-play? If neither, use the fallback table.
10. What are the right **format weights** and **advancement credit** after back-testing?
11. Is the **24-round overtime cap** right for CS2 and VALORANT?
12. How should prices be set for players with **no history** (new rosters, stand-ins)? Flat median, or team-based?

### Data and licensing (licensing review)

13. Who holds data rights for **PGL** events, including the Singapore Major (Nov–Dec 2026)?
14. Does **GRID's fantasy tier** cover a free product with sponsor-funded prizes? Does **Open Access** cover a pre-revenue alpha?
15. Does **PandaScore's "non-betting" stats plan** cover fantasy with sponsored prizes?
16. Can we **retain** historical scores after a data contract ends (needed for career history)?
17. What's Liquipedia's **commercial API** pricing, and is CC-BY-SA attribution enough for our use?
18. What do teams and organisers require for **logo and photo** use?

### Legal (legal advice)

19. Requirements for **free prize contests** in the US (state by state), UK, EU and Brazil.
20. Is the **career rating** a "ranking" that could imply official status under publisher policies?
21. **Age requirements** and parental consent for under-18 users in non-prize play.
22. **Privacy:** GDPR, CCPA and children's privacy for profiles and leagues.

## Research gaps to close

These were in the brief but couldn't be done in this session because the network policy blocked direct access to every reference site. Once these domains are allowed in the environment's **Network access** settings, the installed REA tooling can capture page structure, scripts and network calls (then compare with what's documented here):

`hltv.org`, `sleeper.com`, `draftkings.com`, `app.kboom.gg`, `kboom.gg`, `lolesports.com`, `valorantesports.com`, `lcsofficial.gg`, `pickstop.gg`, `liquipedia.net`, `vlr.gg`, `gol.gg`, `pandascore.co`, `developers.pandascore.co`, `grid.gg`, `riotesportsdata.com`, `help.underdogsports.com`

| Product | What to check hands-on |
|---|---|
| HLTV Fantasy | Contest list and entry; team builder (search, filters, price display, validation); role and booster selection UX; live points view; leaderboards; private leagues; mobile web; current official rules page (to confirm or replace the dated rules in this report) |
| Sleeper | League create → invite → draft room → live matchup → chat, on mobile web; Fantasy LCS status |
| DraftKings | Lobby, lineup builder, player modal, remaining salary, contest rules page, live leaderboard |
| KBOOM | Onboarding, pack opening, card presentation, whether Gems are purchasable, predictions |
| Riot | LCS Fantasy app flow, Pick'Em flow on lolesports.com and valorantesports.com |
| Pickstop | Rules, scoring, bracket interaction, profiles, sharing |
| PandaScore / GRID | Docs for CS2 stat fields (opening kills, clutches, multi-kills), latency, terms |

Note: logged-in areas (contest entry, leagues, drafts) will need test accounts. Several of these products also have native apps that a browser can't inspect.
