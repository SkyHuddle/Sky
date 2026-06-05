/**
 * Validates Ring Chase team-year ratings vs curated team accomplishments.
 * Run: npm run validate:ring-chase-data
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COD_TEAMS } from '../../src/ring-chase/data/teams';
import { getPlayerById } from '../../src/ring-chase/data/players';
import { rosterPlayerIds } from '../../src/ring-chase/data/roster-slots';
import {
  accomplishmentFromTeam,
  getCardCredentials,
} from '../../src/ring-chase/data/accomplishment';
import type { TeamYearRatingsEntry } from '../../src/ring-chase/data/team-year-ratings';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RATINGS_PATH = join(__dirname, '../../src/ring-chase/data/generated/team-year-ratings.json');

type Bundle = {
  entryCount: number;
  entries: Record<string, TeamYearRatingsEntry>;
};

function expectedAccomplishment(teamId: string) {
  const team = COD_TEAMS.find((t) => t.id === teamId);
  if (!team) return null;
  return accomplishmentFromTeam(team);
}

function main() {
  const bundle = JSON.parse(readFileSync(RATINGS_PATH, 'utf8')) as Bundle;
  let errors = 0;
  let warnings = 0;
  let bpBacked = 0;
  let estimated = 0;
  let missing = 0;

  console.log('Ring Chase data validation\n');

  for (const team of COD_TEAMS) {
    const creds = getCardCredentials(team);
    const expected = accomplishmentFromTeam(team);

    for (const playerId of rosterPlayerIds(team.roster)) {
      const key = `${team.id}:${playerId}`;
      const entry = bundle.entries[key];
      const player = getPlayerById(playerId);

      if (!player) {
        console.error(`✗ Missing player ${playerId} on ${team.id}`);
        errors += 1;
        continue;
      }

      if (!entry) {
        console.warn(`⚠ No team-year entry: ${team.teamName} ${team.season} · ${player.gamertag}`);
        missing += 1;
        warnings += 1;
        continue;
      }

      if (entry.source === 'bp-stats') bpBacked += 1;
      else estimated += 1;

      if (entry.accomplishment !== expected) {
        console.error(
          `✗ Accomplishment mismatch ${key}: entry=${entry.accomplishment} team=${expected} (${team.placement})`
        );
        errors += 1;
      }

      if (entry.calendarYear !== team.season) {
        console.error(`✗ Year mismatch ${key}: ${entry.calendarYear} vs ${team.season}`);
        errors += 1;
      }

      if (entry.overall < 72 || entry.overall > 99) {
        console.warn(`⚠ OVR out of range ${key}: ${entry.overall}`);
        warnings += 1;
      }

      if (entry.source === 'estimated' && entry.stats.maps > 0) {
        console.warn(`⚠ Marked estimated but has maps: ${key}`);
        warnings += 1;
      }
    }

    const ringBadge = creds.ringsThisYear > 0;
    if (ringBadge !== team.isChampsWinner) {
      console.error(
        `✗ Ring badge mismatch ${team.id}: creds=${ringBadge} team=${team.isChampsWinner}`
      );
      errors += 1;
    }

    if (creds.majorsThisYear !== team.majorWins) {
      console.error(
        `✗ Major count mismatch ${team.id}: creds=${creds.majorsThisYear} team=${team.majorWins}`
      );
      errors += 1;
    }
  }

  const expectedSlots = COD_TEAMS.reduce((n, t) => n + rosterPlayerIds(t.roster).length, 0);

  console.log('\n--- Summary ---');
  console.log(`Teams: ${COD_TEAMS.length}`);
  console.log(`Roster slots: ${expectedSlots}`);
  console.log(`Bundle entries: ${bundle.entryCount}`);
  console.log(`BP-backed: ${bpBacked} · Estimated: ${estimated} · Missing: ${missing}`);
  console.log(`Errors: ${errors} · Warnings: ${warnings}`);

  if (errors > 0) {
    process.exit(1);
  }
}

main();
