import type { ChampsOutcome, DraftPick, SeasonSummary, SimulationResult, StageOutcome } from '../core/types';
import { CHAMPS_OUTCOME_LABELS } from '../core/types';
import { hashString } from './rng';

export type { SeasonSummary };

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

/** Deterministic regular-season record from roster strength + run outcome */
function regularSeasonRecord(
  picks: DraftPick[],
  result: Pick<
    SimulationResult,
    'majorWins' | 'ringWon' | 'champsOutcome' | 'rosterScore' | 'perfectSeason'
  >
): { wins: number; losses: number } {
  const games = 20;
  const pickKey = picks.map((p) => `${p.team.id}:${p.player.id}`).join('|');
  const noise = (hashString(pickKey) % 5) - 2;

  let wins = Math.round(
    7 +
      result.majorWins * 2.2 +
      (result.rosterScore - 84) * 0.22 +
      (result.ringWon ? 3.5 : result.champsOutcome === 'grand_final' ? 2 : result.champsOutcome === 'top4' ? 0.8 : 0) +
      noise * 0.35
  );

  wins = Math.min(games - 2, Math.max(5, wins));
  return { wins, losses: games - wins };
}

export function buildSeasonSummary(
  result: Omit<SimulationResult, 'seasonSummary' | 'explanation' | 'footer'>,
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
