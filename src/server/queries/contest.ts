import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import type { SeriesBreakdown } from "@/domain/scoring/cs2";
import type { AdvancementCreditLine } from "@/domain/scoring/advancement";
import { windowRules, type ContestRules } from "@/domain/types";
import type { Db } from "../db/connect";
import * as s from "../db/schema";
import { currentRoster } from "../ingest/contests";
import { ruleSetById } from "../ingest/score";
import { matchesForStages, recentMaps, teamsById, type MatchLite, type RecentMap, type TeamLite } from "./common";
import { tournamentSummaries, type ContestView, type TournamentSummary } from "./tournament";

/** Read models for the lineup builder, the entry dashboard and the player sheet. */

export interface PoolPlayerView {
  id: string;
  nickname: string;
  firstName: string;
  lastName: string;
  nationality: string;
  role: string;
  teamId: string;
  price: number;
  /** Average fantasy points per map over the player's last 10 maps (historical fact). */
  avgPoints: number;
  mapsSampled: number;
  /** Map scores, most recent last (up to 5). */
  form: number[];
  /** True when the user already owns this player: the price shown is what they paid. */
  held: boolean;
  /** Fantasy points scored in this contest so far (live events only). */
  contestPoints: number;
  nextOpponentId: string | null;
  nextMatchAt: string | null;
  /** Share of entries with this player in the window. Only shown after the window locks. */
  ownership: number | null;
}

export interface BuilderData {
  tournament: TournamentSummary;
  contest: ContestView;
  rules: ContestRules;
  ruleSetId: string;
  state: "open" | "locked" | "upcoming" | "completed";
  window: { id: string; position: number; stageName: string; lockAt: string } | null;
  pool: PoolPlayerView[];
  teams: Record<string, TeamLite>;
  /** The roster currently saved for this window (if any). */
  saved: { playerIds: string[]; captainId: string | null; source: string } | null;
  /** The previous window's locked roster (transfers are counted against it). */
  previous: { playerIds: string[]; captainId: string | null } | null;
  /** Previous-window players no longer eligible (eliminated): replacing them is free. */
  ineligiblePrevious: { id: string; nickname: string; teamId: string; price: number }[];
  entryId: string | null;
  autopilot: boolean | null;
}

