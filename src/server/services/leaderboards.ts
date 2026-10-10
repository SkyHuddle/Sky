import { and, asc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import type { Db } from "../db/connect";
import * as s from "../db/schema";

/**
 * Leaderboards (docs/09 LV-4). Global rank is computed once per scoring batch (recomputeContest);
 * league and friends boards re-rank the same entries within the group, so one entry
 * appears on every board without being rebuilt.
 */

export type BoardScope = { kind: "global" } | { kind: "league"; leagueId: string } | { kind: "friends"; userId: string };

export interface BoardRow {
  rank: number;
  entryId: string;
  userId: string;
  username: string;
  displayName: string;
  avatarHue: number;
  points: number;
  movement: number | null;
  isBot: boolean;
}

export interface Board {
  rows: BoardRow[];
  total: number;
  me: BoardRow | null;
  page: number;
  pageSize: number;
}

/** Users who share at least one league with `userId` (plus the user). */
export async function friendIds(db: Db, userId: string): Promise<string[]> {
  const rows = await db.execute<{ user_id: string }>(sql`
    select distinct m2.user_id from league_members m1
    join league_members m2 on m2.league_id = m1.league_id
    where m1.user_id = ${userId}`);
  const list = (rows as unknown as { rows?: { user_id: string }[] }).rows ?? (rows as unknown as { user_id: string }[]);
  return [...new Set([userId, ...list.map((r) => r.user_id)])];
}

export async function getBoard(
  db: Db,
  contestId: string,
  scope: BoardScope,
  opts: { viewerId: string | null; page?: number; pageSize?: number },
): Promise<Board> {
  const pageSize = Math.min(100, Math.max(5, opts.pageSize ?? 25));
  const page = Math.max(1, opts.page ?? 1);

  let filter = and(eq(s.entries.contestId, contestId), isNotNull(s.entries.rank));
  if (scope.kind === "league") {
    const ids = (await db.select({ id: s.leagueEntries.entryId }).from(s.leagueEntries).where(eq(s.leagueEntries.leagueId, scope.leagueId))).map((r) => r.id);
    filter = and(filter, inArray(s.entries.id, ids.length ? ids : ["-"]));
  } else if (scope.kind === "friends") {
    const ids = await friendIds(db, scope.userId);
    filter = and(filter, inArray(s.entries.userId, ids));
  }

  const all = await db
    .select({
      entryId: s.entries.id,
      userId: s.entries.userId,
      rank: s.entries.rank,
      previousRank: s.entries.previousRank,
      points: s.entries.totalPoints,
      username: s.users.username,
      displayName: s.users.displayName,
      avatarHue: s.users.avatarHue,
      isBot: s.users.isBot,
    })
    .from(s.entries)
    .innerJoin(s.users, eq(s.users.id, s.entries.userId))
    .where(filter)
    .orderBy(asc(s.entries.rank), asc(s.entries.id));

  // Re-rank within the group, sharing ranks where the global rank is shared.
  const rows: BoardRow[] = [];
  all.forEach((r, i) => {
    const prev = rows[i - 1];
    const rank = prev && all[i - 1]!.rank === r.rank ? prev.rank : i + 1;
    rows.push({
      rank,
      entryId: r.entryId,
      userId: r.userId,
      username: r.username,
      displayName: r.displayName,
      avatarHue: r.avatarHue,
      points: r.points,
      // Movement is shown on the global board, where it's measured.
      movement: scope.kind === "global" && r.previousRank && r.rank ? r.previousRank - r.rank : null,
      isBot: r.isBot,
    });
  });
  const me = opts.viewerId ? rows.find((r) => r.userId === opts.viewerId) ?? null : null;
  return { rows: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length, me, page, pageSize };
}
