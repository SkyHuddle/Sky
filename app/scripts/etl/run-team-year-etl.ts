#!/usr/bin/env npx tsx
/**
 * Team-year KDA for every roster slot: Gol team roster table first, season page fallback.
 */
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
const DELAY_MS = Number(process.env.GOL_ETL_DELAY_MS ?? 550);

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
  const playersById = new Map(loadAppPlayers().map((p) => [p.id, p]));
  const teams = loadAppTeams();

  const bundle: TeamYearRatingsBundle = {
    source: 'gol.gg-team-year',
    generatedAt: new Date().toISOString(),
    entryCount: 0,
    entries: {},
  };

  const seasonCache = new Map<
    string,
    { kda: number; winRate: number; games: number }
  >();

  async function seasonStats(golPlayerId: number, season: string) {
    const key = `${golPlayerId}:${season}`;
    if (seasonCache.has(key)) return seasonCache.get(key)!;
    const html = await fetchHtml(GOL_PLAYER_SEASON_URL(golPlayerId, season));
    const parsed = parseGolPlayerHtml(golPlayerId, html);
    const stats = {
      kda: parsed?.kda ?? 2.5,
      winRate: parsed?.winRate ?? 50,
      games: parsed?.games ?? 0,
    };
    seasonCache.set(key, stats);
    await sleep(DELAY_MS);
    return stats;
  }

  for (const team of teams) {
    const golTeamId = teamMap.ids[team.id];
    if (!golTeamId) {
      console.warn(`skip team ${team.id} (no gol team id)`);
      continue;
    }

    const season = yearToGolSeason(team.year);

    try {
      console.log(`Team ${team.name} ${team.year} (${team.id})`);
      const html = await fetchHtml(GOL_TEAM_STATS_URL(golTeamId));
      const rows = parseGolTeamRoster(html);
      const rowByGol = new Map(rows.map((r) => [r.golPlayerId, r]));

      for (const playerId of Object.values(team.roster)) {
        const player = playersById.get(playerId);
        const golPlayerId = playerMap.ids[playerId];
        if (!player || !golPlayerId) {
          console.warn(`  missing player/gol id: ${playerId}`);
          continue;
        }

        const teamRow = rowByGol.get(golPlayerId);
        const hasTeamKda = teamRow != null && teamRow.kda > 0;
        const source = hasTeamKda ? 'team-roster' : 'season';
        const extra = await seasonStats(golPlayerId, season);
        const kda = hasTeamKda ? teamRow!.kda : extra.kda;

        const stats: GolTeamYearStats = {
          kda,
          killParticipation: teamRow?.killParticipation ?? 60,
          damagePct: teamRow?.damagePct ?? 20,
          goldPct: teamRow?.goldPct ?? 20,
          winRate: extra.winRate,
          games: extra.games,
        };

        const ratings = computeRatingsFromTeamYear(stats, player.role);
        bundle.entries[entryKey(team.id, playerId)] = {
          teamId: team.id,
          playerId,
          golTeamId,
          golPlayerId,
          season,
          source,
          stats,
          ratings,
        };
        console.log(`  ${player.name}: OVR ${ratings.overall} · ${kda.toFixed(1)} KDA (${source})`);
      }
    } catch (e) {
      console.warn(`  error:`, e);
    }

    await sleep(DELAY_MS);
  }

  bundle.entryCount = Object.keys(bundle.entries).length;
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(bundle, null, 2));
  console.log(`Wrote ${bundle.entryCount} entries → ${OUT_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
