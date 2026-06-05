import type {
  ChampsOutcome,
  DraftPick,
  MajorOutcome,
  SimulationResult,
  StageId,
  StageOutcome,
  StageOutcomeLabel,
} from '../core/types';
import { STAGES } from '../core/types';
import {
  STAGE_PASS_MIDPOINTS,
  STAGE_PASS_STEEPNESS,
  STAGE_PASS_MIN,
  STAGE_PASS_MAX,
  MIN_RING_CHANCE,
} from '../core/constants';
import { evaluateChemistry } from './chemistry';
import { computeRosterScore, stageTeamPower, findMvp, findWeakLink } from './ratings';
import { buildExplanation } from './explanations';
import { hashString, mulberry32 } from './rng';

function clampPass(chance: number): number {
  return Math.min(STAGE_PASS_MAX, Math.max(STAGE_PASS_MIN, chance));
}

export function stagePassProbability(power: number, stage: StageId): number {
  const mid = STAGE_PASS_MIDPOINTS[stage];
  const steepness = STAGE_PASS_STEEPNESS[stage];
  const logistic = 1 / (1 + Math.exp(-steepness * (power - mid)));
  return clampPass(logistic);
}

function jitter(power: number, stage: StageId, rng: () => number): number {
  const spread = stage === 'champs' ? 2.5 : 1.8;
  return power + (rng() - 0.5) * spread;
}

function rollMajorOutcome(passChance: number, rng: () => number): MajorOutcome {
  const roll = rng();
  if (roll < passChance * 0.55) return 'won';
  if (roll < passChance * 0.75) return 'runner_up';
  if (roll < passChance * 0.85) return 'top3';
  if (roll < passChance * 0.92) return 'top4';
  if (roll < passChance * 0.97) return 'top6';
  if (roll < passChance + 0.05) return 'top8';
  return 'eliminated';
}

function rollChampsOutcome(passChance: number, rng: () => number): ChampsOutcome {
  const roll = rng();
  if (roll < passChance * 0.35) return 'champion';
  if (roll < passChance * 0.55) return 'grand_final';
  if (roll < passChance * 0.7) return 'top3';
  if (roll < passChance * 0.82) return 'top4';
  if (roll < passChance * 0.9) return 'top6';
  if (roll < passChance + 0.06) return 'top8';
  return 'missed';
}

function isMajorPass(outcome: MajorOutcome): boolean {
  return outcome === 'won';
}

function isChampsPass(outcome: ChampsOutcome): boolean {
  return outcome === 'champion';
}

export function ringProbability(picks: DraftPick[]): number {
  const players = picks.map((p) => p.player);
  const chemistry = evaluateChemistry(picks);
  let odds = 1;
  for (const stage of STAGES) {
    const power = stageTeamPower(players, stage, chemistry.score);
    odds *= stagePassProbability(power, stage);
  }
  return Math.max(odds, MIN_RING_CHANCE);
}

export function simulateRingChase(
  picks: DraftPick[],
  options?: { seed?: string }
): SimulationResult {
  const players = picks.map((p) => p.player);
  const chemistry = evaluateChemistry(picks);
  const seed = options?.seed
    ? hashString(options.seed)
    : (Date.now() ^ (Math.random() * 1e9)) >>> 0;
  const rng = mulberry32(seed);

  const stages: StageOutcome[] = [];
  let majorWins = 0;

  for (const stage of STAGES) {
    const power = stageTeamPower(players, stage, chemistry.score);
    const effective = jitter(power, stage, rng);
    const passChance = stagePassProbability(effective, stage);

    let outcome: StageOutcomeLabel;
    if (stage === 'champs') {
      outcome = rollChampsOutcome(passChance, rng);
    } else {
      outcome = rollMajorOutcome(passChance, rng);
      if (isMajorPass(outcome as MajorOutcome)) majorWins += 1;
    }

    const passed = stage === 'champs' ? isChampsPass(outcome as ChampsOutcome) : isMajorPass(outcome as MajorOutcome);

    stages.push({
      stage,
      outcome,
      passed,
      passChance: Math.round(passChance * 1000) / 10,
      power: Math.round(effective * 10) / 10,
    });
  }

  const champsStage = stages.find((s) => s.stage === 'champs')!;
  const champsOutcome = champsStage.outcome as ChampsOutcome;
  const ringWon = champsOutcome === 'champion';
  const perfectSeason = ringWon && majorWins === 4;

  const rosterScore = computeRosterScore(players);
  const ringOdds = ringProbability(picks);
  const mvp = findMvp(players);
  const weakLink = findWeakLink(players);

  const partial: Omit<SimulationResult, 'explanation' | 'footer'> = {
    stages,
    ringWon,
    perfectSeason,
    majorWins,
    champsOutcome,
    rosterScore,
    ringOdds,
    chemistry,
    mvp,
    weakLink,
  };

  const { explanation, footer } = buildExplanation(partial);

  return { ...partial, explanation, footer };
}

const oddsCache = new Map<string, number>();

export function estimateRingOdds(picks: DraftPick[]): number {
  if (picks.length === 0) return 0;
  const key = picks.map((p) => p.player.id).sort().join('|');
  const cached = oddsCache.get(key);
  if (cached != null) return cached;
  const rate = ringProbability(picks);
  oddsCache.set(key, rate);
  return rate;
}