export async function builderData(db: Db, contestId: string, viewerId: string | null, now: Date): Promise<BuilderData | null> {
  const [c] = await db.select().from(s.contests).where(eq(s.contests.id, contestId));
  if (!c) return null;
  const [t] = await db.select().from(s.tournaments).where(eq(s.tournaments.id, c.tournamentId));
  const [summary] = await tournamentSummaries(db, viewerId, { slug: t!.slug });
  const contest = summary!.contests.find((x) => x.id === c.id)!;
  const rs = ruleSetById(c.ruleSetId);

  const open = contest.openWindow && new Date(contest.openWindow.lockAt) > now ? contest.openWindow : null;
  const lastLocked = [...contest.windows].reverse().find((w) => w.status === "locked" || w.status === "completed") ?? null;
  const shownWindow = open ?? lastLocked ?? contest.windows[0] ?? null;
  // The shown window's own rules (transfer allowance, team limit) apply in the builder.
  const [windowRow] = shownWindow ? await db.select().from(s.contestWindows).where(eq(s.contestWindows.id, shownWindow.id)) : [];
  const rules = windowRules(c.rules as ContestRules, windowRow);
  const state: BuilderData["state"] = open
    ? "open"
    : contest.status === "completed"
      ? "completed"
      : contest.openWindow || lastLocked
        ? "locked"
        : "upcoming";

  const poolRows = shownWindow && shownWindow.status !== "upcoming" ? await db.select().from(s.windowPool).where(eq(s.windowPool.windowId, shownWindow.id)) : [];
  const ids = poolRows.map((p) => p.playerId);
  const playerRows = ids.length ? await db.select().from(s.players).where(inArray(s.players.id, ids)) : [];
  const recent = await recentMaps(db, ids, rs, now, 10);
  const teams = await teamsById(db, [...new Set(poolRows.map((p) => p.teamId))]);

  // Next opponent: first scheduled match of the window's stage for the team.
  const stageMatches = shownWindow ? await matchesForStages(db, [shownWindow.stageId]) : [];
  const nextFor = (teamId: string) =>
    stageMatches.find((m) => (m.teamAId === teamId || m.teamBId === teamId) && (m.status === "scheduled" || m.status === "postponed" || m.status === "live"));

  // Contest points so far (current ledger) for live/locked contests.
  const scoringStageIds = contest.windows.filter((w) => w.status === "locked" || w.status === "completed").map((w) => w.stageId);
  const pointsRows = scoringStageIds.length && ids.length
    ? await db
        .select({ playerId: s.scoringEvents.playerId, points: s.scoringEvents.points })
        .from(s.scoringEvents)
        .where(and(eq(s.scoringEvents.ruleSetId, c.ruleSetId), inArray(s.scoringEvents.stageId, scoringStageIds), isNull(s.scoringEvents.supersededById), inArray(s.scoringEvents.playerId, ids)))
    : [];
  const contestPoints = new Map<string, number>();
  for (const r of pointsRows) contestPoints.set(r.playerId, (contestPoints.get(r.playerId) ?? 0) + r.points);

  // Ownership is only revealed after lock (docs/04: reduce herding).
  let ownership: Map<string, number> | null = null;
  if (shownWindow && (shownWindow.status === "locked" || shownWindow.status === "completed")) {
    ownership = await windowOwnership(db, c.id, shownWindow.id);
  }

  const pool: PoolPlayerView[] = poolRows
    .map((p) => {
      const pl = playerRows.find((x) => x.id === p.playerId)!;
      const maps = recent.get(p.playerId) ?? [];
      const nm = nextFor(p.teamId);
      return {
        id: p.playerId,
        nickname: pl.nickname,
        firstName: pl.firstName,
        lastName: pl.lastName,
        nationality: pl.nationality,
        role: pl.role,
        teamId: p.teamId,
        price: p.price,
        avgPoints: maps.length ? maps.reduce((a, m) => a + m.mapScore, 0) / maps.length : 0,
        mapsSampled: maps.length,
        form: maps.slice(0, 5).map((m) => m.mapScore).reverse(),
        contestPoints: contestPoints.get(p.playerId) ?? 0,
        nextOpponentId: nm ? (nm.teamAId === p.teamId ? nm.teamBId : nm.teamAId) : null,
        nextMatchAt: nm?.scheduledAt ?? null,
        ownership: ownership ? ownership.get(p.playerId) ?? 0 : null,
        held: false,
      };
    })
    .sort((a, b) => b.price - a.price || a.nickname.localeCompare(b.nickname));

  // Viewer's entry.
  let saved: BuilderData["saved"] = null;
  let previous: BuilderData["previous"] = null;
  let ineligiblePrevious: BuilderData["ineligiblePrevious"] = [];
  let entryId: string | null = null;
  let autopilot: boolean | null = null;
  if (viewerId) {
    const [e] = await db.select().from(s.entries).where(and(eq(s.entries.contestId, c.id), eq(s.entries.userId, viewerId)));
    if (e) {
      entryId = e.id;
      autopilot = e.autopilot;
      if (shownWindow) {
        const r = await currentRoster(db, e.id, shownWindow.id);
        if (r) saved = { playerIds: r.playerIds, captainId: r.version.captainPlayerId, source: r.version.source };
        const prevW = contest.windows.find((w) => w.position === shownWindow.position - 1);
        if (prevW) {
          const pr = await currentRoster(db, e.id, prevW.id);
          if (pr) {
            previous = { playerIds: pr.playerIds, captainId: pr.version.captainPlayerId };
            // Kept players count at the price paid for them.
            for (const p of pool) {
              const paid = pr.prices.get(p.id);
              if (paid) {
                p.price = paid;
                p.held = true;
              }
            }
            const gone = pr.playerIds.filter((id) => !ids.includes(id));
            if (gone.length) {
              const gp = await db.select().from(s.players).where(inArray(s.players.id, gone));
              const prices = await db.select().from(s.playerPrices).where(and(eq(s.playerPrices.contestId, c.id), inArray(s.playerPrices.playerId, gone)));
              const mem = await db.select().from(s.playerTeamMemberships).where(inArray(s.playerTeamMemberships.playerId, gone));
              ineligiblePrevious = gp.map((p) => ({
                id: p.id,
                nickname: p.nickname,
                teamId: mem.find((m) => m.playerId === p.id)?.teamId ?? "",
                price: pr.prices.get(p.id) ?? prices.find((x) => x.playerId === p.id)?.price ?? 0,
              }));
              const extraTeams = await teamsById(db, ineligiblePrevious.map((x) => x.teamId));
              for (const [k, v] of extraTeams) teams.set(k, v);
            }
          }
        }
      }
    }
  }

  return {
    tournament: summary!,
    contest,
    rules,
    ruleSetId: c.ruleSetId,
    state,
    window: shownWindow ? { id: shownWindow.id, position: shownWindow.position, stageName: shownWindow.stageName, lockAt: shownWindow.lockAt } : null,
    pool,
    teams: Object.fromEntries(teams),
    saved,
    previous,
    ineligiblePrevious,
    entryId,
    autopilot,
  };
}

