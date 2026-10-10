# 10. Implementation decisions

What changed between the blueprint (docs 01–09) and the built MVP, and why. Each entry names the contradiction or gap, the evidence, and the decision. Where testing contradicted the blueprint, the blueprint lost.

## Gameplay changes found by testing

### 1. Format weights removed (rule set `cs2-v2`)

- **Blueprint:** docs/04 recommended BO1 ×0.8 / BO3 ×1.0 / BO5 ×1.2, *and* a calibration target that average series scores differ by under 10% between formats. The two conflict.
- **Evidence:** six simulated Majors (`tests/unit/fairness.test.ts`). Map-averaging alone already equalises formats (average series score 25.0 / 24.9 / 25.2). With v1's weights it becomes 20.0 / 24.9 / 30.2, a ~20% gap created purely by the weights.
- **Decision:**
  - New contests pin `cs2-v2`, which has neutral weights.
  - `cs2-v1` stays registered, so the documented worked examples still reproduce exactly and historic contests remain replayable.
  - A test documents why v1 was replaced.

### 2. Prices are set per stage window; kept players stay at the price paid

- **Blueprint:** docs/04 said prices are fixed for the whole tournament.
- **Evidence:** with one global price scale across all 160 players, the Full Run's Stage 1 pool (the 16 lowest seeds) topped out at $185k. Any five players fit under the $1M cap, so the core trade-off disappeared.
- **Decision:**
  - When a window opens, its pool is priced across the full $100k–$290k range from history up to that moment.
  - Players you keep stay at the price you paid; new signings cost the current price. This is the familiar Fantasy Premier League rule.
  - Purchase prices are stored on every roster selection (`roster_selections.price`), and validation, Autopilot and the builder all use them.
  - Every window in the demo now averages about $188k per player.

### 3. Builder guard against dead-end rosters

- **Evidence:** the browser test built a four-player roster that left $0 for the fifth slot.
- **Decision:** the builder blocks any pick that leaves too little money to fill the remaining slots with the cheapest available players. The row says so in words ("Leaves too little for 2 more players").
- **Scope:** this is a client guard. The server rules are unchanged, and such a roster could never be submitted anyway.

### 4. Reference prices refresh at each window

- **Bug found in the design review:** the player sheet showed contest-level reference prices computed before any history existed (all averages 0). That made a strong player look like the cheapest.
- **Fix:** reference prices and averages are refreshed whenever a window opens. Autopilot tie-breaks and research views use them; prices paid stay on roster selections.

## Contradictions between documents, and resolutions

| # | Contradiction | Resolution |
|---|---|---|
| 5 | **Navigation.** docs/05 has Home · Events · Leagues · Profile; the development brief has Home · Fantasy · Leagues · Profile. | Followed the brief. Events are reached from Home (featured and upcoming) and each event has its own Overview / Fantasy / Matches / Bracket / Standings tabs. |
| 6 | **Leagues.** docs/05 says a league persists across events; the brief says a league is created for a tournament or contest. | MVP leagues are contest-scoped (simplest correct model; one entry, many leagues works). Persistent communities that roll from event to event are a Phase 2 extension of the same tables. |
| 7 | **"Suggest a team".** docs/05 says it picks the most-owned players; docs/04 hides ownership until lock to reduce herding. | Suggest picks by recent form within budget. Ownership appears after lock. |
| 8 | **Main Event timing.** docs/04 makes the Main Event (starting at Stage 3) the default casual contest, but Stage 3's teams are only known once Stage 2 ends. | Main Event opens when its teams are known, giving it a short entry window (about a day). The UI says "Opens when Stage 3 is set". **Product risk:** the recommended casual contest is open for the least time. See open questions. |
| 9 | **Who gets advancement credit.** docs/04 says "each player". | Players who played the team's final series in the stage. A temporary stand-in who played that series gets it; the benched regular doesn't. |
| 10 | **Stand-ins.** docs/04 adds stand-ins to the pool at a flat price. | Temporary, one-series stand-ins are not added to the pool. The rostered regular scores 0 for that series ("Did not play") and returns afterwards. Permanent roster changes need the admin workflow (not built). |
| 11 | **Settlement.** docs/06 has an admin confirm settlement. | Settlement is automatic 24 hours after the final stage ends (ledger rows become `settled`; final standings snapshot). Admin confirmation needs the admin console. |
| 12 | **Sign-in.** docs/09 specifies Google, Discord, Steam OpenID and email. | No OAuth credentials exist in this environment, so the MVP uses username/email + password (scrypt N=2¹⁷, opaque session tokens stored hashed, httpOnly SameSite=Lax cookies). OAuth providers slot in beside it. |
| 13 | **Light mode.** docs/05 asks for a designed light mode; the brief asks for dark-first. | Dark only for now. Tokens are centralised in `globals.css`, so a light theme is a token set, not a rewrite. |

