import { and, eq, inArray, isNull } from "drizzle-orm";
import { scoreEntry, type WindowRoster } from "@/domain/entryScoring";
import { rankEntries } from "@/domain/standings";
import type { ContestRules } from "@/domain/types";
import type { Db } from "../db/connect";
import * as s from "../db/schema";
import { newId } from "../ids";
import { stagePlayerPoints } from "./score";

/**
 * Steps 6–7 of the scoring architecture: entry totals from the ledger and locked rosters,
 * then ranks with the documented tiebreaks. Deterministic: running it twice changes nothing.
 */
export async function recomputeContest(db: Db, contestId: string): Promise<{ entries: number; changed: boolean }> {
  const [c] = await db.select().from(s.contests).where(eq(s.contests.id, contestId));
  if (!c) return { entries: 0, changed: false };
  const rules = c.rules as ContestRules;
  const windows = await db.select().from(s.contestWindows).where(eq(s.contestWindows.contestId, contestId));
  const scoring = windows.filter((w) => w.status === "locked" || w.status === "completed");
  const points = await stagePlayerPoints(db, c.ruleSetId, scoring.map((w) => w.stageId));
  const es = await db.select().from(s.entries).where(eq(s.entries.contestId, contestId));
  if (es.length === 0) return { entries: 0, changed: false };

  // Latest roster per (entry, window) in one query.
  const versions = scoring.length
    ? await db
        .select()
        .from(s.rosterVersions)
        .where(and(inArray(s.rosterVersions.entryId, es.map((e) => e.id)), inArray(s.rosterVersions.windowId, scoring.map((w) => w.id))))
    : [];
  const latest = new Map<string, typeof s.rosterVersions.$inferSelect>();
  for (const v of versions) {
    const key = `${v.entryId}|${v.windowId}`;
    const cur = latest.get(key);
    if (!cur || v.version > cur.version) latest.set(key, v);
  }
  const selections = latest.size
    ? await db.select().from(s.rosterSelections).where(inArray(s.rosterSelections.rosterVersionId, [...latest.values()].map((v) => v.id)))
    : [];
  const playersOf = new Map<string, string[]>();
  for (const sel of selections) playersOf.set(sel.rosterVersionId, [...(playersOf.get(sel.rosterVersionId) ?? []), sel.playerId]);

  const transferRows = await db
    .select({ entryId: s.transfers.entryId })
    .from(s.transfers)
    .where(and(inArray(s.transfers.entryId, es.map((e) => e.id)), eq(s.transfers.kind, "discretionary")));
  const transfersUsed = new Map<string, number>();
  for (const t of transferRows) transfersUsed.set(t.entryId, (transfersUsed.get(t.entryId) ?? 0) + 1);

  const provisional = await db
    .select({ id: s.scoringEvents.id })
    .from(s.scoringEvents)
    .where(
      and(
        eq(s.scoringEvents.ruleSetId, c.ruleSetId),
        inArray(s.scoringEvents.stageId, scoring.length ? scoring.map((w) => w.stageId) : ["-"]),
        isNull(s.scoringEvents.supersededById),
        eq(s.scoringEvents.state, "provisional"),
      ),
    )
    .limit(1);
  const state = c.settledAt ? "settled" : provisional.length ? "provisional" : "official";

  const results = es.map((e) => {
    const rosters: WindowRoster[] = scoring
      .map((w) => {
        const v = latest.get(`${e.id}|${w.id}`);
        return v ? { windowId: w.id, stageId: w.stageId, playerIds: playersOf.get(v.id) ?? [], captainId: v.captainPlayerId } : null;
      })
      .filter((x): x is WindowRoster => x !== null);
    return { entry: e, score: scoreEntry(rosters, points, rules.captainMultiplier) };
  });

  const ranked = rankEntries(
    results.map((r) => ({
      entryId: r.entry.id,
      total: r.score.total,
      captainPoints: r.score.captainPoints,
      transfersUsed: transfersUsed.get(r.entry.id) ?? 0,
      submittedAt: r.entry.submittedAt.getTime(),
    })),
  );
  const rankOf = new Map(ranked.map((r) => [r.entryId, r.rank]));

  let changed = false;
  for (const r of results) {
    const e = r.entry;
    const rank = scoring.length ? rankOf.get(e.id)! : null;
    const total = r.score.total;
    const tu = transfersUsed.get(e.id) ?? 0;
    const same =
      Math.abs(e.totalPoints - total) < 1e-9 && e.rank === rank && e.transfersUsed === tu && e.scoreState === state && Math.abs(e.captainPoints - r.score.captainPoints) < 1e-9;
    if (same) continue;
    changed = true;
    await db
      .update(s.entries)
      .set({
        totalPoints: total,
        captainPoints: r.score.captainPoints,
        transfersUsed: tu,
        rank,
        // Movement is measured against the rank before this scoring batch.
        previousRank: e.rank !== rank ? e.rank : e.previousRank,
        scoreState: state,
      })
      .where(eq(s.entries.id, e.id));
    for (const [windowId, pts] of r.score.byWindow) {
      const cap = r.score.lines.filter((l) => l.windowId === windowId && l.isCaptain).reduce((a, l) => a + l.points, 0);
      await db
        .insert(s.entryWindowScores)
        .values({ entryId: e.id, windowId, points: pts, captainPoints: cap })
        .onConflictDoUpdate({ target: [s.entryWindowScores.entryId, s.entryWindowScores.windowId], set: { points: pts, captainPoints: cap, updatedAt: new Date() } });
    }
  }

  const needFinal = !!c.settledAt && (await db.select({ id: s.standingsSnapshots.entryId }).from(s.standingsSnapshots).where(and(eq(s.standingsSnapshots.contestId, contestId), eq(s.standingsSnapshots.isFinal, true))).limit(1)).length === 0;
  if ((changed || needFinal) && scoring.length) {
    const batchId = needFinal ? `final-${newId()}` : newId();
    await db.insert(s.standingsSnapshots).values(
      ranked.map((r) => ({ contestId, batchId, entryId: r.entryId, rank: r.rank, points: r.total, entriesCount: ranked.length, isFinal: needFinal })),
    );
  }
  return { entries: es.length, changed };
}
