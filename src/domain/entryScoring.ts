/**
 * Entry-level scoring: combines per-player stage points with the roster that was locked for
 * each window, applying the captain multiplier (docs/04 step 8, docs/09 SC-5).
 */

export interface WindowRoster {
  windowId: string;
  stageId: string;
  playerIds: string[];
  captainId: string | null;
}

/** Points a player earned in a stage: series scores plus advancement credit. */
export type StagePlayerPoints = ReadonlyMap<string, ReadonlyMap<string, number>>; // stageId -> playerId -> points

export interface EntryScoreLine {
  windowId: string;
  stageId: string;
  playerId: string;
  basePoints: number;
  multiplier: number;
  points: number;
  isCaptain: boolean;
}

export interface EntryScore {
  total: number;
  captainPoints: number;
  lines: EntryScoreLine[];
  byWindow: Map<string, number>;
}

export function scoreEntry(
  rosters: readonly WindowRoster[],
  stagePoints: StagePlayerPoints,
  captainMultiplier: number,
): EntryScore {
  const lines: EntryScoreLine[] = [];
  const byWindow = new Map<string, number>();
  let total = 0;
  let captainPoints = 0;
  for (const r of rosters) {
    const perPlayer = stagePoints.get(r.stageId);
    let windowTotal = 0;
    for (const playerId of r.playerIds) {
      const base = perPlayer?.get(playerId) ?? 0;
      const isCaptain = r.captainId === playerId;
      const multiplier = isCaptain ? captainMultiplier : 1;
      const points = base * multiplier;
      lines.push({ windowId: r.windowId, stageId: r.stageId, playerId, basePoints: base, multiplier, points, isCaptain });
      windowTotal += points;
      if (isCaptain) captainPoints += points;
    }
    byWindow.set(r.windowId, windowTotal);
    total += windowTotal;
  }
  return { total, captainPoints, lines, byWindow };
}
