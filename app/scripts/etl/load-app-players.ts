import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AppPlayerRef } from './types';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '../..');

function parsePlayersFromSource(file: string): AppPlayerRef[] {
  const text = readFileSync(join(ROOT, 'src/data/players', file), 'utf8');
  const players: AppPlayerRef[] = [];
  const re = /p\('([^']+)',\s*'([^']+)',\s*'([^']+)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    players.push({
      id: m[1],
      name: m[2],
      role: m[3] as AppPlayerRef['role'],
    });
  }
  return players;
}

export function loadAppPlayers(): AppPlayerRef[] {
  const core = parsePlayersFromSource('lol.ts');
  const legends = parsePlayersFromSource('lol-legends.ts');
  const regional = parsePlayersFromSource('lol-regional.ts');
  const byId = new Map<string, AppPlayerRef>();
  for (const p of [...core, ...legends, ...regional]) byId.set(p.id, p);
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}