export async function windowOwnership(db: Db, contestId: string, windowId: string): Promise<Map<string, number>> {
  const es = await db.select({ id: s.entries.id }).from(s.entries).where(eq(s.entries.contestId, contestId));
  const counts = new Map<string, number>();
  let n = 0;
  for (const e of es) {
    const r = await currentRoster(db, e.id, windowId);
    if (!r) continue;
    n++;
    for (const p of r.playerIds) counts.set(p, (counts.get(p) ?? 0) + 1);
  }
  return new Map([...counts].map(([k, v]) => [k, n ? v / n : 0]));
}

// ─── Entry dashboard ───────────────────────────────────────────────────────────────────────

export type PlayerStatus =
  | { kind: "live"; matchId: string }
  | { kind: "next"; at: string; opponentId: string; postponed: boolean }
  | { kind: "done" }
  | { kind: "eliminated" }
  | { kind: "not_started" }
  | { kind: "did_not_play" };

export interface DashboardPlayer {
  id: string;
  nickname: string;
  role: string;
  teamId: string;
  price: number;
  isCaptain: boolean;
  multiplier: number;
  basePoints: number;
  points: number;
  status: PlayerStatus;
  events: Array<{
    kind: "series" | "advancement_credit";
    state: string;
    points: number;
    matchId: string | null;
    breakdown: SeriesBreakdown | AdvancementCreditLine;
    corrected: boolean;
  }>;
}

export interface DashboardWindow {
  id: string;
  position: number;
  stageId: string;
  stageName: string;
  status: string;
  lockAt: string;
  points: number;
  players: DashboardPlayer[];
  autopilotChanges: Array<{ outPlayerId: string | null; inPlayerId: string | null; reason: string }>;
  transfers: Array<{ outPlayerId: string | null; inPlayerId: string | null; kind: string }>;
  visible: boolean;
}

export interface EntryDashboard {
  tournament: TournamentSummary;
  contest: ContestView;
  rules: ContestRules;
  entry: {
    id: string;
    userId: string;
    username: string;
    displayName: string;
    avatarHue: number;
    autopilot: boolean;
    totalPoints: number;
    rank: number | null;
    previousRank: number | null;
    entriesCount: number;
    scoreState: string;
    transfersUsed: number;
  };
  windows: DashboardWindow[];
  teams: Record<string, TeamLite>;
  matches: MatchLite[];
  pendingMaps: number;
  lastUpdated: string | null;
  /** Wall-clock time of the request (ingestion timestamps are wall-clock, not demo-clock). */
  realNow: string;
  isOwner: boolean;
}

