import type { SimulationResult, StageId, StageOutcome, WorldsFailureDetail, DraftPick } from '@/core/types';
import { STAGE_THRESHOLDS, WORLDS_FAILURE_LABELS, OFF_ROLE_PENALTY } from '@/core/constants';
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
  const spread = 16 - clutch / 10;
  return (rng() - 0.5) * spread;
}

function worldsFailureDetail(
  power: number,
  threshold: number,
  rng: () => number
): WorldsFailureDetail {
  const gap = threshold - power;
  if (gap > 14 || rng() < 0.4) return 'groups';
  if (gap > 8 || rng() < 0.55) return 'quarterfinals';
  if (gap > 4 || rng() < 0.7) return 'semifinals';
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

function offRolePenalty(picks: DraftPick[]): number {
  return picks.reduce((sum, p) => {
    return sum + (p.role !== p.naturalRole ? OFF_ROLE_PENALTY : 0);
  }, 0);
}

function weakTeamPenalty(picks: DraftPick[]): number {
  return picks.reduce((sum, p) => {
    if (p.team.tier === 'weak') return sum + 3;
    if (p.team.tier === 'average') return sum + 1.2;
    return sum;
  }, 0);
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

  const rosterScore = Math.max(
    0,
    computeRosterScore(players) - offRolePenalty(picks) * 0.35 - weakTeamPenalty(picks) * 0.25
  );
  const titleCounts = countTitles(players);
  const avgClutch =
    players.reduce((s, p) => s + p.ratings.clutch, 0) / players.length;

  const penalty = offRolePenalty(picks) + weakTeamPenalty(picks);

  const stages: StageOutcome[] = [];
  const stageOrder: StageId[] = ['spring', 'msi', 'summer', 'worlds'];
  let failed = false;
  let failureStage: StageId | null = null;
  let failureMessageText = '';

  for (const stage of stageOrder) {
    const power = stageTeamPower(players, stage) - penalty;
    const threshold = STAGE_THRESHOLDS[stage] + rng() * 5 - 1;
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

  return {
    stages,
    goldenRoad,
    failureStage: goldenRoad ? null : failureStage,
    failureMessage: goldenRoad ? 'Golden Road Achieved' : failureMessageText,
    rosterScore: Math.round(rosterScore * 10) / 10,
    titleCounts,
  };
}
