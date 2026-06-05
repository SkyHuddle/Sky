import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '../..');

export interface AppTeamRef {
  id: string;
  name: string;
  year: number;
  region: string;
  roster: Record<string, string>;
}

function parseTeamsFromFile(file: string): AppTeamRef[] {
  const text = readFileSync(join(ROOT, 'src/data/teams', file), 'utf8');
  const teams: AppTeamRef[] = [];
  const blockRe =
    /\{\s*id:\s*'([^']+)',\s*esport:\s*'lol',\s*name:\s*'([^']+)',\s*year:\s*(\d+),\s*region:\s*'([^']+)'[\s\S]*?roster:\s*R\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(text))) {
    const rosterArgs = m[5].split(',').map((s) => s.trim().replace(/'/g, ''));
    const roles = ['top', 'jungle', 'mid', 'adc', 'support'];
    const roster: Record<string, string> = {};
    roles.forEach((role, i) => {
      if (rosterArgs[i]) roster[role] = rosterArgs[i];
    });
    teams.push({
      id: m[1],
      name: m[2],
      year: parseInt(m[3], 10),
      region: m[4],
      roster,
    });
  }
  return teams;
}

export function loadAppTeams(): AppTeamRef[] {
  const legend = parseTeamsFromFile('lol.ts');
  const weak = parseTeamsFromFile('lol-weak.ts');
  const byId = new Map<string, AppTeamRef>();
  for (const t of [...legend, ...weak]) byId.set(t.id, t);
  return [...byId.values()].sort((a, b) => a.year - b.year || a.name.localeCompare(b.name));
}
