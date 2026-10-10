import { now as clockNow } from "./clock";
import type { Db } from "./db/connect";
import { demoTick } from "./services/demo";

/**
 * Keeps data current without a separate worker process: page loads call ensureFresh(), which
 * runs the pipeline at most once a minute per server process. Locks never depend on this
 * (saveEntry checks the lock time itself); freshness only affects how soon results appear.
 * In production this would be a scheduled job; the pipeline is the same.
 */

const INTERVAL_MS = 60_000;
let lastRun = 0;
let version = 0;
let inflight: Promise<void> | null = null;

/** Increments after every pipeline run, so live streams know when to recompute (one ingestion, many viewers). */
export const pipelineVersion = () => version;

export async function ensureFresh(db: Db, force = false, minIntervalMs = INTERVAL_MS): Promise<void> {
  if (inflight) return inflight;
  if (!force && Date.now() - lastRun < minIntervalMs) return;
  inflight = (async () => {
    try {
      await demoTick(db, await clockNow(db));
      lastRun = Date.now();
      version++;
    } catch (err) {
      // Provider failures must not take the app down; the UI shows "stats delayed".
      console.error("[pipeline] tick failed", err);
      lastRun = Date.now();
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
