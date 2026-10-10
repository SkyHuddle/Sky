# 5. Information architecture, screens and journeys

Covers deliverables 5 (IA), 6 (screen-by-screen UX), 7 (user journeys) and Part 11 (design direction). Everything here is **[R] recommendation**. Screen details from competitors were not examined (see the [method note](README.md#how-this-research-was-done-and-its-limits)), so nothing here copies a specific competitor layout.

## Core model: three things, clearly separated

```
Event (a real tournament, e.g. "IEM Katowice")
 ├── Stages (Stage 1, 2, 3, Playoffs) ── Matches ── Maps
 ├── Contests (fantasy games on this event)
 │     └── Entries (one user's team in one contest)
 │           └── appear on many Leaderboards:
 │                 Global · Stage · Friends · each League the user is in
 └── Pick'Em (Phase 2; separate scores, linked from the event)

League (a group of people, e.g. "Friday Night CS" or a creator's community)
 └── persists across events; each event, members' entries show on the league board
```

**The key rule: a League is a group of people, never a separate game.** Joining a league doesn't create a new entry; your one entry per contest appears in every league you're in. This is what makes invites cheap and keeps the scoring single-source.

## Navigation

Mobile: bottom tab bar with four tabs. Desktop: the same four in a left rail, with a wider content area.

| Tab | What it holds | Why it's top-level |
|---|---|---|
| **Home** | Your active entries, next deadline, events open for entry, your leagues' latest movement | Answers "what do I need to do / how am I doing" in one glance. |
| **Events** | All events by status: Live · Open · Upcoming · Completed; filter by game | The event is the unit fans think in. |
| **Leagues** | Your leagues and creator leagues; create or join | The social and growth surface. |
| **Profile** | Career, history, trophies, settings | The permanent identity. |

**Not tabs:**
- **Pick'Ems** live inside each event.
- **Players** are reached from the builder and from match pages, not browsed on their own.
- **Notifications** are a bell in the header.

### Screen hierarchy

```
Home
Events
 └── Event page
      ├── Overview (format, schedule, deadlines, contests)
      ├── Bracket / Schedule
      ├── Contest: Main Event
      │    ├── Lineup builder  (pre-lock)
      │    ├── Live view       (post-lock)
      │    └── Leaderboards    (Global · Stage · Friends · Leagues)
      ├── Pick'Em (P2)
      └── Rules (versioned)
Player detail (sheet over any screen)
Match detail (map-by-map, linked from live view and player detail)
Leagues
 └── League page (members, current event board, history, settings)
Profile
 ├── Career (per game)
 ├── Event history
 └── Settings (notifications, Autopilot default, account)
```

## Screen-by-screen specifications

### 1. Home

**Job:** in under 3 seconds, tell me what's happening with my teams and what I should do next.

Order, top to bottom (mobile):

1. **Action card**, only one at a time, the most urgent:
   - "Lock in 2h 14m: Main Event lineup not set" (Build Team)
   - "Stage 3 window open: 2 players eliminated" (Make transfers)
   - "Your team is live: 3 players playing now" (Watch live)
2. **My active entries**: one card per entry: event, rank, percentile, points, movement since last visit (▲312), players live now.
3. **Open for entry**: up to 3 events with a countdown to lock and a "Build Team" button.
4. **My leagues**: each league's current leader and your position.
5. **Recently completed**: final rank and a "Share result" button.

Empty state for a new user: one featured event, "Build a team in 2 minutes", and "No account needed to try".

**Not on Home:** news, editorial content, stats tables, ads above the fold.

### 2. Event page

**Job:** everything about this tournament, with a clear relationship between the whole event and its stages.

- **Header:** event name, dates, game, status chip (Upcoming / Open / Live / Completed); organiser branding only where licensed.
- **Stage timeline:** a horizontal stepper (Stage 1 → 2 → 3 → Playoffs) marking the current stage, the next lock time and transfer windows. This one control explains the structure of the whole event.
- **Contests**: one card per contest ("Main Event, starts Stage 3", "Full Run, starts Stage 1") showing entries, your status, and the next deadline.
- **Tabs:** Overview · Bracket · Leaderboards · Rules.
- **Bracket:** Swiss standings table per stage (W-L, Buchholz if the organiser publishes it) and a playoff bracket; tapping a match opens Match detail.

### 3. Lineup builder (the most important screen)

**Job:** a casual fan builds a valid team in two minutes; an expert has every number they need.

**Layout decision: a compact stat list, with a sticky roster tray and a bottom sheet for player detail.**
- **A compact list beats cards on mobile:** 8–10 players visible at once versus 2–3 cards, and stats line up in columns for comparison.
- **Cards** are for the roster tray and share images, where showing off matters more than comparing.

```
┌───────────────────────────────────┐
│ Main Event · locks in 2h 14m      │
│ $135k left · $67.5k per open slot │  ← sticky budget bar
│ [■][■][■][ ][ ]   ★ captain: —    │  ← roster tray (tap to expand)
├───────────────────────────────────┤
│ Search players or teams      ⚲    │
│ [All teams ▾] [Price ▾] [Sort ▾]  │
├───────────────────────────────────┤
│ ○ Player A Team A  $255k  41.2 ▲  │  ← avg pts/map, form arrow
│ ○ Player B Team B  $210k  36.8 ▬  │
│ ⊘ Player C Team C  $190k  — max 2 │  ← disabled, reason shown
│ ...                               │
├───────────────────────────────────┤
│        [ Review team → ]          │
└───────────────────────────────────┘
```

Behaviour:
- **Quick start:** "Suggest a team" fills a valid lineup (most-picked within budget, or "balanced") that the user then edits. This is how the two-minute promise holds for someone who knows 10 players.
- **Every row shows:** player, team logo/tag, price, average fantasy points per map (last 3 months), form indicator, the team's first opponent.
- **Sort options:** price, points per map, value (points per $10k), most picked (after lock only). **Filters:** team, price range, "fits my budget".
- **Invalid choices are disabled with the reason inline** ("2 from Team C already", "$15k over budget"). Never a surprise error on submit.
- **Budget bar** shows money left and the average left per open slot.
- **Captain:** a star on each roster slot; first-time hint: "Your captain scores 1.5x".
- **Review screen:** 5 player cards, captain marked, total price, lock time in local time, Autopilot toggle (on by default) with a one-line explanation, then **Confirm team**.
- **Confirmation:** "You're in. Locks Sat 18:00." Then "Invite friends to compare" and "Join a league".
- **Before lock,** the user can edit freely; the entry shows "Saved, editable until lock".
- **No account until saving:** the lineup is kept on the device and attached to the account on sign-up.

### 4. Player detail (bottom sheet)

**Job:** answer "is this player a good pick for this tournament?" with facts, clearly separated from predictions.

1. **Header:** name, team, price, role tag (if data supports it), ownership % (after lock).
2. **Facts (historical):** fantasy points per map in the last 10 maps (a small bar chart), average and consistency (share of maps above 25 points), record against this event's opponents, LAN vs online split if the data supports it.
3. **This tournament:** schedule (first match and opponent), path (enters Stage 3), current fantasy points if live.
4. **Predictions** (Phase 2+, labelled "Projection"): projected points with a range, advancement probability. Hidden until a model is validated.
5. **Actions:** Add / Remove / Make captain.

Only show metrics the licensed feed supports. No HLTV Rating, ACS or anything we can't reproduce.

### 5. Live contest view

**Job:** feel connected to the matches, and always know why your score changed.

1. **Score header:** total points, rank, percentile, movement since last visit, state chip (Provisional / Official / Settled).
2. **Roster list,** one row per player:
   - Status: Live now · Next match Sat 14:00 · Done for stage · Eliminated (with "Replace at Stage 3 window")
   - Points this stage; tap to expand the per-map breakdown: K/D/A, bonuses, overtime cap, map win, format weight, captain multiplier. Every number links to the match.
3. **Pending updates:** "2 maps awaiting official stats" so a stale score never looks final.
4. **Leaderboard preview:** the 2 above and 2 below you, plus friends' positions; "View full leaderboard".
5. **Matches today:** filtered to matches involving your players.

Updates arrive per map at launch (Phase 2: live in-match). A small "updated 2 min ago" timestamp is always visible.

### 6. Leaderboards

- **Tabs:** Global · Stage · Friends · each League you belong to.
- **Each row:** rank, name, avatar, points, movement, captain. Tap a row to compare that roster with yours side by side (shared players highlighted).
- **Your row is pinned at the bottom** when it's scrolled out of view.
- **Large boards** show percentile bands ("Top 1%", "Top 10%") as section headers.
- **Ties** show a shared rank with the tiebreak rule in a tooltip.
- **Scores from different games are never ranked on one board.**

### 7. Leagues and creator leagues

**Create:** name → choose game(s) → "for every event" or "this event only" → invite link created. Three steps.

**League page:**
- **This event's board,** across members' existing entries; members without an entry see "Build your team" in place of a rank.
- **League history:** past events' winners and the league's all-time table.
- **Settings (owner):** name, image, privacy (link only / public), member removal. Pinned message.
- **Creator leagues (Phase 2):** a public page with branded header, a short link (/l/creatorname), a public board, end-of-event share cards, and a member cap set by tier.

**Joining from a link:**
1. The invite page shows the league, owner and member count.
2. "Join". If the user has no entry, open the builder; afterwards, return to the league board with their row highlighted.

### 8. Profile

- **Header:** avatar, username, favourite game(s), headline stat ("Top 4% · CS2 · 2027 season").
- **Career, per game:** season rank, best finishes, average percentile, trophies.
- **Event history:** each event's rank, percentile and points; tap to see that roster.
- **Rivalries (Phase 2):** head-to-head record against friends in shared leagues.
- **Privacy:** profile public or friends-only.

### State design (every contest card and entry)

| State | Visual treatment | Copy example |
|---|---|---|
| Upcoming | Neutral outline | "Opens Nov 20" |
| Open | Accent fill + countdown | "Locks in 2h 14m" |
| Locked | Muted + lock icon | "Locked · starts in 35m" |
| Live | Red dot + "LIVE" label | "3 players live" |
| Window open | Accent outline + transfer icon | "Stage 3 window: 2 changes free" |
| Eliminated (player) | Greyed, struck-through team tag | "Eliminated · replace at next window" |
| Completed | Neutral + trophy if placed | "Finished #1,204 · top 6%" |

Colour is never the only signal: each state also has an icon and text.

## Design direction (Part 11)

- **Original identity:** a deep ink background (not pure black) for dark mode, one confident accent colour for primary actions and "open" states, and team colours used only on team tags. No neon glows, no gradient meshes.
- **Typography:** one modern grotesk with tabular figures for every number, so columns line up and scores don't jitter as they update. Two weights for hierarchy, plus a monospace or tabular variant for scoreboards. Open-licence fonts (e.g. Inter, Geist) avoid licensing cost.
- **Numbers first:** points, prices and ranks are the largest text in their component. Labels are small and quiet.
- **Motion with purpose:** a score tick-up when points arrive, a rank-change slide, a confirmation pulse on lock. Nothing animates on loop.
- **Player presentation:** use player photos and team logos only where licensed; otherwise a clean typographic card (player name, team tag, flag) that still looks premium. Design the typographic card first so licensing never blocks a screen.
- **Light mode** is supported and designed, not just inverted.
- **Accessibility:** WCAG AA contrast, 44 px touch targets, full keyboard support on desktop, reduced-motion setting respected.

## User journeys

### A. First-time casual fan (Major Main Event)

1. Sees a friend's share card on X: "I'm top 3% in the Major. Beat me." Taps the link.
2. Lands on the event page; the main contest card says "Main Event · locks Sat 18:00 · 41,200 teams". No sign-up wall.
3. Taps **Build Team** → **Suggest a team**. Gets a valid lineup of the most-picked players.
4. Swaps one player for a favourite; the budget bar shows $20k over; sees a cheaper player on the same team with a value arrow; swaps.
5. Taps the star on their favourite: "Your captain scores 1.5x".
6. **Review → Confirm** prompts a quick sign-up (Google, Discord, Steam OpenID or email). The entry is saved and joins the friend's league automatically via the invite link.
7. Push notification Saturday: "Your team is live: 2 players playing now." Checks the live view and sees +34 from their captain, with a breakdown.
8. Two players eliminated before the playoffs; they don't open the app. **Autopilot replaces them.** The final notification says: "Finished top 18% · your friend finished top 3%. Rematch at the next event?"

**What makes this work:** no account wall, a suggested lineup, Autopilot, and friend context throughout.

### B. Serious CS2 fantasy player (Full Run)

1. Opens Events and filters to CS2. Enters **Full Run** at Stage 1.
2. Sorts by value (points per $10k); filters to Stage 1 teams; reads each candidate's per-map history and opponent record.
3. Builds a contrarian lineup with two cheap Stage 1 favourites; captain on the player with the best opponent record.
4. At each window: replaces eliminated players for free, uses both discretionary transfers to bring in Stage 2 entrants, reviews ownership (now visible) to differentiate.
5. Checks per-map breakdowns after every match; reports one assist count that doesn't match the official match page (dispute flow).
6. Finishes top 0.8%; the career page shows season rating moving from rank 1,400 to 610.

**What makes this work:** value sorting, ownership after lock, real transfer decisions, transparent breakdowns, and a career ladder.

### C. Returning user, next event

1. Gets "IEM Katowice fantasy is open: your league 'Friday Night CS' is in" a week before lock.
2. Home shows the action card; taps **Build Team**; the builder offers "Start from your last team" (same players where still eligible, at new prices).
3. Adjusts two players, confirms. The entry appears in the global board and in both their leagues with no extra steps.
4. Profile shows last event's result and their season rank, which is the reason to try to improve.

### D. Creator hosting a league

1. Creates a league "Streamer Cup" → public → custom link /l/streamer.
2. Pins the link in chat and Discord; 2,300 viewers join in the first stream. Each joiner either already had an entry (it appears instantly) or builds one.
3. During streams, opens the public board to show the top 10 and compare their roster with chat's leaders.
4. After the event, gets a share image of the top 3 and posts it. The league persists; the same link works for the next event.
5. Phase 2: branded page, end-of-event stats, a member export for giveaways (with sponsor rules).

### E. User whose players are eliminated midway

1. After Stage 2 of the Full Run, three of their five players are eliminated. Home's action card says: "3 players eliminated: replace them free before Stage 3 locks in 18h."
2. The window screen lists the eliminated players with "Replace" and suggests replacements that fit the budget and team limit.
3. They replace the three for free, use one of their two transfers on an upgrade, and re-pick their captain.
4. If they had ignored it, Autopilot would have replaced the three with the most-picked affordable players and moved the captaincy.
5. Their stage leaderboard rank gives them something to play for even though they've fallen in the overall table.
