import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "../db/connect";
import * as s from "../db/schema";
import { getBoard, type Board } from "../services/leaderboards";

/** Read models for profiles and leagues. Only factual, recorded history is shown. */

export interface ProfileEntry {
  entryId: string;
  contestId: string;
  contestName: string;
  tournamentName: string;
  tournamentSlug: string;
  status: string;
  rank: number | null;
  entries: number;
  points: number;
  percentile: number | null;
  settled: boolean;
  endedAt: string;
}

export interface Profile {
  user: { id: string; username: string; displayName: string; avatarHue: number; favoriteGame: string; createdAt: string; isBot: boolean };
  active: ProfileEntry[];
  history: ProfileEntry[];
  stats: {
    eventsEntered: number;
    completed: number;
    bestRank: { rank: number; entries: number; tournamentName: string; contestName: string } | null;
    bestPercentile: number | null;
    averagePercentile: number | null;
    contestWins: number;
    leagueWins: number;
    careerPoints: number;
  };
}

export async function profileByUsername(db: Db, username: string): Promise<Profile | null> {
  const [u] = await db.select().from(s.users).where(sql`lower(${s.users.username}) = lower(${username})`);
  if (!u) return null;
  const rows = await db
    .select({
      entryId: s.entries.id,
      contestId: s.contests.id,
      contestName: s.contests.name,
      contestStatus: s.contests.status,
      settledAt: s.contests.settledAt,
      tournamentName: s.tournaments.name,
      tournamentSlug: s.tournaments.slug,
      endAt: s.tournaments.endAt,
      rank: s.entries.rank,
      points: s.entries.totalPoints,
    })
    .from(s.entries)
    .innerJoin(s.contests, eq(s.contests.id, s.entries.contestId))
    .innerJoin(s.tournaments, eq(s.tournaments.id, s.contests.tournamentId))
    .where(eq(s.entries.userId, u.id))
    .orderBy(desc(s.tournaments.beginAt));
  const counts = rows.length
    ? await db.select({ contestId: s.entries.contestId, n: count() }).from(s.entries).where(inArray(s.entries.contestId, rows.map((r) => r.contestId))).groupBy(s.entries.contestId)
    : [];
  const nOf = new Map(counts.map((c) => [c.contestId, Number(c.n)]));
  const list: ProfileEntry[] = rows.map((r) => {
    const entries = nOf.get(r.contestId) ?? 0;
    return {
      entryId: r.entryId,
      contestId: r.contestId,
      contestName: r.contestName,
      tournamentName: r.tournamentName,
      tournamentSlug: r.tournamentSlug,
      status: r.contestStatus,
      rank: r.rank,
      entries,
      points: r.points,
      percentile: r.rank && entries ? r.rank / entries : null,
      settled: !!r.settledAt,
      endedAt: r.endAt.toISOString(),
    };
  });
  const history = list.filter((x) => x.settled);
  const pct = history.map((h) => h.percentile).filter((x): x is number => x !== null);
  const best = [...history].filter((h) => h.rank).sort((a, b) => a.percentile! - b.percentile!)[0];

  // League wins: settled contests where the user's entry ranks first among league entries.
  let leagueWins = 0;
  const memberships = await db.select({ leagueId: s.leagueMembers.leagueId }).from(s.leagueMembers).where(eq(s.leagueMembers.userId, u.id));
  if (memberships.length) {
    const ls = await db
      .select({ id: s.leagues.id, contestId: s.leagues.contestId })
      .from(s.leagues)
      .innerJoin(s.contests, eq(s.contests.id, s.leagues.contestId))
      .where(and(inArray(s.leagues.id, memberships.map((m) => m.leagueId)), sql`${s.contests.settledAt} is not null`));
    for (const l of ls) {
      const b = await getBoard(db, l.contestId, { kind: "league", leagueId: l.id }, { viewerId: u.id, pageSize: 5 });
      if (b.me?.rank === 1 && b.total > 1) leagueWins++;
    }
  }

  return {
    user: { id: u.id, username: u.username, displayName: u.displayName, avatarHue: u.avatarHue, favoriteGame: u.favoriteGame, createdAt: u.createdAt.toISOString(), isBot: u.isBot },
    active: list.filter((x) => !x.settled),
    history,
    stats: {
      eventsEntered: new Set(list.map((x) => x.tournamentSlug)).size,
      completed: history.length,
      bestRank: best ? { rank: best.rank!, entries: best.entries, tournamentName: best.tournamentName, contestName: best.contestName } : null,
      bestPercentile: pct.length ? Math.min(...pct) : null,
      averagePercentile: pct.length ? pct.reduce((a, b) => a + b, 0) / pct.length : null,
      contestWins: history.filter((h) => h.rank === 1).length,
      leagueWins,
      careerPoints: history.reduce((a, h) => a + h.points, 0),
    },
  };
}

