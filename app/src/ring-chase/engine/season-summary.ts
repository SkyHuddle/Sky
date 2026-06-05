import type { ChampsOutcome, DraftPick, SeasonSummary, SimulationResult, StageId, StageOutcome } from '../core/types';
import { CHAMPS_OUTCOME_LABELS } from '../core/types';
import { hashString } from './rng';

export type { SeasonSummary };

const REGULAR_SEASON_GAMES = 20;

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

function champsRegularSeasonBonus(outcome: ChampsOutcome, ringWon: boolean): number {
  if (ringWon) return 0;
  if (outcome === 'grand_final') return 2;
  if (outcome === 'top4') return 1;
  if (outcome === 'top6') return 0;
  return 0;
}

function failureCeiling(stage: StageId | null): number {
  if (!stage) return REGULAR_SEASON_GAMES - 1;
  const caps: Record<StageId, number> = {
    major1: 2,
    major2: 7,
    major3: 11,
    major4: 14,
    champs: 17,
  };
  return caps[stage];
}

/**
 * Maps bracket outcome → CDL-style 20-game regular season record.
 * Full range: 20-0 (perfect) through 0-20 (bombed out).
 */
function regularSeasonRecord(
  picks: DraftPick[],
  result: Pick<
    SimulationResult,
    | 'majorWins'
    | 'ringWon'
    | 'champsOutcome'
    | 'rosterScore'
    | 'perfectSeason'
    | 'failureStage'
    | 'stages'
  >
): { wins: number; losses: number } {
  if (result.perfectSeason) {
    return { wins: REGULAR_SEASON_GAMES, losses: 0 };
  }

  const pickKey = picks.map((p) => `${p.team.id}:${p.player.id}`).join('|');
  const noise = (hashString(`${pickKey}-reg`) % 5) - 2;
  const trapSlots = picks.filter((p) => p.team.tier === 'underdog').length;

  let wins =
    result.majorWins * 4 +
    (result.ringWon ? 4 : 0) +
    champsRegularSeasonBonus(result.champsOutcome, result.ringWon);

  wins += Math.round((result.rosterScore - 82) * 0.22);
  wins -= Math.round(trapSlots * 1.25);
  wins += noise;

  if (!result.ringWon && result.failureStage) {
    wins = Math.min(wins, failureCeiling(result.failureStage));
  }

  const firstMajor = result.stages.find((s) => s.stage === 'major1');
  if (
    result.majorWins === 0 &&
    result.failureStage === 'major1' &&
    firstMajor?.outcome === 'eliminated'
  ) {
    wins = Math.min(wins, Math.max(0, Math.round((result.rosterScore - 74) * 0.15)));
  }

  wins = Math.max(0, Math.min(REGULAR_SEASON_GAMES - 1, Math.round(wins)));
  return { wins, losses: REGULAR_SEASON_GAMES - wins };
}

export function buildSeasonSummary(
  result: Omit<SimulationResult, 'seasonSummary' | 'explanation' | 'footer' | 'historicalComparison'>,
  picks: DraftPick[]
): SeasonSummary {
  const { stages, majorWins, ringWon, perfectSeason, champsOutcome } = result;
  const reg = regularSeasonRecord(picks, result);
  const bracket = bracketRecord(stages);
  const record = `${reg.wins}-${reg.losses}`;
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
