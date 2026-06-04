import type { Player, SimulationResult, StageId, StageOutcome, WorldsFailureDetail } from '@/core/types';
import { STAGE_THRESHOLDS, WORLDS_FAILURE_LABELS } from '@/core/constants';
import { computeRosterScore, countTitles, stageTeamPower } from './ratings';

/** Seeded RNG for reproducible daily runs */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rollVariance(rng: () => number, clutch: number): number {
  const spread = 14 - clutch / 12;
  return (rng() - 0.5) * spread;
}

function worldsFailureDetail(
  power: number,
  threshold: number,
  rng: () => number
): WorldsFailureDetail {
  const gap = threshold - power;
  if (gap > 12 || rng() < 0.35) return 'groups';
  if (gap > 7 || rng() < 0.5) return 'quarterfinals';
  if (gap > 3 || rng() < 0.65) return 'semifinals';
  return 'finals';
}

function failureMessage(
  stage: StageId,
  detail?: WorldsFailureDetail
): string {
  if (stage === 'worlds' && detail) {
    return WORLDS_FAILURE_LABELS[detail];
  }
  const labels: Record<StageId, string> = {
    spring: 'Failed at Spring Split',
    msi: 'Failed at MSI',
    summer: 'Failed at Summer Split',
    worlds: 'Failed at Worlds',
  };
  return labels[stage];
}

export function simulateGoldenRoad(
  players: Player[],
  options?: { seed?: string }
): SimulationResult {
  const seed = options?.seed
    ? hashString(options.seed)
    : (Date.now() ^ (Math.random() * 1e9)) >>> 0;
  const rng = mulberry32(seed);

  const rosterScore = computeRosterScore(players);
  const titleCounts = countTitles(players);
  const avgClutch =
    players.reduce((s, p) => s + p.ratings.clutch, 0) / players.length;

  const stages: StageOutcome[] = [];
  const stageOrder: StageId[] = ['spring', 'msi', 'summer', 'worlds'];
  let failed = false;
  let failureStage: StageId | null = null;
  let failureMessageText = '';
  for (const stage of stageOrder) {
    const power = stageTeamPower(players, stage);
    const threshold = STAGE_THRESHOLDS[stage] + rng() * 4 - 2;
    const variance = rollVariance(rng, avgClutch);
    const roll = power + variance;
    const passed = roll >= threshold;

    let detail: WorldsFailureDetail | undefined;
    if (!passed && stage === 'worlds') {
      detail = worldsFailureDetail(power, threshold, rng);
    }

    stages.push({
      stage,
      passed,
      detail,
      roll: Math.round(roll * 10) / 10,
      threshold: Math.round(threshold * 10) / 10,
    });

    if (!passed && !failed) {
      failed = true;
      failureStage = stage;
      failureMessageText = failureMessage(stage, detail);
    }
  }

  const goldenRoad = stages.every((s) => s.passed);

  if (goldenRoad) {
    failureMessageText = 'Golden Road Achieved';
  }

  return {
    stages,
    goldenRoad,
    failureStage: goldenRoad ? null : failureStage,
    failureMessage: goldenRoad ? 'Golden Road Achieved' : failureMessageText,
    rosterScore,
    titleCounts,
  };
}
