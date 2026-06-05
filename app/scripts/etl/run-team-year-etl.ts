#!/usr/bin/env npx tsx
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAppTeams } from './load-app-teams';
import { loadAppPlayers } from './load-app-players';
import { parseGolTeamRoster, GOL_TEAM_STATS_URL } from './parse-gol-team-html';
import { parseGolPlayerHtml, GOL_PLAYER_SEASON_URL } from './parse-gol-html';
import { computeRatingsFromTeamYear } from './compute-ratings';
import { yearToGolSeason } from './gol-season';
import type { GolIdMap, GolTeamYearStats, TeamYearRatingsBundle } from './types';

const __dir = dirname(fileURLToPath(import.meta.url));
const TEAM_IDS_PATH = join(__dir, 'gol-teams.json');
const PLAYER_IDS_PATH = join(__dir, 'gol-ids.json');
const OUT_DIR = join(__dir, '../../src/data/generated');
const OUT_FILE = join(OUT_DIR, 'team-year-ratings.json');
const UA = 'GoldenRoad-ETL/1.0';
const DELAY_MS = Number(process.env.GOL_ETL_DELAY_MS ?? 650);

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function entryKey(teamId: string, playerId: string) {
  return `${teamId}:${playerId}`;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

async function main() {
  if (!existsSync(TEAM_IDS_PATH) || !existsSync(PLAYER_IDS_PATH)) {
    console.error('Run: npm run etl:gol:resolve && npm run etl:gol:teams:resolve');
    process.exit(1);
  }

  const teamMap = JSON.parse(readFileSync(TEAM_IDS_PATH, 'utf8')) as {
    ids: Record<string, number>;
  };
  const playerMap = JSON.parse(readFileSync(PLAYER_IDS_PATH, 'utf8')) as GolIdMap;
  const golToPlayer = new Map<number, string>();
  for (const [playerId, golId] of Object.entries(playerMap.ids)) {
    golToPlayer.set(golId, playerId);
  }

  const playersById = new Map(loadAppPlayers().map((p) => [p.id, p]));
  const teams = loadAppTeams();

  const bundle: TeamYearRatingsBundle = {
    source: 'gol.gg-team-year',
    generatedAt: new Date().toISOString(),
    entryCount: 0,
    entries: {},
  };

  const seasonStatsCache = new Map<string, { winRate: number; games: number }>();

  for (const team of teams) {
    const golTeamId = teamMap.ids[team.id];
    if (!golTeamId) {
      console.warn(`skip team ${team.id} (no gol team id)`);
      continue;
    }

    const season = yearToGolSeason(team.year);
    const rosterGolIds = new Set(
      Object.values(team.roster)
        .map((pid) => playerMap.ids[pid])
        .filter((id): id is number => id != null)
    );

    try {
      console.log(`Team ${team.name} ${team.year} (${team.id}) → gol ${golTeamId}`);
      const html = await fetchHtml(GOL_TEAM_STATS_URL(golTeamId));
      const rows = parseGolTeamRoster(html);

      for (const row of rows) {
        if (!rosterGolIds.has(row.golPlayerId)) continue;
        const playerId = golToPlayer.get(row.golPlayerId);
        if (!playerId) continue;
        const player = playersById.get(playerId);
        if (!player) continue;

        const cacheKey = `${row.golPlayerId}:${season}`;
        let seasonExtra = seasonStatsCache.get(cacheKey);
        if (!seasonExtra) {
          const pHtml = await fetchHtml(
            GOL_PLAYER_SEASON_URL(row.golPlayerId, season)
          );
          const parsed = parseGolPlayerHtml(row.golPlayerId, pHtml);
          seasonExtra = {
            winRate: parsed?.winRate ?? 50,
            games: parsed?.games ?? 0,
          };
          seasonStatsCache.set(cacheKey, seasonExtra);
          await sleep(DELAY_MS);
        }

        const stats: GolTeamYearStats = {
          kda: row.kda,
          killParticipation: row.killParticipation,
          damagePct: row.damagePct,
          goldPct: row.goldPct,
          winRate: seasonExtra.winRate,
          games: seasonExtra.games,
        };

        bundle.entries[entryKey(team.id, playerId)] = {
          teamId: team.id,
          playerId,
          golTeamId,
          golPlayerId: row.golPlayerId,
          season,
          stats,
          ratings: computeRatingsFromTeamYear(stats, player.role),
        };
      }
    } catch (e) {
      console.warn(`  error:`, e);
    }

    await sleep(DELAY_MS);
  }

  bundle.entryCount = Object.keys(bundle.entries).length;
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(bundle, null, 2));
  console.log(`Wrote ${bundle.entryCount} team-year ratings → ${OUT_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
