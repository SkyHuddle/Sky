import type { SimulationResult } from '../core/types';
import { getDailyChallengeNumber } from './daily';

export function formatDailyShareLine(result: SimulationResult): string {
  const num = getDailyChallengeNumber();
  const { seasonSummary, majorWins, rosterScore, ringWon, perfectSeason } = result;
  const ring = perfectSeason ? ' · 20-0' : ringWon ? ' · Ring' : '';
  return `Ring Chase #${num} ${seasonSummary.record} · ${majorWins} major${majorWins === 1 ? '' : 's'} · ${rosterScore.toFixed(1)}${ring}`;
}

export function formatShareText(
  result: SimulationResult,
  rosterLine: string,
  isDaily: boolean
): string {
  const headline = isDaily
    ? formatDailyShareLine(result)
    : `${result.seasonSummary.headline} — ${result.seasonSummary.record}`;
  return `${headline}\n${result.seasonSummary.narrative}\n\n${rosterLine}\nScore: ${result.rosterScore.toFixed(1)}`;
}
