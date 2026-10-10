/**
 * Advancement credit (docs/04, step 7).
 *
 * In a Swiss or group stage, a team that advances having played fewer series than the longest
 * possible path gets `credit` points per unplayed series for each player who played the team's
 * last series in that stage. Without it, a 3-2 team plays five series and can outscore a 3-0 team.
 *
 * Forfeit wins count as unplayed series (docs/04 universal rules: "the advancing team's players
 * get advancement credit for the unplayed series").
 */

export interface StageTeamRecord {
  teamId: string;
  /** Series actually played (forfeits excluded). */
  seriesPlayed: number;
  /** Series won by forfeit. */
  forfeitWins: number;
  advanced: boolean;
  /** Players who played the team's final played series in the stage. */
  finalSeriesPlayerIds: string[];
}

export interface AdvancementCreditLine {
  teamId: string;
  playerId: string;
  unplayedSeries: number;
  points: number;
}

export function advancementCredits(
  records: readonly StageTeamRecord[],
  maxSeriesPath: number,
  credit: number,
): AdvancementCreditLine[] {
  const lines: AdvancementCreditLine[] = [];
  for (const r of records) {
    if (!r.advanced) continue;
    const unplayed = Math.max(0, maxSeriesPath - r.seriesPlayed);
    if (unplayed === 0) continue;
    for (const playerId of r.finalSeriesPlayerIds) {
      lines.push({ teamId: r.teamId, playerId, unplayedSeries: unplayed, points: unplayed * credit });
    }
  }
  return lines.sort((a, b) => a.playerId.localeCompare(b.playerId));
}

/** Longest possible path through a Swiss stage: (wins to advance) + (losses to eliminate) − 1. */
export function swissMaxPath(winsToAdvance: number, lossesToEliminate: number): number {
  return winsToAdvance + lossesToEliminate - 1;
}
