# Data sources roadmap

## Gol.gg

**No official public API.** Gol.gg is HTML-first; the community typically uses:

- Python scrapers (BeautifulSoup / Selenium) — see [GamesOfLegends-Scrapper](https://github.com/PaburoTC/GamesOfLegends-Scrapper)
- Manual CSV exports where available

**Pros:** Rich pro stats (KDA, gold%, damage share, champion pools) per tournament.

**Cons:**

- Scraping breaks when the site layout changes
- Terms of service / rate limits
- Cannot run heavy scraping from the browser app — needs a **backend job** that refreshes a JSON cache

**Recommended approach for Golden Road:**

1. Offline ETL script (Node or Python) scrapes Gol.gg player/tournament pages periodically
2. Normalize into `data/players/*.json` + `data/teams/*.json`
3. App loads static bundles (same pattern as today, but numbers from Gol)

## Better alternatives to evaluate

| Source | Access | Best for |
|--------|--------|----------|
| [Leaguepedia Cargo API](https://lol.fandom.com/Help:CargoQuery) | Free, documented | Rosters, match results, placements by tournament |
| [Oracle's Elixir](https://oracleselixir.com/) | CSV downloads | Bulk pro stats, meta analysis |
| LoL Esports API (unofficial) | Unstable | Live schedules / some match metadata |
| GRID / Bayes | Paid | Commercial-grade esports feeds |

Leaguepedia + Oracle's Elixir is usually the best **legal, maintainable** combo for a side project.

## What we use today

- Hand-curated peak ratings informed by history (titles, peak years)
- **Card-effective ratings** scale by team tier + year (`engine/player-power.ts`)
- Tournament **run beats** (Groups → QF → SF → Final) are narrative steps driven by sim outcome, not replaying real 2023 brackets

## Gol ETL (implemented)

Offline pipeline under `app/scripts/etl/`:

```bash
cd app
npm run etl:gol:resolve   # map app player id → Gol.gg numeric id
npm run etl:gol           # scrape career stats, write gol-ratings.json
```

Output: `app/src/data/generated/gol-ratings.json` — merged at load time in `src/data/merge-gol-ratings.ts`. The home screen shows a badge when Gol data is present.

**Note:** Riot’s Match API is solo queue only; it does not replace Gol for pro careers.

## Future

- Leaguepedia Cargo fallback for players missing on Gol
- Oracle’s Elixir CSV for damage/gold columns
