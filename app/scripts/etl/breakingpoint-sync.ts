/**
 * BreakingPoint.gg ETL — sync Supabase PostgREST → local JSON cache.
 * Run: npm run etl:breakingpoint
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../../src/ring-chase/data/generated');

// Inline client for Node (avoids Vite import.meta in script context)
const BP_REST = process.env.VITE_BP_SUPABASE_URL
  ? `${process.env.VITE_BP_SUPABASE_URL}/rest/v1`
  : 'https://dfpiiufxcciujugzjvgx.supabase.co/rest/v1';
const BP_KEY =
  process.env.VITE_BP_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmcGlpdWZ4Y2NpdWp1Z3pqdmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2ODk0MDMsImV4cCI6MjA2MDI2NTQwM30.36VuOTvrxtmR3nb-u3nnVYWzMBn9YP1bQFvUYF5T1OE';

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

const LEGEND_TAGS = [
  'Scump', 'Crimsix', 'Karma', 'FormaL', 'Clayster', 'Simp', 'aBeZy', 'Cellium',
  'Arcitys', 'Shotzzy', 'Dashy', 'HyDra', 'Pred', 'Envoy', 'Octane', 'Skyz',
  'Kismet', 'CleanX', 'Huke', 'Attach', 'Slasher', 'Kenny', 'Priestahh',
];

async function main() {
  const seasonId = Number(process.env.BP_SEASON_ID ?? 2026);
  console.log(`Syncing BreakingPoint Supabase (season ${seasonId})...`);

  const ping = await fetch(`${BP_REST}/players?select=id&limit=1`, {
    headers: { apikey: BP_KEY, Authorization: `Bearer ${BP_KEY}`, Prefer: 'count=exact' },
  });
  const total = ping.headers.get('content-range')?.split('/')[1];
  console.log(`API reachable — ${total ?? '?'} players in DB`);

  const players = await bpFetch<Record<string, unknown>>('players', {
    select: 'id,tag,first_name,last_name,headshot,current_team_id,position_id,nickname,retired',
    limit: '1000',
  });

  const teams = await bpFetch<Record<string, unknown>>('teams', {
    select: 'id,name,name_medium,name_short,logo_main',
    limit: '500',
  });

  const statRows: Record<string, unknown>[] = [];
  for (let offset = 0; offset < 20000; offset += 1000) {
    const batch = await bpFetch<Record<string, unknown>>('player_stats', {
      select: 'player_id,player_tag,season_id,kills,deaths,damage,bp_rating,mode_id,gametime_min,gametime_sec',
      season_id: `eq.${seasonId}`,
      limit: '1000',
      offset: String(offset),
    });
    statRows.push(...batch);
    if (batch.length < 1000) break;
  }

  const legendSnapshots = [];
  for (const tag of LEGEND_TAGS) {
    const row = players.find((p) => p.tag === tag);
    if (row) legendSnapshots.push(row);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const payload = {
    syncedAt: new Date().toISOString(),
    source: 'breakingpoint-supabase',
    seasonId,
    playerCount: players.length,
    teamCount: teams.length,
    statRowCount: statRows.length,
    legends: legendSnapshots,
    teams: teams.filter((t) => String(t.name).includes('OpTic') || String(t.name).includes('FaZe') || String(t.name).includes('Thieves')).slice(0, 20),
  };

  writeFileSync(join(OUT_DIR, 'bp-sync-meta.json'), JSON.stringify(payload, null, 2));
  writeFileSync(join(OUT_DIR, 'bp-players-index.json'), JSON.stringify(players, null, 2));
  console.log(`Wrote ${statRows.length} stat rows, ${players.length} players → ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
