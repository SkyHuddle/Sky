/**
 * Swiss-stage helpers (CS2 Major format: 16 teams, 3 wins advance, 3 losses eliminate).
 * Used by the demo simulator for pairings and by the UI for standings.
 */

export interface SwissRecord {
  teamId: string;
  seed: number;
  wins: number;
  losses: number;
  opponents: string[];
}

export interface SwissConfig {
  winsToAdvance: number;
  lossesToEliminate: number;
}

export const MAJOR_SWISS: SwissConfig = { winsToAdvance: 3, lossesToEliminate: 3 };

export function isDecided(r: SwissRecord, c: SwissConfig): boolean {
  return r.wins >= c.winsToAdvance || r.losses >= c.lossesToEliminate;
}

/** A match is a decider (played BO3 in BO1 stages) if either team could advance or be eliminated. */
export function isDeciderMatch(a: SwissRecord, b: SwissRecord, c: SwissConfig): boolean {
  return [a, b].some(
    (r) => r.wins === c.winsToAdvance - 1 || r.losses === c.lossesToEliminate - 1,
  );
}

/**
 * Pair teams that share a record. Within a record group, highest seed plays lowest seed,
 * avoiding rematches where possible (simple backtracking; groups are small).
 */
export function swissPairings(records: readonly SwissRecord[], c: SwissConfig): Array<[string, string]> {
  const active = records.filter((r) => !isDecided(r, c));
  const groups = new Map<string, SwissRecord[]>();
  for (const r of active) {
    const key = `${r.wins}-${r.losses}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  const keys = [...groups.keys()].sort((a, b) => {
    const [aw, al] = a.split("-").map(Number) as [number, number];
    const [bw, bl] = b.split("-").map(Number) as [number, number];
    return bw - aw || al - bl;
  });
  const pairs: Array<[string, string]> = [];
  for (const key of keys) {
    const group = [...groups.get(key)!].sort((a, b) => a.seed - b.seed);
    const result = pairGroup(group);
    if (!result) throw new Error(`Cannot pair Swiss group ${key}`);
    pairs.push(...result);
  }
  return pairs;
}

function pairGroup(group: SwissRecord[]): Array<[string, string]> | null {
  if (group.length === 0) return [];
  if (group.length % 2 !== 0) return null;
  const [first, ...rest] = group;
  // Try opponents from the bottom of the seed list upward.
  const candidates = [...rest].reverse();
  for (const opp of candidates) {
    if (first!.opponents.includes(opp.teamId) && candidates.length > 1) continue;
    const remaining = rest.filter((r) => r !== opp);
    const sub = pairGroup(remaining);
    if (sub) return [[first!.teamId, opp.teamId], ...sub];
  }
  // Fall back to allowing a rematch rather than failing.
  const opp = candidates[0]!;
  const sub = pairGroup(rest.filter((r) => r !== opp));
  return sub ? [[first!.teamId, opp.teamId], ...sub] : null;
}

export function swissStandingsOrder(records: readonly SwissRecord[]): SwissRecord[] {
  return [...records].sort(
    (a, b) => b.wins - a.wins || a.losses - b.losses || a.seed - b.seed,
  );
}
