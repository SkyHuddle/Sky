import { and, asc, desc, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { scoreMap, type Cs2PlayerMapStats } from "@/domain/scoring/cs2";
import type { Db } from "../db/connect";
import * as s from "../db/schema";
import { ruleSetById } from "../ingest/score";
import { getBoard } from "../services/leaderboards";
import { teamsById, type TeamLite } from "./common";
import { entryDashboard, type DashboardPlayer, type EntryDashboard } from "./contest";

/**
 * Live GameDay read model (docs/LIVE_DATA.md): the viewer's own players first, then the matches
 * they're in, an activity feed derived from the scoring ledger and rank history, and Rival Watch.
 *
 * Score states, never mixed up:
 *   - "map points" from a live scoreboard snapshot: provisional, NOT in the fantasy total yet
 *     (series are scored as the average of their maps, so a map counts when it ends);
 *   - finished maps of a running series: provisional ledger rows, already in the total;
 *   - finished series: official; after settlement: settled.
 */

export interface LivePlayer {
  id: string;
  nickname: string;
  teamId: string;
  isCaptain: boolean;
  multiplier: number;
  /** Fantasy points in the contest's current window (ledger, includes finished maps of live series). */
  points: number;
  state: "live" | "upcoming" | "finished" | "eliminated" | "idle";
  live: null | {
    matchId: string;
    mapNumber: number;
    mapName: string;
    roundsFor: number;
    roundsAgainst: number;
    opponentId: string;
    kills: number;
    deaths: number;
    assists: number;
    /** This map so far under the contest's rules (no map-win bonus yet); provisional. */
    mapPoints: number;
    providerUpdatedAt: string;
  };
  next: null | { matchId: string; at: string; opponentId: string; postponed: boolean };
  /** The player's average fantasy points per completed map (the contest's reference stats), or null. */
  avgPerMap: number | null;
}

export interface LiveMatch {
  id: string;
  teamAId: string;
  teamBId: string;
  format: number;
  mapsA: number;
  mapsB: number;
  live: null | { number: number; mapName: string; roundsA: number; roundsB: number; providerUpdatedAt: string };
  myPlayers: string[];
}

export interface FeedItem {
  id: string;
  at: string;
  kind: "map" | "series" | "credit" | "correction" | "rank";
  text: string;
  points: number | null;
  playerId: string | null;
  state: string | null;
}

export interface Rival {
  entryId: string;
  username: string;
  avatarHue: number;
  rank: number;
  points: number;
  /** Their points minus yours. */
  gap: number;
  shared: string[];
  theirsOnly: Array<{ id: string; nickname: string; teamId: string; live: boolean }>;
  mineOnly: string[];
}

export interface LiveView {
  dashboard: EntryDashboard;
  windowId: string | null;
  stageName: string | null;
  anyLive: boolean;
  players: LivePlayer[];
  matches: LiveMatch[];
  feed: FeedItem[];
  rivals: { above: Rival | null; below: Rival | null };
  leagues: Array<{ id: string; name: string; rank: number | null; size: number }>;
  /** Provider freshness: when the newest live snapshot was produced (demo clock), and whether it looks stale. */
  freshness: { lastSnapshotAt: string | null; stale: boolean; lastIngestAt: string | null };
  teams: Record<string, TeamLite>;
  asOf: string;
}

const STALE_AFTER_MS = 10 * 60_000; // demo-clock minutes without a new round on a live map
const INGEST_STALE_MS = 3 * 60_000; // wall-clock minutes without a successful sync

/** The viewer's most relevant entry: a contest with live matches or an open window, newest event first. */
export async function liveEntryFor(db: Db, userId: string): Promise<string | null> {
  const rows = await db
    .select({ id: s.entries.id, status: s.contests.status, begin: s.tournaments.beginAt })
    .from(s.entries)
    .innerJoin(s.contests, eq(s.contests.id, s.entries.contestId))
    .innerJoin(s.tournaments, eq(s.tournaments.id, s.contests.tournamentId))
    .where(eq(s.entries.userId, userId))
    .orderBy(desc(s.tournaments.beginAt));
  const active = rows.find((r) => r.status === "live") ?? rows.find((r) => r.status !== "completed");
  return (active ?? rows[0])?.id ?? null;
}

export async function liveView(db: Db, entryId: string, viewerId: string | null, now: Date): Promise<LiveView | null> {
  const d = await entryDashboard(db, entryId, viewerId, now);
  if (!d) return null;
  const [c] = await db.select().from(s.contests).where(eq(s.contests.id, d.contest.id));
  const rules = ruleSetById(c!.ruleSetId);

  // The window being played: the latest locked one (an open transfer window isn't scoring yet).
  const scoring = [...d.windows].reverse().find((w) => w.status === "locked") ?? [...d.windows].reverse().find((w) => w.status === "completed") ?? null;
  const roster: DashboardPlayer[] = scoring?.players ?? [];
  const rosterIds = roster.map((p) => p.id);

  const liveMatchIds = d.matches.filter((m) => m.status === "live").map((m) => m.id);
  const liveRows = liveMatchIds.length ? await db.select().from(s.liveMaps).where(inArray(s.liveMaps.matchId, liveMatchIds)) : [];
  const liveByMatch = new Map(liveRows.map((r) => [r.matchId, r]));

  const avgRows = rosterIds.length
    ? await db.select({ id: s.playerPrices.playerId, avg: s.playerPrices.avgPoints, maps: s.playerPrices.mapsSampled }).from(s.playerPrices).where(and(eq(s.playerPrices.contestId, d.contest.id), inArray(s.playerPrices.playerId, rosterIds)))
    : [];
  const avgById = new Map(avgRows.filter((r) => r.maps > 0).map((r) => [r.id, Number(r.avg)]));

  const players: LivePlayer[] = roster.map((p) => {
    const m = p.status.kind === "live" ? d.matches.find((x) => x.id === (p.status as { matchId: string }).matchId) : null;
    const lm = m ? liveByMatch.get(m.id) : null;
    let live: LivePlayer["live"] = null;
    if (m && lm) {
      const line = (lm.stats as Cs2PlayerMapStats[]).find((x) => x.playerId === p.id);
      const forA = m.teamAId === p.teamId;
      const breakdown = line
        ? scoreMap(line, { mapNumber: lm.number, mapName: lm.mapName, roundsPlayed: lm.roundsA + lm.roundsB, winnerTeamId: "" }, rules)
        : null;
      live = {
        matchId: m.id,
        mapNumber: lm.number,
        mapName: lm.mapName,
        roundsFor: forA ? lm.roundsA : lm.roundsB,
        roundsAgainst: forA ? lm.roundsB : lm.roundsA,
        opponentId: forA ? m.teamBId : m.teamAId,
        kills: line?.kills ?? 0,
        deaths: line?.deaths ?? 0,
        assists: line?.assists ?? 0,
        mapPoints: breakdown?.mapScore ?? 0,
        providerUpdatedAt: lm.providerUpdatedAt.toISOString(),
      };
    }
    const st = p.status;
    return {
      id: p.id,
      nickname: p.nickname,
      teamId: p.teamId,
      isCaptain: p.isCaptain,
      multiplier: p.multiplier,
      points: p.points,
      state: st.kind === "live" ? "live" : st.kind === "next" ? "upcoming" : st.kind === "eliminated" ? "eliminated" : st.kind === "done" || st.kind === "did_not_play" ? "finished" : "idle",
      live,
      next: st.kind === "next" ? { matchId: "", at: st.at, opponentId: st.opponentId, postponed: st.postponed } : null,
      avgPerMap: avgById.get(p.id) ?? null,
    };
  });

  const teamIds = new Set(roster.map((p) => p.teamId));
  const matches: LiveMatch[] = d.matches
    .filter((m) => m.status === "live" && (teamIds.has(m.teamAId) || teamIds.has(m.teamBId)))
    .map((m) => {
      const lm = liveByMatch.get(m.id);
      return {
        id: m.id,
        teamAId: m.teamAId,
        teamBId: m.teamBId,
        format: m.format,
        mapsA: m.mapsA,
        mapsB: m.mapsB,
        live: lm ? { number: lm.number, mapName: lm.mapName, roundsA: lm.roundsA, roundsB: lm.roundsB, providerUpdatedAt: lm.providerUpdatedAt.toISOString() } : null,
        myPlayers: roster.filter((p) => p.teamId === m.teamAId || p.teamId === m.teamBId).map((p) => p.id),
      };
    });

  const feed = await buildFeed(db, d, rosterIds, c!.ruleSetId, scoring?.stageId ?? null);
  const rivals = await rivalWatch(db, d, scoring?.id ?? null, rosterIds, players);
  const leagues = await leagueRanks(db, d);

  // Freshness: a live map whose last round is old, or no successful sync recently, means delayed data.
  const lastSnap = liveRows.reduce<Date | null>((a, r) => (!a || r.providerUpdatedAt > a ? r.providerUpdatedAt : a), null);
  const [lastRun] = await db
    .select({ at: s.ingestionRuns.finishedAt })
    .from(s.ingestionRuns)
    .where(and(eq(s.ingestionRuns.status, "succeeded"), isNotNull(s.ingestionRuns.finishedAt)))
    .orderBy(desc(s.ingestionRuns.finishedAt))
    .limit(1);
  const anyLive = matches.length > 0;
  const snapshotStale = anyLive && (!lastSnap || now.getTime() - lastSnap.getTime() > STALE_AFTER_MS);
  const ingestStale = anyLive && (!lastRun?.at || Date.now() - lastRun.at.getTime() > INGEST_STALE_MS);

  return {
    dashboard: d,
    windowId: scoring?.id ?? null,
    stageName: scoring?.stageName ?? null,
    anyLive,
    players,
    matches,
    feed,
    rivals,
    leagues,
    freshness: { lastSnapshotAt: lastSnap?.toISOString() ?? null, stale: snapshotStale || ingestStale, lastIngestAt: lastRun?.at?.toISOString() ?? null },
    teams: d.teams,
    asOf: now.toISOString(),
  };
}

/** Activity derived only from the ledger and rank history: nothing here is generated for effect. */
async function buildFeed(db: Db, d: EntryDashboard, rosterIds: string[], ruleSetId: string, stageId: string | null): Promise<FeedItem[]> {
  if (rosterIds.length === 0 || !stageId) return [];
  // The stage being played: earlier stages are history, shown on the team page.
  const stageIds = [stageId];
  const rows = await db
    .select()
    .from(s.scoringEvents)
    .where(and(eq(s.scoringEvents.ruleSetId, ruleSetId), inArray(s.scoringEvents.stageId, stageIds), inArray(s.scoringEvents.playerId, rosterIds)))
    .orderBy(asc(s.scoringEvents.createdAt));
  const nick = new Map(d.windows.flatMap((w) => w.players.map((p) => [p.id, p.nickname] as const)));
  const captainIds = new Set(d.windows.filter((w) => w.status === "locked" || w.status === "completed").flatMap((w) => w.players.filter((p) => p.isCaptain).map((p) => p.id)));
  const prevOf = new Map<string, typeof rows[number]>();
  const items: FeedItem[] = [];
  for (const r of rows) {
    const key = `${r.kind}|${r.matchId ?? ""}|${r.playerId}`;
    const prev = prevOf.get(key);
    prevOf.set(key, r);
    const name = nick.get(r.playerId) ?? "Your player";
    const cap = captainIds.has(r.playerId) ? " (captain, before 1.5×)" : "";
    const bd = r.breakdown as { maps?: Array<{ mapNumber: number; mapName: string; mapScore: number }>; total?: number };
    const maps = bd.maps ?? [];
    if (r.kind === "advancement_credit") {
      items.push({ id: r.id, at: r.createdAt.toISOString(), kind: "credit", text: `${name} earned advancement credit${cap}`, points: r.points, playerId: r.playerId, state: r.state });
      continue;
    }
    const prevMaps = (prev?.breakdown as { maps?: unknown[] } | undefined)?.maps?.length ?? 0;
    if (prev && prevMaps === maps.length && prev.state === r.state && prev.points !== r.points) {
      items.push({ id: r.id, at: r.createdAt.toISOString(), kind: "correction", text: `${name}: stats corrected by the data provider`, points: r.points - prev.points, playerId: r.playerId, state: r.state });
    } else if (r.state === "provisional" && maps.length > prevMaps) {
      const m = maps[maps.length - 1]!;
      items.push({ id: r.id, at: r.createdAt.toISOString(), kind: "map", text: `${name}: Map ${m.mapNumber} on ${m.mapName} counted · ${m.mapScore.toFixed(1)} map points${cap}`, points: r.points - (prev?.points ?? 0), playerId: r.playerId, state: r.state });
    } else if (r.state === "official" && (!prev || prev.state === "provisional")) {
      items.push({ id: r.id, at: r.createdAt.toISOString(), kind: "series", text: `${name}: series final · ${r.points.toFixed(1)} points${cap}`, points: r.points - (prev?.points ?? 0), playerId: r.playerId, state: r.state });
    }
  }
  // Rank changes from the standings history.
  const snaps = await db
    .select({ rank: s.standingsSnapshots.rank, at: s.standingsSnapshots.createdAt, batch: s.standingsSnapshots.batchId })
    .from(s.standingsSnapshots)
    .where(eq(s.standingsSnapshots.entryId, d.entry.id))
    .orderBy(asc(s.standingsSnapshots.createdAt));
  for (let i = 1; i < snaps.length; i++) {
    const a = snaps[i - 1]!;
    const b = snaps[i]!;
    if (a.rank === b.rank) continue;
    const up = b.rank < a.rank;
    items.push({ id: `rank-${b.batch}`, at: b.at.toISOString(), kind: "rank", text: `You moved ${up ? "up" : "down"} ${Math.abs(a.rank - b.rank)} place${Math.abs(a.rank - b.rank) > 1 ? "s" : ""} to ${b.rank}`, points: null, playerId: null, state: up ? "up" : "down" });
  }
  return items.sort((x, y) => (x.at < y.at ? 1 : -1)).slice(0, 20);
}

/** The managers immediately above and below you: gap, shared and different players. */
async function rivalWatch(db: Db, d: EntryDashboard, windowId: string | null, rosterIds: string[], mine: LivePlayer[]): Promise<LiveView["rivals"]> {
  const rank = d.entry.rank;
  if (!rank || !windowId) return { above: null, below: null };
  const near = await db
    .select({ id: s.entries.id, rank: s.entries.rank, points: s.entries.totalPoints, userId: s.entries.userId })
    .from(s.entries)
    .where(and(eq(s.entries.contestId, d.contest.id), inArray(s.entries.rank, [rank - 1, rank + 1].filter((r) => r > 0))));
  const pick = async (r: number): Promise<Rival | null> => {
    const e = near.find((x) => x.rank === r && x.id !== d.entry.id);
    if (!e) return null;
    const [u] = await db.select({ username: s.users.username, hue: s.users.avatarHue }).from(s.users).where(eq(s.users.id, e.userId));
    // Rosters for a locked window are public; open-window changes stay private until lock.
    const [v] = await db
      .select({ id: s.rosterVersions.id })
      .from(s.rosterVersions)
      .where(and(eq(s.rosterVersions.entryId, e.id), eq(s.rosterVersions.windowId, windowId)))
      .orderBy(desc(s.rosterVersions.version))
      .limit(1);
    const sel = v ? await db.select({ playerId: s.rosterSelections.playerId }).from(s.rosterSelections).where(eq(s.rosterSelections.rosterVersionId, v.id)) : [];
    const theirs = sel.map((x) => x.playerId);
    const ps = theirs.length ? await db.select({ id: s.players.id, nickname: s.players.nickname }).from(s.players).where(inArray(s.players.id, theirs)) : [];
    const memberships = theirs.length
      ? await db.select({ playerId: s.playerTeamMemberships.playerId, teamId: s.playerTeamMemberships.teamId }).from(s.playerTeamMemberships).where(and(inArray(s.playerTeamMemberships.playerId, theirs), isNull(s.playerTeamMemberships.validTo)))
      : [];
    const liveTeams = new Set(d.matches.filter((m) => m.status === "live").flatMap((m) => [m.teamAId, m.teamBId]));
    return {
      entryId: e.id,
      username: u?.username ?? "manager",
      avatarHue: u?.hue ?? 200,
      rank: e.rank!,
      points: e.points,
      gap: e.points - d.entry.totalPoints,
      shared: theirs.filter((id) => rosterIds.includes(id)),
      theirsOnly: theirs
        .filter((id) => !rosterIds.includes(id))
        .map((id) => {
          const teamId = memberships.find((m) => m.playerId === id)?.teamId ?? "";
          return { id, nickname: ps.find((p) => p.id === id)?.nickname ?? id, teamId, live: liveTeams.has(teamId) };
        }),
      mineOnly: mine.filter((p) => !theirs.includes(p.id)).map((p) => p.id),
    };
  };
  return { above: await pick(rank - 1), below: await pick(rank + 1) };
}

async function leagueRanks(db: Db, d: EntryDashboard): Promise<LiveView["leagues"]> {
  const rows = await db
    .select({ id: s.leagues.id, name: s.leagues.name })
    .from(s.leagueEntries)
    .innerJoin(s.leagues, eq(s.leagues.id, s.leagueEntries.leagueId))
    .where(eq(s.leagueEntries.entryId, d.entry.id));
  const out: LiveView["leagues"] = [];
  for (const l of rows) {
    const board = await getBoard(db, d.contest.id, { kind: "league", leagueId: l.id }, { viewerId: d.entry.userId, pageSize: 5 });
    out.push({ id: l.id, name: l.name, rank: board.me?.rank ?? null, size: board.total });
  }
  return out;
}

export async function teamsFor(db: Db, ids: string[]) {
  return Object.fromEntries(await teamsById(db, ids));
}

/** What the Live screen and its stream carry: the live view without the full dashboard payload. */
export interface LivePayload {
  entryId: string;
  isOwner: boolean;
  username: string;
  tournament: { name: string; slug: string; isDemo: boolean };
  contest: { id: string; name: string; status: string };
  stageName: string | null;
  openWindow: null | { stageName: string; lockAt: string; transfers: number };
  nextLock: null | { stageName: string; lockAt: string };
  entry: { points: number; rank: number | null; previousRank: number | null; entriesCount: number; scoreState: string };
  anyLive: boolean;
  players: LivePlayer[];
  matches: LiveMatch[];
  feed: FeedItem[];
  rivals: LiveView["rivals"];
  leagues: LiveView["leagues"];
  freshness: LiveView["freshness"];
  teams: Record<string, TeamLite>;
  asOf: string;
}

export function toLivePayload(v: LiveView): LivePayload {
  const d = v.dashboard;
  const ow = d.contest.openWindow && new Date(d.contest.openWindow.lockAt) > new Date(v.asOf) ? d.contest.openWindow : null;
  return {
    entryId: d.entry.id,
    isOwner: d.isOwner,
    username: d.entry.username,
    tournament: { name: d.tournament.shortName, slug: d.tournament.slug, isDemo: d.tournament.isDemo },
    contest: { id: d.contest.id, name: d.contest.name, status: d.contest.status },
    stageName: v.stageName,
    openWindow: ow ? { stageName: ow.stageName, lockAt: ow.lockAt, transfers: d.rules.transfersPerWindow } : null,
    nextLock: d.contest.nextWindow ? { stageName: d.contest.nextWindow.stageName, lockAt: d.contest.nextWindow.lockAt } : null,
    entry: { points: d.entry.totalPoints, rank: d.entry.rank, previousRank: d.entry.previousRank, entriesCount: d.entry.entriesCount, scoreState: d.entry.scoreState },
    anyLive: v.anyLive,
    players: v.players,
    matches: v.matches,
    feed: v.feed,
    rivals: v.rivals,
    leagues: v.leagues,
    freshness: v.freshness,
    teams: Object.fromEntries(Object.entries(v.teams).filter(([id]) => v.players.some((p) => p.teamId === id || p.live?.opponentId === id || p.next?.opponentId === id) || v.matches.some((m) => m.teamAId === id || m.teamBId === id) || [v.rivals.above, v.rivals.below].some((r) => r?.theirsOnly.some((x) => x.teamId === id)))),
    asOf: v.asOf,
  };
}
