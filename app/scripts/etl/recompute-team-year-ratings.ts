/**
 * Recompute OVR from bundled stats + overrides (no network).
 * Run after formula changes: npm run recompute:ring-chase-ratings
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COD_TEAMS } from '../../src/ring-chase/data/teams';
import { getPlayerById } from '../../src/ring-chase/data/players';
import { rosterPlayerIds } from '../../src/ring-chase/data/roster-slots';
import { accomplishmentFromTeam } from '../../src/ring-chase/data/accomplishment';
import { ESTIMATED_SLOT_OVERRIDES } from '../../src/ring-chase/data/estimated-slot-overrides';
import type { TeamYearRatingsEntry } from '../../src/ring-chase/data/team-year-ratings';
import { resolveSlotRatings } from '../../src/ring-chase/engine/team-year-ovr';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RATINGS_PATH = join(__dirname, '../../src/ring-chase/data/generated/team-year-ratings.json');

type Bundle = {
  source: string;
  generatedAt: string;
  entryCount: number;
  entries: Record<string, TeamYearRatingsEntry>;
};

function main() {
  const bundle = JSON.parse(readFileSync(RATINGS_PATH, 'utf8')) as Bundle;
  let changed = 0;

  for (const team of COD_TEAMS) {
    const accomplishment = accomplishmentFromTeam(team);
    for (const playerId of rosterPlayerIds(team.roster)) {
      const key = `${team.id}:${playerId}`;
      const entry = bundle.entries[key];
      const player = getPlayerById(playerId);
      if (!entry || !player) continue;

      const override = ESTIMATED_SLOT_OVERRIDES[key];
      const bpAgg =
        entry.stats.maps >= 1
          ? {
              ...entry.stats,
              kd: entry.stats.kd,
              bpRating: entry.stats.bpRating,
              maps: entry.stats.maps,
              kills: entry.stats.kills,
              deaths: entry.stats.deaths,
            }
          : null;

      const resolved = resolveSlotRatings({
        player,
        team,
        accomplishment,
        bpAgg: override ? null : bpAgg,
        override,
      });

      if (entry.overall !== resolved.overall || entry.source !== resolved.source) {
        changed += 1;
      }

      bundle.entries[key] = {
        ...entry,
        source: resolved.source,
        stats: resolved.stats,
        overall: resolved.overall,
        accomplishment,
      };
    }
  }

  bundle.generatedAt = new Date().toISOString();
  bundle.entryCount = Object.keys(bundle.entries).length;
  writeFileSync(RATINGS_PATH, JSON.stringify(bundle, null, 2));
  console.log(`Recomputed ${bundle.entryCount} entries (${changed} changed) → ${RATINGS_PATH}`);
}

main();