export async function entryDashboard(db: Db, entryId: string, viewerId: string | null, now: Date): Promise<EntryDashboard | null> {
  const [e] = await db.select().from(s.entries).where(eq(s.entries.id, entryId));
  if (!e) return null;
  const [u] = await db.select().from(s.users).where(eq(s.users.id, e.userId));
  const [c] = await db.select().from(s.contests).where(eq(s.contests.id, e.contestId));
  const [t] = await db.select().from(s.tournaments).where(eq(s.tournaments.id, c!.tournamentId));
  const [summary] = await tournamentSummaries(db, viewerId, { slug: t!.slug });
  const contest = summary!.contests.find((x) => x.id === c!.id)!;
  const isOwner = viewerId === e.userId;
  const windowRows = await db.select().from(s.contestWindows).where(eq(s.contestWindows.contestId, c!.id)).orderBy(asc(s.contestWindows.position));
  // Rules as they apply right now: the open window's overrides, if a window is open.
  const rules = windowRules(c!.rules as ContestRules, windowRows.find((w) => w.status === "open"));
  const stageIds = windowRows.map((w) => w.stageId);
  const matches = await matchesForStages(db, stageIds);
  const stageTeamRows = stageIds.length ? await db.select().from(s.stageTeams).where(inArray(s.stageTeams.stageId, stageIds)) : [];
  const events = stageIds.length
    ? await db
        .select()
        .from(s.scoringEvents)
        .where(and(eq(s.scoringEvents.ruleSetId, c!.ruleSetId), inArray(s.scoringEvents.stageId, stageIds), isNull(s.scoringEvents.supersededById)))
    : [];
  const correctedMatches = new Set(
    (
      await db
        .select({ matchId: s.maps.matchId })
        .from(s.scoreCorrections)
        .innerJoin(s.maps, eq(s.maps.id, s.scoreCorrections.mapId))
    ).map((r) => r.matchId),
  );
  const prices = await db.select().from(s.playerPrices).where(eq(s.playerPrices.contestId, c!.id));
  const scores = await db.select().from(s.entryWindowScores).where(eq(s.entryWindowScores.entryId, e.id));
  const transferRows = await db.select().from(s.transfers).where(eq(s.transfers.entryId, e.id)).orderBy(asc(s.transfers.createdAt));
  const teamIds = new Set<string>(stageTeamRows.map((x) => x.teamId));

  const windows: DashboardWindow[] = [];
  for (const w of windowRows) {
    const r = await currentRoster(db, e.id, w.id);
    // Rosters for an open window are private until it locks.
    const visible = isOwner || w.status === "locked" || w.status === "completed";
    if (!r) continue;
    const playerRows = r.playerIds.length ? await db.select().from(s.players).where(inArray(s.players.id, r.playerIds)) : [];
    const memberships = r.playerIds.length ? await db.select().from(s.playerTeamMemberships).where(inArray(s.playerTeamMemberships.playerId, r.playerIds)) : [];
    const stageMatches = matches.filter((m) => m.stageId === w.stageId);
    const players: DashboardPlayer[] = r.playerIds.map((pid) => {
      const p = playerRows.find((x) => x.id === pid)!;
      const teamId = memberships.find((m) => m.playerId === pid)?.teamId ?? "";
      teamIds.add(teamId);
      const isCaptain = r.version.captainPlayerId === pid;
      const multiplier = isCaptain ? rules.captainMultiplier : 1;
      const evs = events.filter((x) => x.stageId === w.stageId && x.playerId === pid);
      const base = evs.reduce((a, x) => a + x.points, 0);
      const st = stageTeamRows.find((x) => x.stageId === w.stageId && x.teamId === teamId);
      const teamMatches = stageMatches.filter((m) => m.teamAId === teamId || m.teamBId === teamId);
      const liveMatch = teamMatches.find((m) => m.status === "live");
      const upcoming = teamMatches.find((m) => m.status === "scheduled" || m.status === "postponed");
      let status: PlayerStatus;
      if (!st) status = { kind: "eliminated" };
      else if (liveMatch) status = { kind: "live", matchId: liveMatch.id };
      else if (upcoming) status = { kind: "next", at: upcoming.scheduledAt, opponentId: upcoming.teamAId === teamId ? upcoming.teamBId : upcoming.teamAId, postponed: upcoming.status === "postponed" };
      else if (st.status === "eliminated") status = { kind: "eliminated" };
      else if (teamMatches.length === 0) status = { kind: "not_started" };
      else status = { kind: "done" };
      // A player whose team played but who has no series events played no part: did not play.
      const played = teamMatches.filter((m) => m.status === "completed").length;
      if (played > 0 && evs.filter((x) => x.kind === "series").length === 0 && status.kind !== "live") status = { kind: "did_not_play" };
      return {
        id: pid,
        nickname: p.nickname,
        role: p.role,
        teamId,
        price: r.prices.get(pid) || (prices.find((x) => x.playerId === pid)?.price ?? 0),
        isCaptain,
        multiplier,
        basePoints: base,
        points: base * multiplier,
        status,
        events: evs
          .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
          .map((x) => ({
            kind: x.kind as "series" | "advancement_credit",
            state: x.state,
            points: x.points,
            matchId: x.matchId,
            breakdown: x.breakdown as SeriesBreakdown | AdvancementCreditLine,
            corrected: !!x.matchId && correctedMatches.has(x.matchId),
          })),
      };
    });
    // Stand-ins who played instead of a rostered player have events but aren't rostered: nothing to do.
    windows.push({
      id: w.id,
      position: w.position,
      stageId: w.stageId,
      stageName: summary!.stages.find((x) => x.id === w.stageId)?.name ?? "",
      status: w.status,
      lockAt: w.lockAt.toISOString(),
      points: scores.find((x) => x.windowId === w.id)?.points ?? 0,
      players: visible ? players : [],
      autopilotChanges: transferRows.filter((x) => x.windowId === w.id && x.kind === "autopilot").map((x) => ({ outPlayerId: x.outPlayerId, inPlayerId: x.inPlayerId, reason: x.reason })),
      transfers: transferRows.filter((x) => x.windowId === w.id && x.kind !== "autopilot").map((x) => ({ outPlayerId: x.outPlayerId, inPlayerId: x.inPlayerId, kind: x.kind })),
      visible,
    });
  }
  const teams = await teamsById(db, [...teamIds].filter(Boolean));
  const entriesCount = summary!.contests.find((x) => x.id === c!.id)?.entries ?? 0;
  const liveStageIds = windowRows.filter((w) => w.status === "locked").map((w) => w.stageId);
  const pendingMaps = matches.filter((m) => liveStageIds.includes(m.stageId) && m.status === "live").length;
  const [last] = await db.select({ at: s.ingestionRuns.finishedAt }).from(s.ingestionRuns).where(eq(s.ingestionRuns.status, "succeeded")).orderBy(desc(s.ingestionRuns.startedAt)).limit(1);
  void now;

  return {
    tournament: summary!,
    contest,
    rules,
    entry: {
      id: e.id,
      userId: e.userId,
      username: u!.username,
      displayName: u!.displayName,
      avatarHue: u!.avatarHue,
      autopilot: e.autopilot,
      totalPoints: e.totalPoints,
      rank: e.rank,
      previousRank: e.previousRank,
      entriesCount,
      scoreState: e.scoreState,
      transfersUsed: e.transfersUsed,
    },
    windows,
    teams: Object.fromEntries(teams),
    matches,
    pendingMaps,
    lastUpdated: last?.at?.toISOString() ?? null,
    realNow: new Date().toISOString(),
    isOwner,
  };
}

