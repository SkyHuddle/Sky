import { and, asc, desc, eq, inArray, lte } from "drizzle-orm";
import { scoreMap, type Cs2ScoringRules } from "@/domain/scoring/cs2";
import type { Db } from "../db/connect";
import * as s from "../db/schema";

/** Shared read-model helpers for screens. Pure reads; no writes. */

export type TeamLite = { id: string; name: string; acronym: string; color: string; country: string; logoUrl?: string | null };

export async function teamsById(db: Db, ids?: string[]): Promise<Map<string, TeamLite>> {
  const rows = ids ? (ids.length ? await db.select().from(s.teams).where(inArray(s.teams.id, ids)) : []) : await db.select().from(s.teams);
  return new Map(rows.map((t) => [t.id, { id: t.id, name: t.name, acronym: t.acronym, color: t.color, country: t.country, logoUrl: t.logoUrl }]));
}

export interface RecentMap {
  mapId: string;
  matchId: string;
  tournamentName: string;
  mapName: string;
  opponentId: string;
  won: boolean;
  roundsFor: number;
  roundsAgainst: number;
  kills: number;
  deaths: number;
  assists: number;
  mapScore: number;
  finishedAt: string;
}

/** Recent finished maps for a set of players (current stats version), scored with the given rules. */
export async function recentMaps(db: Db, playerIds: string[], rules: Cs2ScoringRules, before: Date, limitPerPlayer = 10): Promise<Map<string, RecentMap[]>> {
  const out = new Map<string, RecentMap[]>();
  if (playerIds.length === 0) return out;
  const rows = await db
    .select({
      playerId: s.playerMapStats.playerId,
      teamId: s.playerMapStats.teamId,
      version: s.playerMapStats.statsVersion,
      mapVersion: s.maps.statsVersion,
      kills: s.playerMapStats.kills,
      deaths: s.playerMapStats.deaths,
      assists: s.playerMapStats.assists,
      openingKills: s.playerMapStats.openingKills,
      k3: s.playerMapStats.k3,
      k4: s.playerMapStats.k4,
      k5: s.playerMapStats.k5,
      c1: s.playerMapStats.c1,
      c2: s.playerMapStats.c2,
      c3: s.playerMapStats.c3,
      c4: s.playerMapStats.c4,
      c5: s.playerMapStats.c5,
      mapId: s.maps.id,
      number: s.maps.number,
      mapName: s.maps.mapName,
      roundsPlayed: s.maps.roundsPlayed,
      roundsA: s.maps.roundsA,
      roundsB: s.maps.roundsB,
      winner: s.maps.winnerTeamId,
      finishedAt: s.maps.finishedAt,
      matchId: s.matches.id,
      teamA: s.matches.teamAId,
      teamB: s.matches.teamBId,
      tournamentName: s.tournaments.shortName,
    })
    .from(s.playerMapStats)
    .innerJoin(s.maps, eq(s.maps.id, s.playerMapStats.mapId))
    .innerJoin(s.matches, eq(s.matches.id, s.maps.matchId))
    .innerJoin(s.stages, eq(s.stages.id, s.matches.stageId))
    .innerJoin(s.tournaments, eq(s.tournaments.id, s.stages.tournamentId))
    .where(and(inArray(s.playerMapStats.playerId, playerIds), lte(s.maps.finishedAt, before)))
    .orderBy(desc(s.maps.finishedAt));
  for (const r of rows) {
    if (r.version !== r.mapVersion) continue;
    const list = out.get(r.playerId) ?? [];
    if (list.length >= limitPerPlayer) continue;
    const ms = scoreMap(
      {
        playerId: r.playerId,
        teamId: r.teamId,
        kills: r.kills,
        deaths: r.deaths,
        assists: r.assists,
        openingKills: r.openingKills,
        multiKillRounds: { k3: r.k3, k4: r.k4, k5: r.k5 },
        clutchesWon: { v1: r.c1, v2: r.c2, v3: r.c3, v4: r.c4, v5: r.c5 },
      },
      { mapNumber: r.number, mapName: r.mapName, roundsPlayed: r.roundsPlayed, winnerTeamId: r.winner },
      rules,
    );
    const isA = r.teamId === r.teamA;
    list.push({
      mapId: r.mapId,
      matchId: r.matchId,
      tournamentName: r.tournamentName,
      mapName: r.mapName,
      opponentId: isA ? r.teamB : r.teamA,
      won: r.winner === r.teamId,
      roundsFor: isA ? r.roundsA : r.roundsB,
      roundsAgainst: isA ? r.roundsB : r.roundsA,
      kills: r.kills,
      deaths: r.deaths,
      assists: r.assists,
      mapScore: ms.mapScore,
      finishedAt: r.finishedAt.toISOString(),
    });
    out.set(r.playerId, list);
  }
  return out;
}

export interface MatchLite {
  id: string;
  stageId: string;
  round: number;
  slot: string;
  format: number;
  status: string;
  scheduledAt: string;
  originalScheduledAt: string | null;
  teamAId: string;
  teamBId: string;
  winnerTeamId: string | null;
  mapsA: number;
  mapsB: number;
  maps: { number: number; mapName: string; roundsA: number; roundsB: number; winnerTeamId: string }[];
}

export async function matchesForStages(db: Db, stageIds: string[]): Promise<MatchLite[]> {
  if (stageIds.length === 0) return [];
  const ms = await db.select().from(s.matches).where(inArray(s.matches.stageId, stageIds)).orderBy(asc(s.matches.scheduledAt), asc(s.matches.id));
  const mapRows = ms.length ? await db.select().from(s.maps).where(inArray(s.maps.matchId, ms.map((m) => m.id))) : [];
  return ms.map((m) => {
    const maps = mapRows
      .filter((g) => g.matchId === m.id)
      .sort((a, b) => a.number - b.number)
      .map((g) => ({ number: g.number, mapName: g.mapName, roundsA: g.roundsA, roundsB: g.roundsB, winnerTeamId: g.winnerTeamId }));
    return {
      id: m.id,
      stageId: m.stageId,
      round: m.round,
      slot: m.slot,
      format: m.format,
      status: m.status,
      scheduledAt: m.scheduledAt.toISOString(),
      originalScheduledAt: m.originalScheduledAt?.toISOString() ?? null,
      teamAId: m.teamAId,
      teamBId: m.teamBId,
      winnerTeamId: m.winnerTeamId,
      mapsA: maps.filter((g) => g.winnerTeamId === m.teamAId).length,
      mapsB: maps.filter((g) => g.winnerTeamId === m.teamBId).length,
      maps,
    };
  });
}

export async function latestPipelineRun(db: Db): Promise<{ at: string | null; ok: boolean }> {
  const [r] = await db.select().from(s.ingestionRuns).orderBy(desc(s.ingestionRuns.startedAt)).limit(1);
  return { at: r?.finishedAt?.toISOString() ?? r?.startedAt.toISOString() ?? null, ok: r ? r.status !== "failed" : true };
}
