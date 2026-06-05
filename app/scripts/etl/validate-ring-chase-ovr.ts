/**
 * Audits team-year OVR vs accomplishments and stat lines.
 * Run: npm run validate:ring-chase-ovr
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COD_TEAMS } from '../../src/ring-chase/data/teams';
import { getPlayerById } from '../../src/ring-chase/data/players';
import { rosterPlayerIds } from '../../src/ring-chase/data/roster-slots';
import { accomplishmentFromTeam } from '../../src/ring-chase/data/accomplishment';
import { ESTIMATED_SLOT_OVERRIDES } from '../../src/ring-chase/data/estimated-slot-overrides';
import type { TeamYearRatingsEntry } from '../../src/ring-chase/data/team-year-ratings';
import {
  overallFromStats,
  statLineOverall,
  curatedOverall,
  MIN_BP_MAPS_FULL,
} from '../../src/ring-chase/engine/team-year-ovr';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RATINGS_PATH = join(__dirname, '../../src/ring-chase/data/generated/team-year-ratings.json');

type Bundle = { entries: Record<string, TeamYearRatingsEntry> };

function main() {
  const bundle = JSON.parse(readFileSync(RATINGS_PATH, 'utf8')) as Bundle;
  let errors = 0;
  let warnings = 0;

  console.log('Ring Chase OVR / stat audit\n');

  for (const team of COD_TEAMS) {
    const accomplishment = accomplishmentFromTeam(team);
    const slots: Array<{ key: string; entry: TeamYearRatingsEntry; playerId: string }> = [];

    for (const playerId of rosterPlayerIds(team.roster)) {
      const key = `${team.id}:${playerId}`;
      const entry = bundle.entries[key];
      const player = getPlayerById(playerId);
      if (!entry || !player) continue;
      slots.push({ key, entry, playerId });

      const override = ESTIMATED_SLOT_OVERRIDES[key];
      const expected = overallFromStats(
        entry.stats,
        player,
        team,
        accomplishment,
        override?.overall
      );

      if (Math.abs(entry.overall - expected) > 0) {
        console.error(
          `✗ OVR drift ${key} (${player.gamertag}): stored=${entry.overall} expected=${expected} · ${entry.stats.kd.toFixed(2)} K/D · ${entry.stats.maps} maps`
        );
        errors += 1;
      }

      const statLine = statLineOverall(entry.stats, team);
      const curated = curatedOverall(player, team, accomplishment);

      if (entry.stats.maps >= MIN_BP_MAPS_FULL && entry.overall > statLine + 8) {
        console.warn(
          `⚠ OVR well above stat line ${key}: OVR ${entry.overall} vs stat ${statLine} (${entry.stats.kd.toFixed(2)} K/D)`
        );
        warnings += 1;
      }

      if (entry.stats.maps > 0 && entry.stats.maps < 30 && entry.overall >= 92) {
        console.warn(
          `⚠ Thin sample high OVR ${key}: ${entry.overall} OVR on ${entry.stats.maps} maps`
        );
        warnings += 1;
      }

      if (team.tier === 'underdog' && entry.overall > team.teamRating + 4) {
        console.warn(
          `⚠ Trap team OVR high ${key}: ${entry.overall} on teamRating ${team.teamRating}`
        );
        warnings += 1;
      }

      if (entry.stats.kd < 0.92 && entry.overall > curated + 2) {
        console.warn(
          `⚠ Weak K/D inflated ${key}: ${entry.stats.kd.toFixed(2)} K/D → ${entry.overall} OVR (curated ${curated})`
        );
        warnings += 1;
      }
    }

    // Within-roster: top K/D shouldn't be last in OVR by a wide margin
    const ranked = slots
      .map((s) => {
        const player = getPlayerById(s.playerId)!;
        return {
          tag: player.gamertag,
          kd: s.entry.stats.kd,
          ovr: s.entry.overall,
        };
      })
      .filter((s) => s.kd > 0);

    if (ranked.length >= 3) {
      const byKd = [...ranked].sort((a, b) => b.kd - a.kd);
      const byOvr = [...ranked].sort((a, b) => b.ovr - a.ovr);
      const bestKd = byKd[0]!;
      const worstOvrAmongTopKd = byKd
        .slice(0, 2)
        .reduce((min, p) => Math.min(min, p.ovr), 99);
      const bestOvr = byOvr[0]!;
      if (bestKd.kd >= 1.12 && bestOvr.ovr - worstOvrAmongTopKd > 12) {
        console.warn(
          `⚠ Roster OVR spread odd ${team.id} ${team.season}: best K/D ${bestKd.tag} (${bestKd.kd.toFixed(2)}) not near top OVR`
        );
        warnings += 1;
      }
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Errors: ${errors} · Warnings: ${warnings}`);

  if (errors > 0) process.exit(1);
}

main();
