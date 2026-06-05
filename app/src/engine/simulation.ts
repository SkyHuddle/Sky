import type {
  SimulationResult,
  StageId,
  StageOutcome,
  WorldsFailureDetail,
  DraftPick,
} from '@/core/types';
import { STAGE_THRESHOLDS, WORLDS_FAILURE_LABELS } from '@/core/constants';
import { computeRosterScore, countTitles, stageTeamPower } from './ratings';
import { playersForSimulation } from './player-power';
import { enrichStageWithRun } from './tournament-run';
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
  const spread = 13 - clutch / 12;
  return (rng() - 0.5) * spread;
}

function worldsFailureDetail(
  power: number,
  threshold: number,
  rng: () => number
): WorldsFailureDetail {
  const gap = threshold - power;
  if (gap > 10 || rng() < 0.35) return 'groups';
  if (gap > 6 || rng() < 0.5) return 'quarterfinals';
  if (gap > 3 || rng() < 0.65) return 'semifinals';
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

export function simulateGoldenRoad(
  picks: DraftPick[],
  options?: { seed?: string }
): SimulationResult {
  const simPlayers = playersForSimulation(picks);
  const seed = options?.seed
    ? hashString(options.seed)
    : (Date.now() ^ (Math.random() * 1e9)) >>> 0;
  const rng = mulberry32(seed);

  const rosterScore = computeRosterScore(simPlayers);
  const titleCounts = countTitles(simPlayers);
  const avgClutch =
    simPlayers.reduce((s, p) => s + p.ratings.clutch, 0) / simPlayers.length;
  const stages: StageOutcome[] = [];
  const stageOrder: StageId[] = ['spring', 'msi', 'summer', 'worlds'];
  let failed = false;
  let failureStage: StageId | null = null;
  let failureMessageText = '';

  for (const stage of stageOrder) {
    const stagePower = stageTeamPower(simPlayers, stage);
    const threshold = STAGE_THRESHOLDS[stage] + rng() * 4 - 2;
    const variance = rollVariance(rng, avgClutch);
    const roll = stagePower + variance;
    const passed = roll >= threshold;

    let detail: WorldsFailureDetail | undefined;
    if (!passed && stage === 'worlds') {
      detail = worldsFailureDetail(stagePower, threshold, rng);
    }

    const base = {
      stage,
      passed,
      detail,
      roll: Math.round(roll * 10) / 10,
      threshold: Math.round(threshold * 10) / 10,
    };
    stages.push(enrichStageWithRun(base, rng));

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

/** Rough win chance estimate for UI/debug — not shown by default */
export function estimateGoldenRoadOdds(picks: DraftPick[]): number {
  const players = playersForSimulation(picks);
  const avg = players.reduce((s, p) => s + p.ratings.overall, 0) / 5;
  if (avg >= 88) return 0.12;
  if (avg >= 84) return 0.06;
  if (avg >= 80) return 0.025;
  if (avg >= 76) return 0.01;
  return 0.003;
}
