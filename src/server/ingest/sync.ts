import { and, eq, inArray } from "drizzle-orm";
import type { Db } from "../db/connect";
import * as s from "../db/schema";
import { newId, stableHash } from "../ids";
import type { NormMatch, NormTournament, ProviderAdapter } from "../providers/types";
import { validateMatch } from "./validate";

/**
 * Step 1–3 of the scoring architecture (docs/06): ingest → validate → normalise into our tables.
 * Idempotent: every match is compared by payload hash; unchanged data is skipped; a higher
 * stats version inserts new player_map_stats rows (old versions are kept) and logs a correction.
 */

export interface SyncSummary {
  tournaments: number;
  matchesChanged: number;
  mapsInserted: number;
  corrections: number;
  invalidMatches: string[];
  changedStageIds: string[];
}

/** Internal ids: the demo provider's ids are already namespaced; others get a provider prefix. */
export function internalId(provider: string, externalId: string): string {
  return provider === "demo" ? externalId : `${provider}-${externalId}`;
}

export async function syncProvider(db: Db, provider: ProviderAdapter, now: Date): Promise<SyncSummary> {
  const runId = newId();
  await db.insert(s.ingestionRuns).values({ id: runId, provider: provider.key, startedAt: new Date(), status: "running" });
  try {
    const tournaments = await provider.fetchTournaments(now);
    const summary: SyncSummary = {
      tournaments: tournaments.length,
      matchesChanged: 0,
      mapsInserted: 0,
      corrections: 0,
      invalidMatches: [],
      changedStageIds: [],
    };
    for (const t of tournaments) await syncTournament(db, provider, t, summary);
    await db
      .update(s.ingestionRuns)
      .set({ status: "succeeded", finishedAt: new Date(), summary })
      .where(eq(s.ingestionRuns.id, runId));
    return summary;
  } catch (err) {
    await db
      .update(s.ingestionRuns)
      .set({ status: "failed", finishedAt: new Date(), error: String(err) })
      .where(eq(s.ingestionRuns.id, runId));
    throw err;
  }
}

async function upsertExternal(db: Db, provider: string, entityType: string, externalId: string) {
  const id = internalId(provider, externalId);
  await db
    .insert(s.externalIds)
    .values({ provider, entityType, externalId, internalId: id })
    .onConflictDoNothing();
  return id;
}

async function syncTournament(db: Db, provider: ProviderAdapter, t: NormTournament, summary: SyncSummary) {
  const P = provider.key;
  await db.insert(s.games).values({ id: t.game, name: "Counter-Strike 2", shortName: "CS2", enabled: true }).onConflictDoNothing();

  // Teams and players (reference data: upsert every sync; cheap and keeps names current).
  for (const team of t.teams) {
    const id = await upsertExternal(db, P, "team", team.externalId);
    await db
      .insert(s.teams)
      .values({ id, gameId: t.game, name: team.name, acronym: team.acronym, color: team.color, country: team.country })
      .onConflictDoUpdate({ target: s.teams.id, set: { name: team.name, acronym: team.acronym, color: team.color, country: team.country } });
  }
  for (const p of t.players) {
    const id = await upsertExternal(db, P, "player", p.externalId);
    const teamId = internalId(P, p.teamExternalId);
    await db
      .insert(s.players)
      .values({ id, gameId: t.game, nickname: p.nickname, firstName: p.firstName, lastName: p.lastName, nationality: p.nationality, role: p.role, isStandIn: p.isStandIn })
      .onConflictDoUpdate({ target: s.players.id, set: { nickname: p.nickname, role: p.role, isStandIn: p.isStandIn } });
    await db
      .insert(s.playerTeamMemberships)
      .values({ playerId: id, teamId, validFrom: new Date(0) })
      .onConflictDoNothing();
  }

  const tid = await upsertExternal(db, P, "tournament", t.externalId);
  await db
    .insert(s.tournaments)
    .values({
      id: tid,
      gameId: t.game,
      slug: t.slug,
      name: t.name,
      shortName: t.shortName,
      tier: t.tier,
      location: t.location,
      beginAt: t.beginAt,
      endAt: t.endAt,
      provider: P,
      isDemo: provider.isDemo,
    })
    .onConflictDoUpdate({ target: s.tournaments.id, set: { name: t.name, beginAt: t.beginAt, endAt: t.endAt } });

  for (const st of t.stages) {
    const sid = await upsertExternal(db, P, "stage", st.externalId);
    await db
      .insert(s.stages)
      .values({
        id: sid,
        tournamentId: tid,
        name: st.name,
        kind: st.kind,
        position: st.position,
        beginAt: st.beginAt,
        endAt: st.endAt,
        winsToAdvance: st.winsToAdvance,
        lossesToEliminate: st.lossesToEliminate,
      })
      .onConflictDoUpdate({ target: s.stages.id, set: { beginAt: st.beginAt, endAt: st.endAt } });
    const existing = await db.select({ teamId: s.stageTeams.teamId }).from(s.stageTeams).where(eq(s.stageTeams.stageId, sid));
    const have = new Set(existing.map((e) => e.teamId));
    const toAdd = st.teamExternalIds
      .map((ext, i) => ({ teamId: internalId(P, ext), seed: i + 1, entering: st.enteringTeamExternalIds.includes(ext) }))
      .filter((x) => !have.has(x.teamId));
    if (toAdd.length > 0) {
      await db.insert(s.stageTeams).values(toAdd.map((x) => ({ stageId: sid, ...x })));
      summary.changedStageIds.push(sid);
    }
  }

  // Matches: only touch rows whose payload changed.
  const matchIds = t.matches.map((m) => internalId(P, m.externalId));
  const known = matchIds.length
    ? await db.select({ id: s.matches.id, hash: s.matches.payloadHash }).from(s.matches).where(inArray(s.matches.id, matchIds))
    : [];
  const hashes = new Map(known.map((k) => [k.id, k.hash]));
  for (const m of t.matches) {
    const id = internalId(P, m.externalId);
    const hash = stableHash(m);
    if (hashes.get(id) === hash) continue;
    const problems = validateMatch(m);
    if (problems.length > 0) {
      summary.invalidMatches.push(`${id}: ${problems.join("; ")}`);
      await db.insert(s.adminAuditLog).values({
        id: newId(),
        actor: "system",
        action: "ingestion.validation_failed",
        targetType: "match",
        targetId: id,
        reason: problems.join("; "),
      });
      continue; // keep the last valid version; an admin task is created via the audit log
    }
    await db.insert(s.providerRecords).values({ provider: P, entityType: "match", externalId: m.externalId, payloadHash: hash, payload: m }).onConflictDoNothing();
    await upsertMatch(db, P, id, m, summary);
    summary.matchesChanged++;
    summary.changedStageIds.push(internalId(P, m.stageExternalId));
  }
  summary.changedStageIds = [...new Set(summary.changedStageIds)];
}

