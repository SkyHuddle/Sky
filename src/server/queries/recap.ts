import { eq } from "drizzle-orm";
import { percentileLabel } from "@/lib/format";
import type { Db } from "../db/connect";
import * as s from "../db/schema";
import { getBoard } from "../services/leaderboards";
import type { EntryDashboard } from "./contest";

/**
 * Tournament recap for a finished contest (docs/DESIGN.md §5.11): every line is derived from the
 * settled ledger and final standings. No invented achievements: an award appears only when the
 * results earned it.
 */
export interface Recap {
  points: number;
  rank: number;
  entriesCount: number;
  percentile: string | null;
  settled: boolean;
  leagues: Array<{ id: string; name: string; rank: number | null; size: number }>;
  mvp: null | { id: string; nickname: string; teamId: string; points: number };
  captain: null | { bonus: number; best: { nickname: string; stageName: string; points: number } | null };
  bestValue: null | { id: string; nickname: string; teamId: string; points: number; price: number; per100k: number };
  awards: Array<{ id: string; label: string; detail: string }>;
}

export async function entryRecap(db: Db, d: EntryDashboard): Promise<Recap | null> {
  if (d.contest.status !== "completed" || d.entry.rank === null) return null;
  const totals = new Map<string, { nickname: string; teamId: string; points: number; base: number; price: number }>();
  let captainBonus = 0;
  let bestCaptain: { nickname: string; stageName: string; points: number } | null = null;
  for (const w of d.windows) {
    for (const p of w.players) {
      const t = totals.get(p.id) ?? { nickname: p.nickname, teamId: p.teamId, points: 0, base: 0, price: p.price };
      t.points += p.points;
      t.base += p.basePoints;
      t.price = p.price;
      totals.set(p.id, t);
      if (p.isCaptain) {
        captainBonus += p.points - p.basePoints;
        if (!bestCaptain || p.points > bestCaptain.points) bestCaptain = { nickname: p.nickname, stageName: w.stageName, points: p.points };
      }
    }
  }
  const list = [...totals.entries()].map(([id, t]) => ({ id, ...t }));
  const mvp = list.sort((a, b) => b.points - a.points)[0] ?? null;
  const value = list
    .filter((x) => x.price > 0)
    .map((x) => ({ ...x, per100k: x.base / (x.price / 100_000) }))
    .sort((a, b) => b.per100k - a.per100k)[0];

  const leagueRows = await db
    .select({ id: s.leagues.id, name: s.leagues.name })
    .from(s.leagueEntries)
    .innerJoin(s.leagues, eq(s.leagues.id, s.leagueEntries.leagueId))
    .where(eq(s.leagueEntries.entryId, d.entry.id));
  const leagues: Recap["leagues"] = [];
  for (const l of leagueRows) {
    const board = await getBoard(db, d.contest.id, { kind: "league", leagueId: l.id }, { viewerId: d.entry.userId, pageSize: 5 });
    leagues.push({ id: l.id, name: l.name, rank: board.me?.rank ?? null, size: board.total });
  }

  const rank = d.entry.rank;
  const pct = (rank / Math.max(1, d.entry.entriesCount)) * 100;
  const awards: Recap["awards"] = [];
  if (rank === 1) awards.push({ id: "champion", label: "Champion", detail: `1st of ${d.entry.entriesCount}` });
  else if (pct <= 1) awards.push({ id: "top1", label: "Top 1%", detail: `${rank} of ${d.entry.entriesCount}` });
  else if (pct <= 10) awards.push({ id: "top10", label: "Top 10%", detail: `${rank} of ${d.entry.entriesCount}` });
  else if (pct <= 25) awards.push({ id: "top25", label: "Top 25%", detail: `${rank} of ${d.entry.entriesCount}` });
  for (const l of leagues) if (l.rank === 1 && l.size > 1) awards.push({ id: `league-${l.id}`, label: "League winner", detail: l.name });

  return {
    points: d.entry.totalPoints,
    rank,
    entriesCount: d.entry.entriesCount,
    percentile: percentileLabel(rank, d.entry.entriesCount),
    settled: d.entry.scoreState === "settled",
    leagues,
    mvp: mvp ? { id: mvp.id, nickname: mvp.nickname, teamId: mvp.teamId, points: mvp.points } : null,
    captain: d.windows.some((w) => w.players.some((p) => p.isCaptain)) ? { bonus: captainBonus, best: bestCaptain } : null,
    bestValue: value ? { id: value.id, nickname: value.nickname, teamId: value.teamId, points: value.base, price: value.price, per100k: value.per100k } : null,
    awards,
  };
}