// ─── Player detail ─────────────────────────────────────────────────────────────────────────

export interface PlayerDetail {
  player: { id: string; nickname: string; firstName: string; lastName: string; nationality: string; role: string; teamId: string; isStandIn: boolean };
  team: TeamLite | null;
  price: number | null;
  avgPoints: number;
  consistency: number | null;
  recent: RecentMap[];
  teams: Record<string, TeamLite>;
  contestPoints: number | null;
  upcoming: { matchId: string; at: string; opponentId: string; format: number; stageName: string }[];
}

export async function playerDetail(db: Db, playerId: string, contestId: string | null, now: Date): Promise<PlayerDetail | null> {
  const [p] = await db.select().from(s.players).where(eq(s.players.id, playerId));
  if (!p) return null;
  const [mem] = await db.select().from(s.playerTeamMemberships).where(and(eq(s.playerTeamMemberships.playerId, playerId), isNull(s.playerTeamMemberships.validTo)));
  const teamId = mem?.teamId ?? "";
  let ruleSetId = "cs2-v2";
  let price: number | null = null;
  let contestPoints: number | null = null;
  let upcoming: PlayerDetail["upcoming"] = [];
  if (contestId) {
    const [c] = await db.select().from(s.contests).where(eq(s.contests.id, contestId));
    if (c) {
      ruleSetId = c.ruleSetId;
      const [pr] = await db.select().from(s.playerPrices).where(and(eq(s.playerPrices.contestId, c.id), eq(s.playerPrices.playerId, playerId)));
      price = pr?.price ?? null;
      const ws = await db.select().from(s.contestWindows).where(eq(s.contestWindows.contestId, c.id));
      const scoringStages = ws.filter((w) => w.status === "locked" || w.status === "completed").map((w) => w.stageId);
      if (scoringStages.length) {
        const ev = await db
          .select({ points: s.scoringEvents.points })
          .from(s.scoringEvents)
          .where(and(eq(s.scoringEvents.ruleSetId, c.ruleSetId), inArray(s.scoringEvents.stageId, scoringStages), isNull(s.scoringEvents.supersededById), eq(s.scoringEvents.playerId, playerId)));
        contestPoints = ev.reduce((a, x) => a + x.points, 0);
      }
      const stageRows = await db.select().from(s.stages).where(eq(s.stages.tournamentId, c.tournamentId));
      const ms = await matchesForStages(db, stageRows.map((x) => x.id));
      upcoming = ms
        .filter((m) => (m.teamAId === teamId || m.teamBId === teamId) && (m.status === "scheduled" || m.status === "postponed"))
        .slice(0, 3)
        .map((m) => ({
          matchId: m.id,
          at: m.scheduledAt,
          opponentId: m.teamAId === teamId ? m.teamBId : m.teamAId,
          format: m.format,
          stageName: stageRows.find((x) => x.id === m.stageId)?.name ?? "",
        }));
    }
  }
  const recent = (await recentMaps(db, [playerId], ruleSetById(ruleSetId), now, 10)).get(playerId) ?? [];
  const teams = await teamsById(db, [...new Set([teamId, ...recent.map((r) => r.opponentId), ...upcoming.map((u) => u.opponentId)])].filter(Boolean));
  return {
    player: { id: p.id, nickname: p.nickname, firstName: p.firstName, lastName: p.lastName, nationality: p.nationality, role: p.role, teamId, isStandIn: p.isStandIn },
    team: teams.get(teamId) ?? null,
    price,
    avgPoints: recent.length ? recent.reduce((a, r) => a + r.mapScore, 0) / recent.length : 0,
    consistency: recent.length ? recent.filter((r) => r.mapScore >= 25).length / recent.length : null,
    recent,
    teams: Object.fromEntries(teams),
    contestPoints,
    upcoming,
  };
}
