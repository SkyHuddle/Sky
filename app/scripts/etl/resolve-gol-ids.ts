#!/usr/bin/env npx tsx
/**
 * Resolves app player ids → Gol.gg numeric ids by scraping the player search index.
 * Run: npm run etl:gol:resolve
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAppPlayers } from './load-app-players';
import type { GolIdMap } from './types';
import aliases from './gol-aliases.json' with { type: 'json' };

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, 'gol-ids.json');
const UA = 'GoldenRoad-ETL/1.0 (+https://github.com/SkyHuddle/Sky)';

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

interface GolSearchEntry {
  id: number;
  label: string;
  norm: string;
}

async function fetchGolSearchIndex(): Promise<GolSearchEntry[]> {
  const url =
    'https://gol.gg/players/list/season-ALL/split-ALL/tournament-ALL/';
  console.log('Fetching Gol player index…');
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Gol list HTTP ${res.status}`);
  const html = await res.text();
  const entries: GolSearchEntry[] = [];
  const re = /\{class:'player',value: 'p_(\d+)',name: '([^']+)'\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const label = m[2];
    const base = label.split(' - ')[0].trim();
    entries.push({
      id: parseInt(m[1], 10),
      label,
      norm: normalizeName(base),
    });
  }
  console.log(`Indexed ${entries.length} Gol players`);
  return entries;
}

function findGolId(
  playerName: string,
  playerId: string,
  index: GolSearchEntry[]
): number | null {
  const aliasName =
    (aliases as Record<string, string>)[playerId] ?? playerName;
  const targets = new Set([
    normalizeName(playerName),
    normalizeName(aliasName),
  ]);

  const exact = index.filter((e) => targets.has(e.norm));
  if (exact.length === 1) return exact[0].id;
  if (exact.length > 1) {
    const preferKr = exact.find((e) => e.label.includes(' - KR'));
    return (preferKr ?? exact[0]).id;
  }

  const partial = index.filter(
    (e) =>
      [...targets].some((t) => e.norm.startsWith(t) || t.startsWith(e.norm)) &&
      Math.abs(e.norm.length - [...targets][0].length) <= 2
  );
  if (partial.length === 1) return partial[0].id;
  return null;
}

async function main() {
  const players = loadAppPlayers();
  const index = await fetchGolSearchIndex();

  const existing: GolIdMap = existsSync(OUT)
    ? JSON.parse(readFileSync(OUT, 'utf8'))
    : { updatedAt: '', ids: {}, unresolved: [] };

  const ids: Record<string, number> = { ...existing.ids };
  const unresolved: string[] = [];

  for (const p of players) {
    if (ids[p.id]) continue;
    const golId = findGolId(p.name, p.id, index);
    if (golId != null) ids[p.id] = golId;
    else unresolved.push(p.id);
  }

  const map: GolIdMap = {
    updatedAt: new Date().toISOString(),
    ids,
    unresolved,
  };

  writeFileSync(OUT, JSON.stringify(map, null, 2));
  console.log(
    `Mapped ${Object.keys(ids).length}/${players.length} players → ${OUT}`
  );
  if (unresolved.length) {
    console.log(`Unresolved (${unresolved.length}):`, unresolved.join(', '));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