async function upsertMatch(db: Db, P: string, id: string, m: NormMatch, summary: SyncSummary) {
  await upsertExternal(db, P, "match", m.externalId);
  const row = {
    id,
    stageId: internalId(P, m.stageExternalId),
    round: m.round,
    slot: m.slot,
    format: m.format,
    scheduledAt: m.scheduledAt,
    originalScheduledAt: m.originalScheduledAt,
    status: m.status,
    teamAId: internalId(P, m.teamAExternalId),
    teamBId: internalId(P, m.teamBExternalId),
    winnerTeamId: m.winnerTeamExternalId ? internalId(P, m.winnerTeamExternalId) : null,
    payloadHash: stableHash(m),
    updatedAt: new Date(),
  };
  await db.insert(s.matches).values(row).onConflictDoUpdate({ target: s.matches.id, set: row });

  for (const g of m.maps) {
    const mapId = internalId(P, g.externalId);
    const [existing] = await db.select().from(s.maps).where(eq(s.maps.id, mapId));
    const mapRow = {
      id: mapId,
      matchId: id,
      number: g.number,
      mapName: g.mapName,
      roundsPlayed: g.roundsPlayed,
      roundsA: g.roundsByTeam[m.teamAExternalId] ?? 0,
      roundsB: g.roundsByTeam[m.teamBExternalId] ?? 0,
      winnerTeamId: internalId(P, g.winnerTeamExternalId),
      finishedAt: g.finishedAt,
      statsVersion: g.statsVersion,
    };
    if (existing && existing.statsVersion >= g.statsVersion) continue;
    const statRows = g.stats.map((x) => ({
      mapId,
      playerId: internalId(P, x.playerId),
      statsVersion: g.statsVersion,
      teamId: internalId(P, x.teamId),
      kills: x.kills,
      deaths: x.deaths,
      assists: x.assists,
      openingKills: x.openingKills,
      k3: x.multiKillRounds.k3,
      k4: x.multiKillRounds.k4,
      k5: x.multiKillRounds.k5,
      c1: x.clutchesWon.v1,
      c2: x.clutchesWon.v2,
      c3: x.clutchesWon.v3,
      c4: x.clutchesWon.v4,
      c5: x.clutchesWon.v5,
    }));
    if (!existing) {
      await db.insert(s.maps).values(mapRow);
      summary.mapsInserted++;
    } else {
      // A correction: record exactly what changed, keep the old version.
      const old = await db
        .select()
        .from(s.playerMapStats)
        .where(and(eq(s.playerMapStats.mapId, mapId), eq(s.playerMapStats.statsVersion, existing.statsVersion)));
      const changes = statRows.flatMap((n) => {
        const o = old.find((r) => r.playerId === n.playerId);
        if (!o) return [{ playerId: n.playerId, field: "added" }];
        const fields = (["kills", "deaths", "assists", "openingKills", "k3", "k4", "k5", "c1", "c2", "c3", "c4", "c5"] as const).filter(
          (f) => o[f] !== n[f],
        );
        return fields.map((f) => ({ playerId: n.playerId, field: f, from: o[f], to: n[f] }));
      });
      await db.insert(s.scoreCorrections).values({
        id: newId(),
        mapId,
        fromVersion: existing.statsVersion,
        toVersion: g.statsVersion,
        changes,
      });
      await db.update(s.maps).set({ statsVersion: g.statsVersion }).where(eq(s.maps.id, mapId));
      summary.corrections++;
    }
    if (statRows.length > 0) await db.insert(s.playerMapStats).values(statRows).onConflictDoNothing();
  }
}
