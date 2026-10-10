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
let inflight: Promise<void> | null = null;

export async function ensureFresh(db: Db, force = false): Promise<void> {
  if (inflight) return inflight;
  if (!force && Date.now() - lastRun < INTERVAL_MS) return;
  inflight = (async () => {
    try {
      await demoTick(db, await clockNow(db));
      lastRun = Date.now();
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
