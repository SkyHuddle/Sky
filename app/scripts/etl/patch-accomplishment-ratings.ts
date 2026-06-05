#!/usr/bin/env npx tsx
/** Re-score team-year JSON with accomplishment floors (no network). */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAppTeams } from './load-app-teams';
import { loadAppPlayers } from './load-app-players';
import { accomplishmentFromTagline } from '../../src/data/teams/accomplishment';
import { computeRatingsFromTeamYear } from './compute-ratings';
import type { TeamYearRatingsBundle } from './types';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '../../src/data/generated/team-year-ratings.json');

const bundle = JSON.parse(readFileSync(OUT, 'utf8')) as TeamYearRatingsBundle;
const teams = new Map(loadAppTeams().map((t) => [t.id, t]));
const players = new Map(loadAppPlayers().map((p) => [p.id, p]));

for (const entry of Object.values(bundle.entries)) {
  const team = teams.get(entry.teamId);
  const player = players.get(entry.playerId);
  if (!team || !player) continue;
  const accomplishment = accomplishmentFromTagline(team.tagline);
  entry.accomplishment = accomplishment;
  entry.ratings = computeRatingsFromTeamYear(entry.stats, player.role, accomplishment);
}

bundle.generatedAt = new Date().toISOString();
writeFileSync(OUT, JSON.stringify(bundle, null, 2));
console.log(`Patched ${Object.keys(bundle.entries).length} entries with accomplishment scoring`);
