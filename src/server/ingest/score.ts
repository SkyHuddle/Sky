import { and, eq, inArray, isNull } from "drizzle-orm";
import { CS2_RULE_SETS, type Cs2MapResult, type Cs2ScoringRules } from "@/domain/scoring/cs2";
import { scoreStage, type StageSeriesInput } from "@/domain/scoring/stage";
import type { MatchStatus, SeriesFormat } from "@/domain/types";
import type { Db } from "../db/connect";
import * as s from "../db/schema";
import { newId, stableHash } from "../ids";

/**
 * Steps 4–5 of the scoring architecture: apply scoring rules to stored stats and write the ledger.
 * Ledger writes are idempotent (input hash) and append-only (corrections supersede, never overwrite).
 */

export function ruleSetById(id: string): Cs2ScoringRules {
  const r = CS2_RULE_SETS[id];
  if (!r) throw new Error(`Unknown scoring rule set ${id}`);
  return r;
}

export async function ensureRuleSets(db: Db): Promise<void> {
  await db.insert(s.games).values({ id: "cs2", name: "Counter-Strike 2", shortName: "CS2", enabled: true }).onConflictDoNothing();
  for (const r of Object.values(CS2_RULE_SETS)) {
    await db.insert(s.scoringRuleSets).values({ id: r.id, gameId: "cs2", config: r }).onConflictDoNothing();
  }
}

/** Loads the current (latest version) stats for every map of a stage, as scoring inputs. */
export async function loadStageSeries(db: Db, stageId: string): Promise<StageSeriesInput[]> {
  const ms = await db.select().from(s.matches).where(eq(s.matches.stageId, stageId));
  if (ms.length === 0) return [];
  const mapRows = await db.select().from(s.maps).where(inArray(s.maps.matchId, ms.map((m) => m.id)));
  const stats = mapRows.length
    ? await db.select().from(s.playerMapStats).where(inArray(s.playerMapStats.mapId, mapRows.map((m) => m.id)))
    : [];
  return ms.map((m) => {
    const maps: Cs2MapResult[] = mapRows
      .filter((g) => g.matchId === m.id)
      .sort((a, b) => a.number - b.number)
      .map((g) => ({
        mapNumber: g.number,
        mapName: g.mapName,
        roundsPlayed: g.roundsPlayed,
        winnerTeamId: g.winnerTeamId,
        players: stats
          .filter((x) => x.mapId === g.id && x.statsVersion === g.statsVersion)
          .map((x) => ({
            playerId: x.playerId,
            teamId: x.teamId,
            kills: x.kills,
            deaths: x.deaths,
            assists: x.assists,
            openingKills: x.openingKills,
            multiKillRounds: { k3: x.k3, k4: x.k4, k5: x.k5 },
            clutchesWon: { v1: x.c1, v2: x.c2, v3: x.c3, v4: x.c4, v5: x.c5 },
          })),
      }));
    return {
      matchId: m.id,
      status: m.status as MatchStatus,
      format: m.format as SeriesFormat,
      teamA: m.teamAId,
      teamB: m.teamBId,
      winner: m.winnerTeamId,
      scheduledAt: m.scheduledAt.getTime(),
      maps,
    };
  });
}

/** Rule sets pinned by any contest that includes this stage. */
async function ruleSetsForStage(db: Db, stageId: string): Promise<string[]> {
  const rows = await db
    .selectDistinct({ id: s.contests.ruleSetId })
    .from(s.contestWindows)
    .innerJoin(s.contests, eq(s.contests.id, s.contestWindows.contestId))
    .where(eq(s.contestWindows.stageId, stageId));
  return rows.map((r) => r.id);
}

export interface RescoreResult {
  stageId: string;
  inserted: number;
  superseded: number;
  complete: boolean;
}

