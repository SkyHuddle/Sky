/**
 * Ranking with the documented tiebreaks (docs/04 universal rules, docs/09 SC-11):
 *   1. more total points
 *   2. more captain points
 *   3. fewer discretionary transfers used
 *   4. earlier final lineup submission
 *   5. otherwise the rank is shared. Never random.
 *
 * Points are compared at 0.001 precision so floating-point noise never decides a rank.
 */

export interface RankableEntry {
  entryId: string;
  total: number;
  captainPoints: number;
  transfersUsed: number;
  /** Epoch ms of the last roster submission. */
  submittedAt: number;
}

export interface RankedEntry extends RankableEntry {
  rank: number;
  percentile: number;
}

const q = (n: number) => Math.round(n * 1000);

function compare(a: RankableEntry, b: RankableEntry): number {
  return (
    q(b.total) - q(a.total) ||
    q(b.captainPoints) - q(a.captainPoints) ||
    a.transfersUsed - b.transfersUsed ||
    a.submittedAt - b.submittedAt
  );
}

export function rankEntries(entries: readonly RankableEntry[]): RankedEntry[] {
  const sorted = [...entries].sort((a, b) => compare(a, b) || a.entryId.localeCompare(b.entryId));
  const n = sorted.length;
  const out: RankedEntry[] = [];
  for (let i = 0; i < n; i++) {
    const cur = sorted[i]!;
    const prev = out[i - 1];
    const rank = prev && compare(prev, cur) === 0 ? prev.rank : i + 1;
    out.push({ ...cur, rank, percentile: n > 0 ? rank / n : 0 });
  }
  return out;
}

/** "Top 4%" style label. Uses the rank/entries percentile. */
export function percentileLabel(rank: number, entries: number): string {
  if (entries <= 0) return "";
  const p = (rank / entries) * 100;
  if (p <= 1) return `Top ${p < 0.1 ? "0.1" : p.toFixed(1).replace(/\.0$/, "")}%`;
  return `Top ${Math.ceil(p)}%`;
}
