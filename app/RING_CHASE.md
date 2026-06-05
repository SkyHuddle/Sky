# Ring Chase

Call of Duty esports roster game — draft 4 legends from historical teams and chase the ring.

## Play

```bash
cd app && npm install && npm run dev
```

Open **http://localhost:3000/ring-chase**

## Modes

- **Ring Chase** — unlimited random team drafts
- **Daily Ring Chase** — same 4 iconic teams + constraint for everyone
- **Perfect Season** — win all 4 Majors + Champs (extremely rare)

## Architecture

```
ring-chase/
  core/           types, constants
  data/           seeded players + historical teams (V1)
  engine/         draft, ratings, chemistry, simulation
  features/       daily constraints (30+), localStorage stats
  services/
    breakingpoint/  API client (swap endpoints here only)
    data/           sync orchestrator (API → cache → seed fallback)
    database/       Postgres schema types for future backend
  components/     mobile-first game UI
  hooks/          useRingChaseGame phase machine
```

Gameplay reads from the **seeded database**, not live BreakingPoint calls.

## Data pipeline (future)

1. `breakingpointClient` fetches stats on cron
2. Normalized into Postgres tables (`services/database/schema.ts`)
3. Rating service computes hidden axes
4. Draft pool + simulation run from cache

Set `VITE_BREAKINGPOINT_API_URL` and `VITE_BREAKINGPOINT_API_KEY` when API access is available.

## V1 content

- **70+ players** — Scump, Simp, Shotzzy, HyDra, Clayster, etc.
- **30 iconic teams** — OpTic 2017, FaZe 2021, Empire 2020, NYSL 2023, etc.
