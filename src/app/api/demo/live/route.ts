import { route } from "@/server/http";
import { demoWatchLive } from "@/server/services/demo";

/** Demo mode only: jump to the next series and replay it at 20× through the real pipeline. */
export const POST = route(async ({ db, requireUser }) => {
  requireUser();
  return demoWatchLive(db);
}, { rateLimit: { key: "demo-live", limit: 20, windowMs: 60_000 } });
