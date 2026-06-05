/**
 * Sanity-checks season records against roster talent tiers.
 * Run: npm run validate:ring-chase-season
 */
import { getTeamById } from '../../src/ring-chase/data/teams.ts';
import { resolveTeamRoster } from '../../src/ring-chase/data/index.ts';
import { SLOT_ORDER } from '../../src/ring-chase/core/constants.ts';
import { cardOverall } from '../../src/ring-chase/engine/card-context.ts';
import { simulateRingChase } from '../../src/ring-chase/engine/simulation.ts';
import { computeRegularSeasonWins } from '../../src/ring-chase/engine/season-summary.ts';
import type { DraftPick, RosterSlot } from '../../src/ring-chase/core/types.ts';

function pick(teamId: string, tag: string, roleIdx: number): DraftPick {
  const team = getTeamById(teamId)!;
  const player = resolveTeamRoster(team).find((p) => p.gamertag.toLowerCase() === tag.toLowerCase())!;
  return { player, team, role: SLOT_ORDER[roleIdx]! };
}

function avgOvr(picks: DraftPick[]): number {
  return picks.reduce((sum, p) => sum + cardOverall(p.player, p.team), 0) / picks.length;
}

function winsFor(picks: DraftPick[], seed: string, filter: (r: ReturnType<typeof simulateRingChase>) => boolean) {
  const wins: number[] = [];
  for (let i = 0; i < 500; i++) {
    const result = simulateRingChase(picks, { seed: `${seed}-${i}` });
    if (!filter(result)) continue;
    wins.push(computeRegularSeasonWins(picks, result));
  }
  return wins;
}

const eliteThreeMajors = [
  pick('ultra-2021', 'Insight', 0),
  pick('optic-2017', 'Scump', 1),
  pick('envy-2016', 'FormaL', 2),
  pick('lg-2018', 'Octane', 3),
];

const midOneMajor = [
  pick('mutineers-2020', 'Methodz', 0),
  pick('faze-2023', 'Cellium', 1),
  pick('lg-2016', 'TJHaLy', 2),
  pick('lat-2022', 'Octane', 3),
];

const trapRoster = ['legion-2023', 'paris-2021', 'guerrillas-2020', 'miami-2024'].map((id, ri) => {
  const team = getTeamById(id)!;
  const roster = resolveTeamRoster(team).sort(
    (a, b) => cardOverall(a, team) - cardOverall(b, team)
  );
  return { player: roster[0]!, team, role: SLOT_ORDER[ri]! as RosterSlot };
});

console.log('Ring Chase season calibration\n');

let failed = 0;

const eliteWins = winsFor(
  eliteThreeMajors,
  'elite-3m',
  (r) => r.majorWins === 3 && r.champsOutcome === 'missed'
);
const eliteMin = Math.min(...eliteWins);
const eliteMax = Math.max(...eliteWins);
console.log(
  `Elite 3-major (avg ${avgOvr(eliteThreeMajors).toFixed(1)} OVR): min ${eliteMin}, max ${eliteMax} wins (${eliteWins.length} samples)`
);
if (eliteMin < 18) {
  console.error('  FAIL: 96+ OVR with 3 majors should not finish below 18 wins');
  failed += 1;
}

const midWins = winsFor(midOneMajor, 'mid-1m', (r) => r.majorWins === 1 && r.champsOutcome === 'missed');
const midMin = Math.min(...midWins);
const midMax = Math.max(...midWins);
console.log(
  `Mid 1-major (avg ${avgOvr(midOneMajor).toFixed(1)} OVR): min ${midMin}, max ${midMax} wins (${midWins.length} samples)`
);
if (midMin < 10 || midMax > 16) {
  console.error('  FAIL: 91 OVR / 1 major should land roughly 11–15 wins');
  failed += 1;
}

const trapWins = winsFor(trapRoster, 'trap', () => true);
const trapMax = Math.max(...trapWins);
console.log(
  `Trap stack (avg ${avgOvr(trapRoster).toFixed(1)} OVR): max ${trapMax} wins (${trapWins.length} samples)`
);
if (trapMax > 10) {
  console.error('  FAIL: trap roster should not exceed ~10 regular-season wins');
  failed += 1;
}

if (failed > 0) {
  process.exit(1);
}

console.log('\nSeason calibration checks passed.');
process.exit(0);
