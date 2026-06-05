import type { ChampsOutcome, DraftPick, SeasonSummary, SimulationResult, StageOutcome } from '../core/types';
import { CHAMPS_OUTCOME_LABELS } from '../core/types';
import { cardOverall } from './card-context';
import { hashString } from './rng';

export type { SeasonSummary };

export const REGULAR_SEASON_GAMES = 20;

const LADDER_MAX_NON_PERFECT = 999;
const LADDER_BUCKET = 50;

/** Small Champs placement nudge — regular season is roster-driven, not bracket-driven */
const CHAMPS_WIN_NUDGE: Record<ChampsOutcome, number> = {
  champion: 0.4,
  grand_final: 0.2,
  top3: 0.15,
  top4: 0.1,
  top6: 0,
  top8: -0.15,
  missed: -0.35,
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

function rosterAvgOvr(picks: DraftPick[]): number {
  if (picks.length === 0) return 72;
  const sum = picks.reduce((acc, pick) => acc + cardOverall(pick.player, pick.team), 0);
  return sum / picks.length;
}

function weakestOvr(picks: DraftPick[]): number {
  return Math.min(...picks.map((pick) => cardOverall(pick.player, pick.team)));
}

function weakLinkPenalty(weakest: number): number {
  if (weakest < 80) return (80 - weakest) * 0.4;
  if (weakest < 88) return (88 - weakest) * 0.15;
  return 0;
}

function recordHashSpread(picks: DraftPick[], result: RegularSeasonInput): number {
  const pickKey = picks.map((p) => `${p.team.id}:${p.player.id}`).join('|');
  return hashString(
    `${pickKey}|${result.majorWins}|${result.failureStage ?? ''}|${result.champsOutcome}|${Math.round(result.rosterScore)}`
  );
}

/** Talent ceiling from avg OVR — trap stacks can't post elite regular seasons */
function talentCeiling(avgOvr: number): number {
  return Math.min(19, Math.max(4, Math.round(5 + (avgOvr - 72) * 0.58)));
}

/**
 * Major wins imply a strong regular season, scaled by roster quality.
 * Trap/low-OVR stacks get a much lower floor so majors don't inflate bad teams to 17+ wins.
 */
function majorWinFloor(avgOvr: number, majorWins: number, trapSlots: number): number {
  if (majorWins === 0) return 0;

  const tierBoost = avgOvr >= 96 ? 3 : avgOvr >= 92 ? 2 : avgOvr >= 88 ? 1 : 0;
  let floor = 7 + majorWins * 3.5 + tierBoost;
  floor -= trapSlots * 4;
  floor -= Math.max(0, 90 - avgOvr) * 0.25;

  const minWithMajors = majorWins >= 2 ? 6 + majorWins : majorWins;
  return Math.max(minWithMajors, Math.min(19, Math.round(floor)));
}

function bracketCeilingBoost(majorWins: number): number {
  return Math.min(2, majorWins * 0.5);
}

/**
 * Expected regular-season wins from roster talent, weak links, traps, and modest bracket correlation.
 */
function computeTalentWins(picks: DraftPick[], result: RegularSeasonInput): number {
  const avgOvr = rosterAvgOvr(picks);
  const trapSlots = picks.filter((p) => p.team.tier === 'underdog').length;

  let wins = 4 + (avgOvr - 70) * 0.52 + (result.rosterScore - avgOvr) * 0.15;
  wins -= weakLinkPenalty(weakestOvr(picks));
  wins -= trapSlots * 2;
  wins += result.majorWins * 0.25;
  wins += result.ringWon ? 0.6 : CHAMPS_WIN_NUDGE[result.champsOutcome];

  if (result.majorWins === 0) wins -= 0.8;
  if (result.failureStage === 'major1') wins -= 0.5;
  else if (result.failureStage === 'major2') wins -= 0.25;

  return wins;
}

function recordJitter(picks: DraftPick[], result: RegularSeasonInput): number {
  return (recordHashSpread(picks, result) % 5) - 2;
}

export function computeRegularSeasonWins(picks: DraftPick[], result: RegularSeasonInput): number {
  if (result.perfectSeason) return REGULAR_SEASON_GAMES;

  const avgOvr = rosterAvgOvr(picks);
  const trapSlots = picks.filter((p) => p.team.tier === 'underdog').length;
  const floor = majorWinFloor(avgOvr, result.majorWins, trapSlots);
  const ceiling = talentCeiling(avgOvr) + bracketCeilingBoost(result.majorWins);

  let wins = Math.round(computeTalentWins(picks, result) + recordJitter(picks, result));
  wins = Math.max(floor, Math.min(Math.round(ceiling), wins));

  return Math.max(0, Math.min(REGULAR_SEASON_GAMES - 1, wins));
}

/** Ladder encoding for legacy tooling (50 points per win). */
export function computeLadderScore(picks: DraftPick[], result: RegularSeasonInput): number {
  if (result.perfectSeason) return 1000;

  const wins = computeRegularSeasonWins(picks, result);
  const spread = recordHashSpread(picks, result);
  return Math.max(0, Math.min(LADDER_MAX_NON_PERFECT, wins * LADDER_BUCKET + (spread % LADDER_BUCKET)));
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
