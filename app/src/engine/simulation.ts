import type {
  SimulationResult,
  StageId,
  StageOutcome,
  WorldsFailureDetail,
  DraftPick,
} from '@/core/types';
import { STAGES } from '@/core/types';
import {
  STAGE_PASS_MIDPOINTS,
  STAGE_PASS_STEEPNESS,
  STAGE_PASS_MIN,
  STAGE_PASS_MAX,
  MIN_GOLDEN_ROAD_CHANCE,
  WORLDS_FAILURE_LABELS,
} from '@/core/constants';
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

function clampPassChance(chance: number): number {
  return Math.min(STAGE_PASS_MAX, Math.max(STAGE_PASS_MIN, chance));
}

/** Pass probability for one stage from roster stage power (logistic curve) */
export function stagePassProbability(power: number, stage: StageId): number {
  const mid = STAGE_PASS_MIDPOINTS[stage];
  const steepness = STAGE_PASS_STEEPNESS[stage];
  const logistic = 1 / (1 + Math.exp(-steepness * (power - mid)));
  return clampPassChance(logistic);
}

function stagePowerJitter(
  power: number,
  stage: StageId,
  avgClutch: number,
  rng: () => number
): number {
  const spread = stage === 'worlds' ? 2 + avgClutch / 30 : 1.5;
  return power + (rng() - 0.5) * spread;
}

function worldsFailureDetail(passChance: number, rng: () => number): WorldsFailureDetail {
  if (passChance < 0.15 || rng() < 0.35) return 'groups';
  if (passChance < 0.3 || rng() < 0.5) return 'quarterfinals';
  if (passChance < 0.45 || rng() < 0.65) return 'semifinals';
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

export function goldenRoadProbability(picks: DraftPick[]): number {
  const players = playersForSimulation(picks);
  let odds = 1;
  for (const stage of STAGES) {
    const power = stageTeamPower(players, stage);
    odds *= stagePassProbability(power, stage);
  }
  return Math.max(odds, MIN_GOLDEN_ROAD_CHANCE);
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
    const effectivePower = stagePowerJitter(stagePower, stage, avgClutch, rng);
    const passChance = stagePassProbability(effectivePower, stage);
    const passed = rng() < passChance;

    let detail: WorldsFailureDetail | undefined;
    if (!passed && stage === 'worlds') {
      detail = worldsFailureDetail(passChance, rng);
    }

    const base = {
      stage,
      passed,
      detail,
      roll: Math.round(effectivePower * 10) / 10,
      threshold: Math.round(passChance * 1000) / 10,
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

const oddsCache = new Map<string, number>();

function rosterOddsKey(picks: DraftPick[]): string {
  return picks
    .map((p) => `${p.player.id}@${p.team.id}`)
    .sort()
    .join('|');
}

/** Golden Road win chance from per-stage pass probabilities */
export function estimateGoldenRoadOdds(picks: DraftPick[]): number {
  if (picks.length === 0) return 0;

  const key = rosterOddsKey(picks);
  const cached = oddsCache.get(key);
  if (cached != null) return cached;

  const rate = goldenRoadProbability(picks);
  oddsCache.set(key, rate);
  return rate;
}
