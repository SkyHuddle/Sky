# Ring Chase

Call of Duty esports roster game — draft 4 legends from historical teams and chase the ring.

## Play

```bash
cd app && npm install && npm run dev
```

- Portfolio: **http://localhost:3000/**
- Game: **http://localhost:3000/ring-chase**

## BreakingPoint data source

BreakingPoint.gg does **not** use `api.breakingpoint.gg`. Their site and mobile app read from **Supabase PostgREST**:

| Setting | Value |
|---------|--------|
| Project | `dfpiiufxcciujugzjvgx.supabase.co` |
| API | `https://dfpiiufxcciujugzjvgx.supabase.co/rest/v1` |
| Auth | Public `anon` JWT (embedded in their frontend bundle) |

### Verified tables (read access)

- `players` — 753+ pros (tag, headshot, position, team)
- `teams`, `seasons`, `events`, `matches`
- `player_stats` — per-map K/D, BP Rating, mode splits
- `player_team_history`, `team_event_view`
- `titles`, `modes`, `maps`, `positions`

Gameplay uses **seeded historical data** + optional ETL cache. No live API calls during runs.

### Sync ETL

```bash
npm run etl:breakingpoint
# BP_SEASON_ID=2025 npm run etl:breakingpoint
```

Writes to `src/ring-chase/data/generated/bp-sync-meta.json`.

Override via env:

- `VITE_BP_SUPABASE_URL`
- `VITE_BP_SUPABASE_ANON_KEY`

## Architecture

```
ring-chase/
  services/breakingpoint/   Supabase REST client (only place that knows BP schema)
  services/data/sync.ts     Aggregate stats → ratings pipeline
  data/generated/           ETL output (gitignored optional)
  engine/                   draft, chemistry, simulation
  components/               mobile-first UI
```