export async function rescoreStage(db: Db, stageId: string): Promise<RescoreResult> {
  const [stage] = await db.select().from(s.stages).where(eq(s.stages.id, stageId));
  if (!stage) throw new Error(`stage ${stageId} not found`);
  const teamsInStage = await db.select().from(s.stageTeams).where(eq(s.stageTeams.stageId, stageId));
  const series = await loadStageSeries(db, stageId);
  const def = {
    kind: stage.kind as "swiss" | "single_elimination",
    winsToAdvance: stage.winsToAdvance,
    lossesToEliminate: stage.lossesToEliminate,
    teamIds: teamsInStage.map((t) => t.teamId),
  };

  // Records and stage status don't depend on the rule set: compute once with any rule set.
  const ruleSetIds = await ruleSetsForStage(db, stageId);
  const anyRules = ruleSetById(ruleSetIds[0] ?? "cs2-v2");
  const base = scoreStage(def, series, anyRules);
  for (const r of base.records.values()) {
    await db
      .update(s.stageTeams)
      .set({ wins: r.wins, losses: r.losses, status: r.status })
      .where(and(eq(s.stageTeams.stageId, stageId), eq(s.stageTeams.teamId, r.teamId)));
  }
  const started = series.some((x) => x.status !== "scheduled" && x.status !== "postponed");
  const status = base.complete && teamsInStage.length > 0 ? "completed" : started ? "live" : "upcoming";
  if (status !== stage.status) await db.update(s.stages).set({ status }).where(eq(s.stages.id, stageId));

  let inserted = 0;
  let superseded = 0;
  for (const ruleSetId of ruleSetIds) {
    const result = scoreStage(def, series, ruleSetById(ruleSetId));
    const statusOf = new Map(series.map((x) => [x.matchId, x.status]));
    type Row = typeof s.scoringEvents.$inferInsert;
    const desired = new Map<string, Row>();
    for (const b of result.series) {
      const provisional = result.provisionalMatchIds.has(b.matchId) || statusOf.get(b.matchId) !== "completed";
      const key = `series|${b.matchId}|${b.playerId}`;
      desired.set(key, {
        id: newId(),
        ruleSetId,
        stageId,
        matchId: b.matchId,
        playerId: b.playerId,
        teamId: b.teamId,
        kind: "series",
        points: b.total,
        breakdown: b,
        inputHash: stableHash(b),
        state: provisional ? "provisional" : "official",
      });
    }
    for (const c of result.credits) {
      desired.set(`advancement_credit||${c.playerId}`, {
        id: newId(),
        ruleSetId,
        stageId,
        matchId: null,
        playerId: c.playerId,
        teamId: c.teamId,
        kind: "advancement_credit",
        points: c.points,
        breakdown: c,
        inputHash: stableHash(c),
        state: "official",
      });
    }

    const current = await db
      .select()
      .from(s.scoringEvents)
      .where(and(eq(s.scoringEvents.ruleSetId, ruleSetId), eq(s.scoringEvents.stageId, stageId), isNull(s.scoringEvents.supersededById)));
    const currentByKey = new Map(current.map((e) => [`${e.kind}|${e.matchId ?? ""}|${e.playerId}`, e]));
    const now = new Date();

    for (const [key, row] of desired) {
      const old = currentByKey.get(key);
      if (old && old.inputHash === row.inputHash && (old.state === row.state || old.state === "settled")) continue; // idempotent
      if (old) {
        // Supersede first so the "one current row" unique index is never violated.
        await db.update(s.scoringEvents).set({ supersededById: row.id, supersededAt: now }).where(eq(s.scoringEvents.id, old.id));
        superseded++;
      }
      await db.insert(s.scoringEvents).values(row);
      inserted++;
    }
    for (const [key, old] of currentByKey) {
      if (desired.has(key)) continue;
      await db.update(s.scoringEvents).set({ supersededById: "removed", supersededAt: now }).where(eq(s.scoringEvents.id, old.id));
      superseded++;
    }
  }
  return { stageId, inserted, superseded, complete: base.complete };
}

/** stageId -> playerId -> current points under a rule set. */
export async function stagePlayerPoints(
  db: Db,
  ruleSetId: string,
  stageIds: string[],
): Promise<Map<string, Map<string, number>>> {
  const out = new Map<string, Map<string, number>>();
  if (stageIds.length === 0) return out;
  const rows = await db
    .select({ stageId: s.scoringEvents.stageId, playerId: s.scoringEvents.playerId, points: s.scoringEvents.points })
    .from(s.scoringEvents)
    .where(and(eq(s.scoringEvents.ruleSetId, ruleSetId), inArray(s.scoringEvents.stageId, stageIds), isNull(s.scoringEvents.supersededById)));
  for (const r of rows) {
    const m = out.get(r.stageId) ?? new Map<string, number>();
    m.set(r.playerId, (m.get(r.playerId) ?? 0) + r.points);
    out.set(r.stageId, m);
  }
  return out;
}
