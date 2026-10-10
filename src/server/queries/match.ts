import { and, eq, inArray } from "drizzle-orm";
import { CS2_DEFAULT_RULES, scoreMap, type Cs2PlayerMapStats } from "@/domain/scoring/cs2";
import type { Db } from "../db/connect";
import * as s from "../db/schema";
import { ruleSetById } from "../ingest/score";
import { teamsById, type TeamLite } from "./common";
import { liveEntryFor } from "./live";

export interface ScoreLine {
  playerId: string;
  nickname: string;
  teamId: string;
  kills: number;
  deaths: number;
  assists: number;
  /** Fantasy points for this map under the contest's rules (provisional while the map is live). */
  mapPoints: number;
  mine: boolean;
}

export interface MatchCenter {
  id: string;
  tournament: { name: string; slug: string; isDemo: boolean };
  stageName: string;
  format: number;
  status: string;
  scheduledAt: string;
  teamA: TeamLite;
  teamB: TeamLite;
  mapsA: number;
  mapsB: number;
  maps: Array<{ number: number; mapName: string; roundsA: number; roundsB: number; winnerTeamId: string; lines: ScoreLine[] }>;
  live: null | { number: number; mapName: string; roundsA: number; roundsB: number; providerUpdatedAt: string; lines: ScoreLine[] };
  /** The ruleset used for the fantasy column. */
  ruleSetId: string;
  asOf: string;
}

/**
 * A single series: maps, the current scoreboard and fantasy contributions (yours highlighted).
 * Only what the provider supplies: a scoreboard snapshot, not round-by-round play.
 */
export async function matchCenter(db: Db, matchId: string, viewerId: string | null, now: Date): Promise<MatchCenter | null> {
  const [m] = await db.select().from(s.matches).where(eq(s.matches.id, matchId));
  if (!m) return null;
  const [stage] = await db.select().from(s.stages).where(eq(s.stages.id, m.stageId));
  const [t] = await db.select().from(s.tournaments).where(eq(s.tournaments.id, stage!.tournamentId));
  const teams = await teamsById(db, [m.teamAId, m.teamBId]);

  // Fantasy column uses the viewer's contest rules when they have an entry in this event.
  let ruleSetId = CS2_DEFAULT_RULES.id;
  let mine = new Set<string>();
  if (viewerId) {
    const entryId = await liveEntryFor(db, viewerId);
    if (entryId) {
      const [e] = await db.select().from(s.entries).where(eq(s.entries.id, entryId));
      const [c] = e ? await db.select().from(s.contests).where(eq(s.contests.id, e.contestId)) : [];
      if (c && c.tournamentId === t!.id) {
        ruleSetId = c.ruleSetId;
        const ws = await db.select().from(s.contestWindows).where(eq(s.contestWindows.contestId, c.id));
        const w = ws.find((x) => x.stageId === m.stageId);
        if (w) {
          const vs = await db.select().from(s.rosterVersions).where(and(eq(s.rosterVersions.entryId, e!.id), eq(s.rosterVersions.windowId, w.id)));
          const latest = vs.sort((a, b) => b.version - a.version)[0];
          if (latest) mine = new Set((await db.select().from(s.rosterSelections).where(eq(s.rosterSelections.rosterVersionId, latest.id))).map((x) => x.playerId));
        }
      }
    }
  }
  const rules = ruleSetById(ruleSetId);

  const mapRows = (await db.select().from(s.maps).where(eq(s.maps.matchId, m.id))).sort((a, b) => a.number - b.number);
  const stats = mapRows.length ? await db.select().from(s.playerMapStats).where(inArray(s.playerMapStats.mapId, mapRows.map((x) => x.id))) : [];
  const [lm] = await db.select().from(s.liveMaps).where(eq(s.liveMaps.matchId, m.id));
  const playerIds = new Set<string>([...stats.map((x) => x.playerId), ...((lm?.stats as Cs2PlayerMapStats[] | undefined) ?? []).map((x) => x.playerId)]);
  const names = playerIds.size ? await db.select({ id: s.players.id, nickname: s.players.nickname }).from(s.players).where(inArray(s.players.id, [...playerIds])) : [];
  const nick = new Map(names.map((p) => [p.id, p.nickname]));

  const line = (x: Cs2PlayerMapStats, map: { number: number; mapName: string; roundsPlayed: number; winnerTeamId: string }): ScoreLine => ({
    playerId: x.playerId,
    nickname: nick.get(x.playerId) ?? x.playerId,
    teamId: x.teamId,
    kills: x.kills,
    deaths: x.deaths,
    assists: x.assists,
    mapPoints: scoreMap(x, { mapNumber: map.number, mapName: map.mapName, roundsPlayed: map.roundsPlayed, winnerTeamId: map.winnerTeamId }, rules).mapScore,
    mine: mine.has(x.playerId),
  });
  const sortLines = (ls: ScoreLine[]) => ls.sort((a, b) => (a.teamId === b.teamId ? b.kills - a.kills : a.teamId === m.teamAId ? -1 : 1));

  const maps = mapRows.map((g) => ({
    number: g.number,
    mapName: g.mapName,
    roundsA: g.roundsA,
    roundsB: g.roundsB,
    winnerTeamId: g.winnerTeamId,
    lines: sortLines(
      stats
        .filter((x) => x.mapId === g.id && x.statsVersion === g.statsVersion)
        .map((x) =>
          line(
            { playerId: x.playerId, teamId: x.teamId, kills: x.kills, deaths: x.deaths, assists: x.assists, openingKills: x.openingKills, multiKillRounds: { k3: x.k3, k4: x.k4, k5: x.k5 }, clutchesWon: { v1: x.c1, v2: x.c2, v3: x.c3, v4: x.c4, v5: x.c5 } },
            { number: g.number, mapName: g.mapName, roundsPlayed: g.roundsPlayed, winnerTeamId: g.winnerTeamId },
          ),
        ),
    ),
  }));

  return {
    id: m.id,
    tournament: { name: t!.name.replace(" (Demo)", ""), slug: t!.slug, isDemo: t!.isDemo },
    stageName: stage!.name,
    format: m.format,
    status: m.status,
    scheduledAt: m.scheduledAt.toISOString(),
    teamA: teams.get(m.teamAId)!,
    teamB: teams.get(m.teamBId)!,
    mapsA: mapRows.filter((g) => g.winnerTeamId === m.teamAId).length,
    mapsB: mapRows.filter((g) => g.winnerTeamId === m.teamBId).length,
    maps,
    live:
      lm && m.status === "live"
        ? {
            number: lm.number,
            mapName: lm.mapName,
            roundsA: lm.roundsA,
            roundsB: lm.roundsB,
            providerUpdatedAt: lm.providerUpdatedAt.toISOString(),
            lines: sortLines((lm.stats as Cs2PlayerMapStats[]).map((x) => line(x, { number: lm.number, mapName: lm.mapName, roundsPlayed: lm.roundsA + lm.roundsB, winnerTeamId: "" }))),
          }
        : null,
    ruleSetId,
    asOf: now.toISOString(),
  };
}