export interface LeagueListItem {
  id: string;
  name: string;
  privacy: string;
  role: string;
  members: number;
  contestId: string;
  contestName: string;
  contestStatus: string;
  tournamentName: string;
  tournamentSlug: string;
  myRank: number | null;
  leader: string | null;
}

export async function myLeagues(db: Db, userId: string): Promise<LeagueListItem[]> {
  const rows = await db
    .select({
      id: s.leagues.id,
      name: s.leagues.name,
      privacy: s.leagues.privacy,
      role: s.leagueMembers.role,
      contestId: s.contests.id,
      contestName: s.contests.name,
      contestStatus: s.contests.status,
      tournamentName: s.tournaments.name,
      tournamentSlug: s.tournaments.slug,
    })
    .from(s.leagueMembers)
    .innerJoin(s.leagues, eq(s.leagues.id, s.leagueMembers.leagueId))
    .innerJoin(s.contests, eq(s.contests.id, s.leagues.contestId))
    .innerJoin(s.tournaments, eq(s.tournaments.id, s.contests.tournamentId))
    .where(eq(s.leagueMembers.userId, userId))
    .orderBy(desc(s.leagueMembers.joinedAt));
  const out: LeagueListItem[] = [];
  for (const r of rows) {
    const [{ n } = { n: 0 }] = await db.select({ n: count() }).from(s.leagueMembers).where(eq(s.leagueMembers.leagueId, r.id));
    const board = await getBoard(db, r.contestId, { kind: "league", leagueId: r.id }, { viewerId: userId, pageSize: 5 });
    out.push({ ...r, members: Number(n), myRank: board.me?.rank ?? null, leader: board.rows[0]?.username ?? null });
  }
  return out;
}

export async function publicLeagues(db: Db, contestIds: string[]) {
  if (contestIds.length === 0) return [];
  const rows = await db
    .select({ id: s.leagues.id, name: s.leagues.name, description: s.leagues.description, contestId: s.leagues.contestId })
    .from(s.leagues)
    .where(and(inArray(s.leagues.contestId, contestIds), eq(s.leagues.privacy, "public")))
    .orderBy(asc(s.leagues.name));
  const out = [];
  for (const r of rows) {
    const [{ n } = { n: 0 }] = await db.select({ n: count() }).from(s.leagueMembers).where(eq(s.leagueMembers.leagueId, r.id));
    out.push({ ...r, members: Number(n) });
  }
  return out;
}

export interface LeagueDetail {
  league: typeof s.leagues.$inferSelect & { members: number };
  contest: { id: string; name: string; status: string };
  tournament: { name: string; slug: string };
  owner: { username: string };
  isMember: boolean;
  isOwner: boolean;
  board: Board;
  members: { userId: string; username: string; displayName: string; avatarHue: number; role: string; hasEntry: boolean }[];
}

export async function leagueDetail(db: Db, leagueId: string, viewerId: string | null, page = 1): Promise<LeagueDetail | null> {
  const [l] = await db.select().from(s.leagues).where(eq(s.leagues.id, leagueId));
  if (!l) return null;
  const [c] = await db.select().from(s.contests).where(eq(s.contests.id, l.contestId));
  const [t] = await db.select().from(s.tournaments).where(eq(s.tournaments.id, c!.tournamentId));
  const [owner] = await db.select({ username: s.users.username }).from(s.users).where(eq(s.users.id, l.ownerId));
  const memberRows = await db
    .select({ userId: s.leagueMembers.userId, role: s.leagueMembers.role, username: s.users.username, displayName: s.users.displayName, avatarHue: s.users.avatarHue })
    .from(s.leagueMembers)
    .innerJoin(s.users, eq(s.users.id, s.leagueMembers.userId))
    .where(eq(s.leagueMembers.leagueId, l.id))
    .orderBy(asc(s.leagueMembers.joinedAt));
  const isMember = !!viewerId && memberRows.some((m) => m.userId === viewerId);
  // Private leagues are visible to members only.
  if (l.privacy === "private" && !isMember) return null;
  const entryUsers = new Set(
    (await db.select({ userId: s.entries.userId }).from(s.leagueEntries).innerJoin(s.entries, eq(s.entries.id, s.leagueEntries.entryId)).where(eq(s.leagueEntries.leagueId, l.id))).map((r) => r.userId),
  );
  const board = await getBoard(db, l.contestId, { kind: "league", leagueId: l.id }, { viewerId, page, pageSize: 50 });
  return {
    league: { ...l, members: memberRows.length },
    contest: { id: c!.id, name: c!.name, status: c!.status },
    tournament: { name: t!.name, slug: t!.slug },
    owner: { username: owner!.username },
    isMember,
    isOwner: viewerId === l.ownerId,
    board,
    members: memberRows.map((m) => ({ ...m, hasEntry: entryUsers.has(m.userId) })),
  };
}
