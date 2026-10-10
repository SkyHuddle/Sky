import { inArray } from "drizzle-orm";
import type { Db } from "../db/connect";
import * as s from "../db/schema";
import type { ProviderAdapter } from "../providers/types";
import { advanceContests, ensureContests } from "./contests";
import { ensureRuleSets, rescoreStage } from "./score";
import { recomputeContest } from "./standings";
import { syncProvider } from "./sync";

/**
 * The full scoring pipeline (docs/06), run whenever the clock moves or the provider has news:
 *   sync provider → rescore changed stages (ledger) → contest transitions → entry totals and ranks.
 * Safe to run any number of times: each step is idempotent.
 */
export interface PipelineResult {
  matchesChanged: number;
  corrections: number;
  invalidMatches: string[];
  stagesRescored: number;
  windowsOpened: number;
  windowsLocked: number;
  autopilotChanges: number;
  contestsSettled: number;
  contestsRecomputed: number;
}

export async function runPipeline(db: Db, provider: ProviderAdapter, now: Date): Promise<PipelineResult> {
  await ensureRuleSets(db);
  const sync = await syncProvider(db, provider, now);
  const created = await ensureContests(db);

  // Stages to rescore: anything the sync touched (a finished map or result changes the match hash),
  // plus every stage of newly created contests (their rule set may not have ledger rows yet).
  const stageIds = new Set(sync.changedStageIds);
  if (created.length) {
    const ws = await db.select({ stageId: s.contestWindows.stageId }).from(s.contestWindows).where(inArray(s.contestWindows.contestId, created));
    ws.forEach((w) => stageIds.add(w.stageId));
  }
  for (const id of stageIds) await rescoreStage(db, id);

  const adv = await advanceContests(db, now);

  // Recompute contests whose windows moved or whose stages were rescored.
  const contestIds = new Set(adv.touchedContests);
  if (stageIds.size) {
    const cs = await db
      .selectDistinct({ id: s.contestWindows.contestId })
      .from(s.contestWindows)
      .where(inArray(s.contestWindows.stageId, [...stageIds]));
    cs.forEach((c) => contestIds.add(c.id));
  }
  for (const id of contestIds) await recomputeContest(db, id);

  return {
    matchesChanged: sync.matchesChanged,
    corrections: sync.corrections,
    invalidMatches: sync.invalidMatches,
    stagesRescored: stageIds.size,
    windowsOpened: adv.opened.length,
    windowsLocked: adv.locked.length,
    autopilotChanges: adv.autopilotChanges,
    contestsSettled: adv.settled.length,
    contestsRecomputed: contestIds.size,
  };
}
