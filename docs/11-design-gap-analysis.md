# 11. Design gap analysis (against DESIGN.md v1.0)

`docs/DESIGN.md` is the source of truth for UI and UX. `docs/04` and `docs/09` remain the source of truth for rules. This is what the app (commit `648654a`) got wrong against the spec, and what changes.

| # | DESIGN.md | What the app did | Change |
|---|---|---|---|
| 1 | §3.2 No condensed display fonts for ordinary content; tabular numerals | Archivo condensed for the hero, prices, scores and ranks | Geist only. Numbers use tabular figures at the sizes in §3.2 |
| 2 | §5.1 Hero 210–250px at 390 wide, headline 28/34 | 340–380px poster with a 64px uppercase title | Compact hero: art above, readable overlay below, one CTA |
| 3 | §3.4 No page gradients, glows or tinted cards | Page background glow, glowing primary buttons, team-tinted rows, gradient contest card, gradient "you" rows | Flat surfaces. One spotlight per screen, inside imagery only |
| 4 | §3.1 Tokens | Close, but slightly different values and many hard-coded hexes | Spec tokens in `globals.css`; components use tokens only |
| 5 | §2.6, §8 No fake likenesses | Generated busts with skin tones and hair could read as real people | Neutral silhouettes: one tone, team colour only in the jersey trim and the halo inside the frame. Licensed headshots replace them |
| 6 | §5.1 Esport selector with future games disabled | Static "CS2" label | Sport switcher: CS2 active; LoL and VALORANT marked *Coming later* and disabled |
| 7 | §5.3 No role tabs unless roles are scored constraints | Role chips in the quick filter row | Quick controls are All, Team, Sort and Fits budget. Roles live in the filter sheet as metadata |
| 8 | §5.3 Sticky compact summary; expanded lineup is a separate tap | Large roster card that scrolls away on phones | Sticky summary (salary, count, five 40px slots); tap to open the full lineup |
| 9 | §5.3 Bottom action reads "3 of 5 players selected" (disabled) until the lineup is valid | "Review team" enabled with any players picked | Review Team enabled only for a full, valid lineup; otherwise the honest state |
| 10 | §5.3 72px rows, 44px add button, selection via strip and icon, not a painted row | 2-line rows with tinted background, 40px button, mint-washed selected row | 72px rows, 44px button, a 3px mint strip and filled check when selected |
| 11 | §5.4 Tabs Overview · Stats · Matches; full salary on details; 5-match chart with sample size | Form / Recent maps / Schedule; compact salary; 10-map chart | Renamed and regrouped; `$245,000`; last 5 maps chart labelled with the sample |
| 12 | §5.5 Roster review as a signature moment, captain centre with 2/2 | Captain card above a 2×2 grid | Lineup poster: captain centre, two either side, tap to change captain |
| 13 | §5.6 Large points and rank, last-map change, honest map status | Points large, rank secondary, no last-map value | Points and rank equal weight; each player shows last-map points and "Map in progress · updates when map ends" |
| 14 | §5.7 60–64px rows, segmented Global / Friends / Private | Rows fine; segment labels partly differ | Aligned labels and rhythm; no nested cards |
| 15 | §3.3 Desktop max-width 1360px; builder rails 240 / flex / 340–380 | 1152px main, 1400px builder | 1360px everywhere; builder 240 / flex / 360 |
| 16 | §3.2 Nothing below 12px | 10–11px labels in several places | 12px minimum |
| 17 | §3.5 CTA copy: Build Team, Review Team, Submit Team, View My Team, View Standings | Mixed sentence case ("Build your team") | Spec labels everywhere |

Kept: brand (lockin, original mark), the radar event graphic (original and abstract, §3.4), generated team crests (clearly not real logos), demo labelling on every screen, and all gameplay rules.
