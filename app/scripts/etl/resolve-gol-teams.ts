#!/usr/bin/env npx tsx
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAppTeams } from './load-app-teams';
import { yearToGolSeason } from './gol-season';
import teamAliases from './gol-team-aliases.json' with { type: 'json' };

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, 'gol-teams.json');
const UA = 'GoldenRoad-ETL/1.0';

interface GolTeamSearchEntry {
  id: number;
  label: string;
  season: string;
  norm: string;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function fetchTeamIndex(season: string): Promise<GolTeamSearchEntry[]> {
  const url = `https://gol.gg/teams/list/season-${season}/split-ALL/tournament-ALL/`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Gol teams ${season}: HTTP ${res.status}`);
  const html = await res.text();
  const entries: GolTeamSearchEntry[] = [];
  const re = /\{class:'team',value: 't_(\d+)',name: '([^']+)'\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const label = m[2];
    const seasonMatch = label.match(/ - (S\d+)\s*$/i);
    const seasonTag = seasonMatch?.[1]?.toUpperCase() ?? season;
    const base = label.replace(/ - S\d+\s*$/i, '').trim();
    entries.push({
      id: parseInt(m[1], 10),
      label,
      season: seasonTag,
      norm: normalize(base),
    });
  }
  return entries;
}

function findGolTeamId(
  teamId: string,
  teamName: string,
  year: number,
  index: GolTeamSearchEntry[]
): number | null {
  const season = yearToGolSeason(year);
  const aliases = (teamAliases as Record<string, string[]>)[teamId] ?? [teamName];
  const targets = new Set(aliases.map(normalize));

  const pool = index.filter((e) => e.season === season);
  const exact = pool.filter((e) => [...targets].some((t) => e.norm === t || e.norm.includes(t) || t.includes(e.norm)));
  if (exact.length === 1) return exact[0].id;
  if (exact.length > 1) {
    const best = exact.sort((a, b) => {
      const aScore = [...targets].some((t) => a.norm === t) ? 1 : 0;
      const bScore = [...targets].some((t) => b.norm === t) ? 1 : 0;
      return bScore - aScore;
    })[0];
    return best.id;
  }

  const partial = pool.filter((e) =>
    [...targets].some((t) => e.norm.startsWith(t.slice(0, 4)) || t.startsWith(e.norm.slice(0, 4)))
  );
  if (partial.length === 1) return partial[0].id;
  return null;
}

async function main() {
  const teams = loadAppTeams();
  const seasons = [...new Set(teams.map((t) => yearToGolSeason(t.year)))];
  const index: GolTeamSearchEntry[] = [];
  for (const s of seasons) {
    console.log(`Indexing Gol teams ${s}…`);
    index.push(...(await fetchTeamIndex(s)));
  }

  const existing = existsSync(OUT)
    ? JSON.parse(readFileSync(OUT, 'utf8'))
    : { ids: {} as Record<string, number>, unresolved: [] as string[] };

  const ids: Record<string, number> = { ...existing.ids };
  const unresolved: string[] = [];

  for (const t of teams) {
    if (ids[t.id]) continue;
    const golId = findGolTeamId(t.id, t.name, t.year, index);
    if (golId != null) ids[t.id] = golId;
    else unresolved.push(t.id);
  }

  const out = {
    updatedAt: new Date().toISOString(),
    ids,
    unresolved,
  };
  writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`Mapped ${Object.keys(ids).length}/${teams.length} teams → ${OUT}`);
  if (unresolved.length) console.log('Unresolved:', unresolved.join(', '));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