## Behaviours worth knowing

- **One entry per user per contest.** Saving again creates a new roster version; history is kept.
- **Transfers are counted against the previous window's locked roster,** not against earlier saves in the same window, so editing repeatedly before lock never burns transfers.
- **Rosters carry forward unchanged into the next window.** Eliminated players stay (shown as "Out") until replaced, for free.
- **Autopilot runs exactly at lock,** only for entries that still contain ineligible players. It never touches eligible players and never spends discretionary transfers. Every replacement is recorded in `transfers` (kind `autopilot`) and `admin_audit_log`. If no legal replacement exists, the slot stays empty and the dashboard says so.
- **In-progress series score provisionally** from finished maps, without the series result. They become `official` when the series ends and `settled` at settlement.
- **Corrections append, never overwrite.** A stats correction creates a new `player_map_stats` version and a `score_corrections` record, and supersedes the affected ledger rows. The dashboard marks those series "Corrected".
- **Rosters for an open window are private;** they become visible to others once the window locks.
- **Ties never use randomness.** Total → captain points → fewer transfers → earlier final submission → shared rank.

## Visual identity without licensed images

UI decisions now follow `docs/DESIGN.md` (source of truth). See `docs/11-design-gap-analysis.md` for what changed to meet it.

- **No photos, no logos, no likenesses.** Demo players are fictional and no image rights exist, so portraits and crests are generated (`src/components/ui/art.tsx`), deterministic per player and team.
  - **Portraits** are neutral silhouettes: one slate tone for every figure, varying only in outline (hair, beard, headset). They don't imply what a real person looks like. Team colour appears only in the jersey trim, the chest crest and a soft halo inside the frame.
  - **Crests** are a shield, hex, round or kite shape in the team colour, with an emblem taken from the team's name (Ember Row gets a flame, Kestrel a wing). They are clearly not real organisations' marks.
  - **Event art** is a top-down radar of a fictional map with A and B sites: original, abstract, and native to CS2.
- **Licensed images replace them in the same frames** (`PlayerAvatar`, `TeamMark`, the roster showcase), so layouts don't change.
- **Flat fills only.** SVG gradient ids repeat when the same player appears twice on a page. If the first copy sits inside a hidden panel, Chrome stops painting the others.
- **Type:** Geist throughout, with tabular figures for every number (DESIGN.md §3.2). A condensed display face was tried and removed.

## Demonstration mode

- **No licensed data was available.** pandascore.co and grid.gg are unreachable from this environment.
- **The app runs on a demo provider.** It simulates fictional tournaments round by round: 32 fictional teams, 160 fictional players, all labelled "Demo data".
- **The real pipeline still does the work.** Demo data goes through the same adapter boundary, validation, ledger and contest lifecycle that licensed data would. `src/server/providers/pandascore/adapter.ts` is a stub that fails loudly instead of fabricating data.
- **Demo controls move a server-side clock** to the end of the next stage, so a whole Major plays out in minutes. Locks, windows and scoring all follow that clock.

## Not built yet (before a public MVP)

| Area | Status |
|---|---|
| Licensed data adapter (PandaScore or GRID) | Interface ready; needs credentials, field verification and licence terms (docs/08 Q9, Q13–16) |
| Admin console (roster changes, disputes, manual stats with two-person approval, settlement confirm) | Data model and audit log exist; no UI |
| Notifications (email / web push) | Not started |
| OAuth sign-in (Google, Discord, Steam OpenID) | Not started |
| Share cards (generated images) | Share uses the system share sheet or copies a link; no image yet |
| Creator league branding, Pick'Ems, career rating | Phase 2 by design |
| Distributed rate limiting, job scheduler, monitoring | In-process limiter and on-request pipeline tick; move to Redis and a scheduled worker for production |
| Light theme | See #13 |

## Open questions raised by the build

1. **Main Event entry window (#8).** Should it open at the start of the event with the 8 directly-invited Stage 3 teams plus 8 "TBD" slots? Or should Stage 2's last round be the lock? Needs user testing.
2. **Advancement credit value.** With neutral format weights, 3-0 players average 145 vs 132 for 3-2 players (10% more). This is in line with docs/04's "slightly more". Re-check with real data.
3. **Pricing.** History-based percentile prices work in simulation. Real CS2 data will need the calibration in docs/04 (value per $ roughly flat across price tiers).
