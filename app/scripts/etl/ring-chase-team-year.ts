/**
 * BreakingPoint team-year ETL for Ring Chase.
 * Aggregates player_stats per roster slot → team-year-ratings.json
 * Run: npm run etl:ring-chase-team-year
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COD_TEAMS } from '../../src/ring-chase/data/teams';
import { getPlayerById } from '../../src/ring-chase/data/players';
import { rosterPlayerIds } from '../../src/ring-chase/data/roster-slots';
import { accomplishmentFromTeam } from '../../src/ring-chase/data/accomplishment';
import { ESTIMATED_SLOT_OVERRIDES } from '../../src/ring-chase/data/estimated-slot-overrides';
import { pickBestHeadshot, buildEraHeadshotCandidates } from '../../src/ring-chase/data/headshot-resolve';
import {
  resolveSlotRatings,
  type TeamYearBpStats,
  type ModeSlice,
} from '../../src/ring-chase/engine/team-year-ovr';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../../src/ring-chase/data/generated');
const PLAYERS_INDEX = join(OUT_DIR, 'bp-players-index.json');
const OUT_FILE = join(OUT_DIR, 'team-year-ratings.json');

const BP_REST = process.env.VITE_BP_SUPABASE_URL
  ? `${process.env.VITE_BP_SUPABASE_URL}/rest/v1`
  : 'https://dfpiiufxcciujugzjvgx.supabase.co/rest/v1';
const BP_KEY =
  process.env.VITE_BP_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmcGlpdWZ4Y2NpdWp1Z3pqdmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2ODk0MDMsImV4cCI6MjA2MDI2NTQwM30.36VuOTvrxtmR3nb-u3nnVYWzMBn9YP1bQFvUYF5T1OE';

/** Calendar year on the card → BreakingPoint season_id */
const CALENDAR_TO_BP_SEASON: Record<number, number> = {
  2013: 2013,
  2014: 2014,
  2015: 2015,
  2016: 2016,
  2017: 2018,
  2018: 2019,
  2019: 2019,
  2020: 2020,
  2021: 2021,
  2022: 2022,
  2023: 2023,
  2024: 2024,
};

const BP_TAG_OVERRIDES: Record<string, string> = {
  zooma: 'ZooMaa',
  tjhaly: 'TJHaLy',
  morph: 'MBoZe',
  xposed: 'XMystery',
};

const MODE_NAMES: Record<number, 'hardpoint' | 'snd' | 'control'> = {
  1: 'hardpoint',
  2: 'snd',
  3: 'control',
};

type BpPlayerRow = { id: number; tag: string; headshot: string | null };
type StatRow = {
  player_id: number;
  player_tag: string;
  season_id: number;
  mode_id: number | null;
  kills: number;
  deaths: number;
  damage: number;
  bp_rating: number;
  gametime_min: number;
};

export interface TeamYearRatingsEntry {
  teamId: string;
  playerId: string;
  seasonId: number;
  calendarYear: number;
  bpPlayerId?: number;
  bpTag?: string;
  headshot?: string | null;
  source: 'bp-stats' | 'estimated' | 'curated-audit';
  accomplishment: TeamYearAccomplishment;
  stats: TeamYearBpStats;
  overall: number;
}

export interface TeamYearRatingsBundle {
  source: string;
  generatedAt: string;
  entryCount: number;
  entries: Record<string, TeamYearRatingsEntry>;
}

