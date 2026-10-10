import { route } from "@/server/http";
import { demoPause } from "@/server/services/demo";

/** Demo mode only: return the demo clock to real-time speed. */
export const POST = route(async ({ db, requireUser }) => {
  requireUser();
  return demoPause(db);
}, { rateLimit: { key: "demo-pause", limit: 30, windowMs: 60_000 } });
