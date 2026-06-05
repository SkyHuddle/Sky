import type { ChampsOutcome, DraftPick, SeasonSummary, SimulationResult, StageOutcome } from '../core/types';
import { CHAMPS_OUTCOME_LABELS } from '../core/types';
import { hashString } from './rng';

export type { SeasonSummary };

export const REGULAR_SEASON_GAMES = 20;

/** Ladder buckets: score 0–999 → wins 0–19; perfect season → 20-0 only */
const LADDER_MAX_NON_PERFECT = 999;
const LADDER_BUCKET = 50;

const CHAMPS_LADDER: Record<ChampsOutcome, number> = {
  champion: 120,
  grand_final: 92,
  top3: 78,
  top4: 65,
  top6: 50,
  top8: 38,
  missed: 12,
};

export type RegularSeasonInput = Pick<
  SimulationResult,
  | 'majorWins'
  | 'ringWon'
  | 'champsOutcome'
  | 'rosterScore'
  | 'perfectSeason'
  | 'failureStage'
  | 'stages'
>;

function bracketRecord(stages: StageOutcome[]): { wins: number; losses: number } {
  let wins = 0;
  let losses = 0;
  for (const stage of stages) {
    for (const beat of stage.run) {
      if (beat.passed) wins += 1;
      else {
        losses += 1;
        break;
      }
    }
  }
  return { wins, losses };
}

function majorsLine(majorWins: number): string {
  if (majorWins === 0) return '0 Majors';
  if (majorWins === 1) return '1 Major';
  if (majorWins === 4) return '4 Majors';
  return `${majorWins} Majors`;
}

function majorsVerb(majorWins: number): string {
  if (majorWins === 0) return 'won 0 majors';
  if (majorWins === 1) return 'won 1 major';
  return `won ${majorWins} majors`;
}

function champsLine(outcome: ChampsOutcome, ringWon: boolean): string {
  if (ringWon) return 'Champion';
  return CHAMPS_OUTCOME_LABELS[outcome];
}

function ringLine(ringWon: boolean, perfectSeason: boolean): string {
  if (perfectSeason) return 'Perfect Season';
  if (ringWon) return 'Ring';
  return 'No Ring';
}

function buildNarrative(
  record: string,
  majorWins: number,
  champsOutcome: ChampsOutcome,
  ringWon: boolean,
  perfectSeason: boolean
): string {
  if (perfectSeason) {
    return `You went ${record}, swept all four majors, and won Champs. Perfect season.`;
  }
  if (ringWon) {
    return `You went ${record}, won ${majorWins} major${majorWins === 1 ? '' : 's'}, and closed it out at Champs.`;
  }
  if (champsOutcome === 'grand_final') {
    return `You went ${record}, ${majorsVerb(majorWins)}, but lost Champs Grand Final. No ring.`;
  }
  if (majorWins > 0 && champsOutcome === 'missed') {
    return `You went ${record}, ${majorsVerb(majorWins)}, and missed Champs.`;
  }
  if (majorWins > 0) {
    return `You went ${record}, ${majorsVerb(majorWins)}, and fell short at Champs.`;
  }
  if (champsOutcome === 'missed') {
    return `You went ${record}, didn't win a major, and missed Champs.`;
  }
  return `You went ${record} but the run ended before a ring.`;
}

/**
 * Continuous 0–999 ladder from bracket outcome + roster context.
 * Each 50-point band maps to one regular-season win total (0–19).
 */
export function computeLadderScore(picks: DraftPick[], result: RegularSeasonInput): number {
  if (result.perfectSeason) return 1000;

  const trapSlots = picks.filter((p) => p.team.tier === 'underdog').length;
  const avgPower =
    result.stages.length > 0
      ? result.stages.reduce((sum, stage) => sum + stage.power, 0) / result.stages.length
      : result.rosterScore;

  let score = result.majorWins * 168;
  score += result.ringWon ? CHAMPS_LADDER.champion : CHAMPS_LADDER[result.champsOutcome];
  score += (result.rosterScore - 72) * 2.4;
  score += avgPower * 2.5;
  score -= trapSlots * 44;

  if (result.majorWins === 0) score -= 38;
  if (result.failureStage === 'major1') score -= 22;
  else if (result.failureStage === 'major2') score -= 8;

  for (const stage of result.stages) {
    const beatsCleared = stage.run.filter((beat) => beat.passed).length;
    score += beatsCleared * 2.2;
    if (!stage.passed) {
      score += stage.passChance * 0.42;
    }
  }

  const pickKey = picks.map((p) => `${p.team.id}:${p.player.id}`).join('|');
  const spread = hashString(
    `${pickKey}|${result.majorWins}|${result.failureStage ?? ''}|${result.champsOutcome}|${Math.round(result.rosterScore)}`
  );
  score += spread % 50;

  return Math.max(0, Math.min(LADDER_MAX_NON_PERFECT, Math.round(score)));
}

/** Maps ladder → wins in [0, 20]. Every combo 0-20 … 20-0 is a distinct bucket. */
export function computeRegularSeasonWins(picks: DraftPick[], result: RegularSeasonInput): number {
  if (result.perfectSeason) return REGULAR_SEASON_GAMES;
  const score = computeLadderScore(picks, result);
  const wins = Math.floor(score / LADDER_BUCKET);
  return Math.max(0, Math.min(REGULAR_SEASON_GAMES - 1, wins));
}

export function formatRegularSeasonRecord(wins: number): string {
  const clamped = Math.max(0, Math.min(REGULAR_SEASON_GAMES, wins));
  return `${clamped}-${REGULAR_SEASON_GAMES - clamped}`;
}

function regularSeasonRecord(
  picks: DraftPick[],
  result: RegularSeasonInput
): { wins: number; losses: number } {
  const wins = computeRegularSeasonWins(picks, result);
  return { wins, losses: REGULAR_SEASON_GAMES - wins };
}

export function buildSeasonSummary(
  result: Omit<SimulationResult, 'seasonSummary' | 'explanation' | 'footer' | 'historicalComparison'>,
  picks: DraftPick[]
): SeasonSummary {
  const { stages, majorWins, ringWon, perfectSeason, champsOutcome } = result;
  const reg = regularSeasonRecord(picks, result);
  const bracket = bracketRecord(stages);
  const record = formatRegularSeasonRecord(reg.wins);
  const majors = majorsLine(majorWins);
  const majorsWon = majorsVerb(majorWins);
  const champs = champsLine(champsOutcome, ringWon);
  const ring = ringLine(ringWon, perfectSeason);

  const headline = `${record} · ${majorWins > 0 ? `Won ${majors}` : '0 Majors'} · ${ring}`;
  const tagline = perfectSeason
    ? `${record} · Perfect Season`
    : ringWon
      ? `${record} · ${majorsWon} · Ring`
      : `${record} · ${majorsWon} · ${ring}`;

  const narrative = buildNarrative(record, majorWins, champsOutcome, ringWon, perfectSeason);

  return {
    record,
    regularSeasonWins: reg.wins,
    regularSeasonLosses: reg.losses,
    bracketWins: bracket.wins,
    bracketLosses: bracket.losses,
    majorWins,
    majorsLine: majors,
    champsLine: champs,
    ringLine: ring,
    headline,
    tagline,
    narrative,
  };
}
