import "server-only";
import { cache } from "react";
import { isDemoMode, now as clockNow } from "./clock";
import { getDb } from "./db/client";
import { ensureFresh } from "./fresh";
import { getViewer } from "./http";
import { latestPipelineRun } from "./queries/common";

/**
 * Per-request context for server components: database, freshness tick, viewer and the server clock.
 * Cached per request so layouts and pages share one lookup.
 */
export const pageContext = cache(async () => {
  const db = await getDb();
  await ensureFresh(db);
  const [viewer, now, pipeline] = await Promise.all([getViewer(), clockNow(db), latestPipelineRun(db)]);
  return { db, viewer, now, demo: isDemoMode(), pipeline };
});
