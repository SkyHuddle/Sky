#!/usr/bin/env npx tsx
/**
 * Fetches Gol.gg career stats and writes app/src/data/generated/gol-ratings.json
 * Run: npm run etl:gol
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAppPlayers } from './load-app-players';
import { parseGolPlayerHtml, GOL_PLAYER_STATS_URL } from './parse-gol-html';
import { computeRatingsFromGol } from './compute-ratings';
import type { GolIdMap, GolRatingsBundle } from './types';

const __dir = dirname(fileURLToPath(import.meta.url));
const IDS_PATH = join(__dir, 'gol-ids.json');
const OUT_DIR = join(__dir, '../../src/data/generated');
const OUT_FILE = join(OUT_DIR, 'gol-ratings.json');
const UA = 'GoldenRoad-ETL/1.0 (+https://github.com/SkyHuddle/Sky)';
const DELAY_MS = Number(process.env.GOL_ETL_DELAY_MS ?? 700);

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPlayerHtml(golId: number): Promise<string> {
  const res = await fetch(GOL_PLAYER_STATS_URL(golId), {
    headers: { 'User-Agent': UA },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for gol ${golId}`);
  return res.text();
}

async function main() {
  if (!existsSync(IDS_PATH)) {
    console.error('Missing gol-ids.json — run: npm run etl:gol:resolve');
    process.exit(1);
  }

  const idMap: GolIdMap = JSON.parse(readFileSync(IDS_PATH, 'utf8'));
  const players = loadAppPlayers();
  const limit = process.env.GOL_ETL_LIMIT
    ? parseInt(process.env.GOL_ETL_LIMIT, 10)
    : players.length;

  const bundle: GolRatingsBundle = {
    source: 'gol.gg',
    generatedAt: new Date().toISOString(),
    playerCount: 0,
    entries: {},
  };

  let fetched = 0;
  for (const p of players.slice(0, limit)) {
    const golId = idMap.ids[p.id];
    if (!golId) {
      console.warn(`skip ${p.id} (no gol id)`);
      continue;
    }

    try {
      console.log(`[${fetched + 1}] ${p.name} (${p.id}) → gol ${golId}`);
      const html = await fetchPlayerHtml(golId);
      const stats = parseGolPlayerHtml(golId, html);
      if (!stats) {
        console.warn(`  parse failed`);
        continue;
      }
      const ratings = computeRatingsFromGol(stats, p.role);
      bundle.entries[p.id] = {
        playerId: p.id,
        golId,
        ratings,
        stats: {
          winRate: stats.winRate,
          kda: stats.kda,
          games: stats.games,
          goldPerMin: stats.goldPerMin,
          killParticipation: stats.killParticipation,
          damagePerMin: stats.damagePerMin,
        },
      };
      fetched++;
    } catch (e) {
      console.warn(`  error:`, e);
    }

    await sleep(DELAY_MS);
  }

  bundle.playerCount = Object.keys(bundle.entries).length;
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(bundle, null, 2));
  console.log(`Wrote ${bundle.playerCount} ratings → ${OUT_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
