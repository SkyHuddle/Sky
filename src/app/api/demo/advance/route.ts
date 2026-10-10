import { route } from "@/server/http";
import { demoAdvance } from "@/server/services/demo";

/** Demo mode only: move the demo clock to the end of the next stage and process everything due. */
export const POST = route(async ({ db, requireUser }) => {
  requireUser();
  return demoAdvance(db);
}, { rateLimit: { key: "demo-advance", limit: 20, windowMs: 60_000 } });
