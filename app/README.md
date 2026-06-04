# Golden Road

A viral roster-building game for League of Legends esports. Draft five pro players and attempt to win Spring Split, MSI, Summer Split, and Worlds in one run — the **Golden Road**.

## Play locally

```bash
cd app
npm install
npm run dev
```

Open http://localhost:3000

## Game modes

- **Free Play** — Random draft pools each run, no restrictions
- **Daily Golden Road** — Same constraint for everyone each day, with local percentile tracking

## Architecture

```
src/
  core/          # Types & constants (esport-agnostic)
  data/          # Player databases per title (lol.ts today)
  engine/        # Draft pools, ratings, simulation
  features/      # Daily challenges, localStorage stats
  components/game/
  hooks/
```

Designed to add `valorant`, `cs2`, and `dota2` player registries without rewriting the game loop.

## Build

```bash
npm run build
npm run preview
```