async function bpFetch<T>(table: string, params: Record<string, string>): Promise<T[]> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BP_REST}/${table}?${qs}`, {
    headers: {
      apikey: BP_KEY,
      Authorization: `Bearer ${BP_KEY}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`${table} ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T[]>;
}

function entryKey(teamId: string, playerId: string) {
  return `${teamId}:${playerId}`;
}

function bpTagFor(playerId: string, gamertag: string): string {
  return BP_TAG_OVERRIDES[playerId] ?? gamertag;
}

function findBpPlayer(tag: string, index: BpPlayerRow[]): BpPlayerRow | undefined {
  const exact = index.find((p) => p.tag === tag);
  if (exact) return exact;
  const lower = tag.toLowerCase();
  return index.find((p) => p.tag.toLowerCase() === lower);
}

function aggregateStats(rows: StatRow[]): TeamYearBpStats | null {
  if (rows.length === 0) return null;

  let kills = 0;
  let deaths = 0;
  let ratingWeight = 0;
  let ratingSum = 0;
  const modeBuckets: Record<
    string,
    { kills: number; deaths: number; ratingSum: number; ratingMaps: number; maps: number }
  > = {};

  for (const row of rows) {
    const k = Number(row.kills) || 0;
    const d = Number(row.deaths) || 0;
    const r = Number(row.bp_rating) || 0;
    const weight = Math.max(1, k + d);

    kills += k;
    deaths += d;
    if (r > 0) {
      ratingSum += r * weight;
      ratingWeight += weight;
    }

    const modeKey = row.mode_id != null ? MODE_NAMES[row.mode_id] : undefined;
    if (modeKey) {
      if (!modeBuckets[modeKey]) {
        modeBuckets[modeKey] = { kills: 0, deaths: 0, ratingSum: 0, ratingMaps: 0, maps: 0 };
      }
      const bucket = modeBuckets[modeKey];
      bucket.kills += k;
      bucket.deaths += d;
      bucket.maps += 1;
      if (r > 0) {
        bucket.ratingSum += r;
        bucket.ratingMaps += 1;
      }
    }
  }

  const kd = deaths > 0 ? kills / deaths : kills > 0 ? kills : 1;
  const bpRating = ratingWeight > 0 ? ratingSum / ratingWeight : kd;

  const stats: TeamYearBpStats = {
    kd: Math.round(kd * 1000) / 1000,
    bpRating: Math.round(bpRating * 1000) / 1000,
    maps: rows.length,
    kills,
    deaths,
  };

  for (const [mode, bucket] of Object.entries(modeBuckets)) {
    const modeKd = bucket.deaths > 0 ? bucket.kills / bucket.deaths : bucket.kills || 1;
    const slice: ModeSlice = {
      kd: Math.round(modeKd * 1000) / 1000,
      bpRating:
        Math.round(
          (bucket.ratingMaps > 0 ? bucket.ratingSum / bucket.ratingMaps : modeKd) * 1000
        ) / 1000,
      maps: bucket.maps,
    };
    if (mode === 'hardpoint') stats.hardpoint = slice;
    if (mode === 'snd') stats.snd = slice;
    if (mode === 'control') stats.control = slice;
  }

  return stats;
}

async function fetchSeasonStats(seasonId: number): Promise<StatRow[]> {
  const rows: StatRow[] = [];
  for (let offset = 0; offset < 50000; offset += 1000) {
    const batch = await bpFetch<StatRow>('player_stats', {
      select: 'player_id,player_tag,season_id,mode_id,kills,deaths,damage,bp_rating,gametime_min',
      season_id: `eq.${seasonId}`,
      limit: '1000',
      offset: String(offset),
    });
    rows.push(...batch);
    if (batch.length < 1000) break;
  }
  return rows;
}

async function main() {
  console.log('Ring Chase team-year ETL (BreakingPoint)...');

  let existingEntries: Record<string, TeamYearRatingsEntry> = {};
  try {
    const prior = JSON.parse(readFileSync(OUT_FILE, 'utf8')) as TeamYearRatingsBundle;
    existingEntries = prior.entries ?? {};
  } catch {
    /* first run */
  }

  const playerIndex = JSON.parse(readFileSync(PLAYERS_INDEX, 'utf8')) as BpPlayerRow[];
  const seasonIds = [...new Set(Object.values(CALENDAR_TO_BP_SEASON))].sort((a, b) => a - b);

  const statsBySeasonPlayer = new Map<number, Map<number, StatRow[]>>();
  for (const seasonId of seasonIds) {
    console.log(`Fetching season ${seasonId}...`);
    const rows = await fetchSeasonStats(seasonId);
    const byPlayer = new Map<number, StatRow[]>();
    for (const row of rows) {
      const list = byPlayer.get(row.player_id) ?? [];
      list.push(row);
      byPlayer.set(row.player_id, list);
    }
    statsBySeasonPlayer.set(seasonId, byPlayer);
    console.log(`  ${rows.length} stat rows, ${byPlayer.size} players`);
  }

  const bundle: TeamYearRatingsBundle = {
    source: 'breakingpoint-team-year',
    generatedAt: new Date().toISOString(),
    entryCount: 0,
    entries: {},
  };

  let bpHits = 0;
  let estimated = 0;
  let audited = 0;

  for (const team of COD_TEAMS) {
    const seasonId = CALENDAR_TO_BP_SEASON[team.season];
    const seasonStats = seasonId != null ? statsBySeasonPlayer.get(seasonId) : undefined;
    const accomplishment = accomplishmentFromTeam(team);

    for (const playerId of rosterPlayerIds(team.roster)) {
      const player = getPlayerById(playerId);
      if (!player) {
        console.warn(`  missing player ${playerId} on ${team.id}`);
        continue;
      }

      const tag = bpTagFor(playerId, player.gamertag);
      const bpPlayer = findBpPlayer(tag, playerIndex);
      const playerRows = bpPlayer && seasonStats ? seasonStats.get(bpPlayer.id) : undefined;
      const agg = playerRows ? aggregateStats(playerRows) : null;

      const slotKey = entryKey(team.id, playerId);
      const override = ESTIMATED_SLOT_OVERRIDES[slotKey];

      const resolved = resolveSlotRatings({
        player,
        team,
        accomplishment,
        bpAgg: override ? null : agg,
        override,
      });
      const { source, stats, overall } = resolved;

      if (source === 'bp-stats') bpHits += 1;
      else if (source === 'curated-audit') audited += 1;
      else estimated += 1;

      bundle.entries[entryKey(team.id, playerId)] = {
        teamId: team.id,
        playerId,
        seasonId: seasonId ?? team.season,
        calendarYear: team.season,
        bpPlayerId: bpPlayer?.id,
        bpTag: bpPlayer?.tag ?? tag,
        headshot: pickBestHeadshot(team.season, [
          existingEntries[slotKey]?.headshot,
          ...buildEraHeadshotCandidates(player, team, bpPlayer?.tag ?? tag),
          bpPlayer?.headshot ?? null,
        ]),
        source,
        accomplishment,
        stats,
        overall,
      };

      const mark = source === 'bp-stats' ? '✓' : source === 'curated-audit' ? '◆' : '~';
      console.log(
        `  ${mark} ${team.id} · ${player.gamertag}: OVR ${overall} · ${stats.kd.toFixed(2)} K/D · ${stats.maps} maps`
      );
    }
  }

  bundle.entryCount = Object.keys(bundle.entries).length;
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(bundle, null, 2));
  console.log(
    `\nWrote ${bundle.entryCount} entries (${bpHits} BP, ${audited} audited, ${estimated} estimated) → ${OUT_FILE}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
