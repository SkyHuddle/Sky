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

## Next engineering step

```
scripts/etl/
  fetch-leaguepedia.ts   # rosters + tournament placements
  fetch-oee-csv.ts       # optional stat columns
  merge-ratings.ts       # write app/src/data/players/generated/
```

Until ETL exists, tuning `player-power.ts` + thresholds is how difficulty stays fair.
