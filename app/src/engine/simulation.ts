import type {
  SimulationResult,
  StageId,
  StageOutcome,
  WorldsFailureDetail,
  DraftPick,
} from '@/core/types';
import { STAGE_THRESHOLDS, WORLDS_FAILURE_LABELS } from '@/core/constants';
import { computeRosterScore, countTitles, stageTeamPower } from './ratings';
import { hashString } from './draft';

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rollVariance(rng: () => number, clutch: number): number {
  const spread = 11 - clutch / 14;
  return (rng() - 0.5) * spread;
}

function worldsFailureDetail(
  power: number,
  threshold: number,
  rng: () => number
): WorldsFailureDetail {
  const gap = threshold - power;
  if (gap > 10 || rng() < 0.32) return 'groups';
  if (gap > 6 || rng() < 0.48) return 'quarterfinals';
  if (gap > 3 || rng() < 0.62) return 'semifinals';
  return 'finals';
}

function failureMessage(stage: StageId, detail?: WorldsFailureDetail): string {
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

/** Softer penalty for drafting from underdog team cards */
function draftContextPenalty(picks: DraftPick[]): number {
  return picks.reduce((sum, p) => {
    if (p.team.tier === 'weak') return sum + 1.8;
    if (p.team.tier === 'average') return sum + 0.6;
    return sum;
  }, 0);
}

/** Small bonus when average OVR is elite */
function rosterQualityBonus(players: { ratings: { overall: number } }[]): number {
  const avg = players.reduce((s, p) => s + p.ratings.overall, 0) / players.length;
  if (avg >= 92) return 2.5;
  if (avg >= 89) return 1.2;
  if (avg >= 86) return 0.4;
  return 0;
}

export function simulateGoldenRoad(
  picks: DraftPick[],
  options?: { seed?: string }
): SimulationResult {
  const players = picks.map((p) => p.player);
  const seed = options?.seed
    ? hashString(options.seed)
    : (Date.now() ^ (Math.random() * 1e9)) >>> 0;
  const rng = mulberry32(seed);

  const penalty = draftContextPenalty(picks);
  const bonus = rosterQualityBonus(players);
  const rosterScore = Math.max(
    0,
    computeRosterScore(players) - penalty * 0.2 + bonus
  );
  const titleCounts = countTitles(players);
  const avgClutch =
    players.reduce((s, p) => s + p.ratings.clutch, 0) / players.length;

  const powerBase =
    players.reduce((s, p) => s + p.ratings.overall, 0) / players.length -
    penalty +
    bonus;

  const stages: StageOutcome[] = [];
  const stageOrder: StageId[] = ['spring', 'msi', 'summer', 'worlds'];
  let failed = false;
  let failureStage: StageId | null = null;
  let failureMessageText = '';

  for (const stage of stageOrder) {
    const stagePower = stageTeamPower(players, stage);
    const blended = stagePower * 0.55 + powerBase * 0.45 - penalty * 0.5;
    const threshold = STAGE_THRESHOLDS[stage] + rng() * 3 - 1.5;
    const variance = rollVariance(rng, avgClutch);
    const roll = blended + variance;
    const passed = roll >= threshold;

    let detail: WorldsFailureDetail | undefined;
    if (!passed && stage === 'worlds') {
      detail = worldsFailureDetail(blended, threshold, rng);
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

  return {
    stages,
    goldenRoad,
    failureStage: goldenRoad ? null : failureStage,
    failureMessage: goldenRoad ? 'Golden Road Achieved' : failureMessageText,
    rosterScore: Math.round(rosterScore * 10) / 10,
    titleCounts,
  };
}
