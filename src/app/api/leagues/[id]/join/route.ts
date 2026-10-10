import { route } from "@/server/http";
import { joinPublicLeague } from "@/server/services/leagues";

export const POST = route<{ id: string }>(async ({ db, requireUser }, { id }) => joinPublicLeague(db, requireUser().id, id), {
  rateLimit: { key: "league-join", limit: 30, windowMs: 60 * 60_000 },
});
