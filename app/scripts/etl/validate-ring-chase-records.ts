/**
 * Verifies every regular-season record 0-20 … 20-0 is reachable via simulation.
 * Run: npm run validate:ring-chase-records
 */
import { generateDraftRounds } from '../../src/ring-chase/engine/draft.ts';
import { simulateRingChase } from '../../src/ring-chase/engine/simulation.ts';
import { computeRegularSeasonWins, formatRegularSeasonRecord, REGULAR_SEASON_GAMES } from '../../src/ring-chase/engine/season-summary.ts';
import { SLOT_ORDER } from '../../src/ring-chase/core/constants.ts';
import { cardOverall } from '../../src/ring-chase/engine/card-context.ts';
import { getTeamById } from '../../src/ring-chase/data/teams.ts';
import { resolveTeamRoster } from '../../src/ring-chase/data/index.ts';

function picksFromSeed(seed: string, worst: boolean) {
  const rounds = generateDraftRounds(seed);
  const used = new Set<string>();
  return rounds.map((r, ri) => {
    const avail = r.roster.filter((p) => !used.has(p.id));
    const sorted = [...avail].sort((a, b) =>
      worst ? cardOverall(a, r.team) - cardOverall(b, r.team) : cardOverall(b, r.team) - cardOverall(a, r.team)
    );
    const player = sorted[0]!;
    used.add(player.id);
    return { player, team: r.team, role: SLOT_ORDER[ri]! };
  });
}

const allRecords = new Set<string>();
const winCounts = new Set<number>();

const SIMS = 25_000;
for (let i = 0; i < SIMS; i++) {
  const worst = i % 3 === 0;
  const picks = picksFromSeed(`rec-${i}`, worst);
  const res = simulateRingChase(picks, { seed: `sim-${i}` });
  const wins = computeRegularSeasonWins(picks, res);
  winCounts.add(wins);
  allRecords.add(formatRegularSeasonRecord(wins));
}

// Force-check extremes
const dynasty = ['optic-2017', 'faze-2021', 'empire-2020', 'envy-2016'].map((id, ri) => {
  const team = getTeamById(id)!;
  const roster = resolveTeamRoster(team).sort((a, b) => cardOverall(b, team) - cardOverall(a, team));
  return { player: roster[ri]!, team, role: SLOT_ORDER[ri]! };
});
const trap = ['legion-2023', 'paris-2021', 'guerrillas-2020', 'miami-2024'].map((id, ri) => {
  const team = getTeamById(id)!;
  const roster = resolveTeamRoster(team).sort((a, b) => cardOverall(a, team) - cardOverall(b, team));
  return { player: roster[0]!, team, role: SLOT_ORDER[ri]! };
});

for (let i = 0; i < 500; i++) {
  const d = simulateRingChase(dynasty, { seed: `dyn-${i}` });
  winCounts.add(computeRegularSeasonWins(dynasty, d));
  allRecords.add(d.seasonSummary.record);
  const t = simulateRingChase(trap, { seed: `trap-${i}` });
  winCounts.add(computeRegularSeasonWins(trap, t));
  allRecords.add(t.seasonSummary.record);
}

const expected = Array.from({ length: REGULAR_SEASON_GAMES + 1 }, (_, w) => `${w}-${REGULAR_SEASON_GAMES - w}`);
const missing = expected.filter((r) => !allRecords.has(r));
const missingWins = Array.from({ length: REGULAR_SEASON_GAMES + 1 }, (_, i) => i).filter((w) => !winCounts.has(w));

console.log('Ring Chase record coverage\n');
console.log(`Simulations: ${SIMS + 1000}`);
console.log(`Distinct records: ${allRecords.size} / ${expected.length}`);
console.log(`Distinct win totals: ${winCounts.size} / ${REGULAR_SEASON_GAMES + 1}`);

if (missing.length > 0) {
  console.error('\nMissing records:', missing.join(', '));
  process.exit(1);
}

if (missingWins.length > 0) {
  console.error('\nMissing win totals:', missingWins.join(', '));
  process.exit(1);
}

console.log('\nAll 21 records reachable (0-20 through 20-0).');
process.exit(0);
