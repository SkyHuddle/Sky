import { route } from "@/server/http";
import { leaveLeague } from "@/server/services/leagues";

export const POST = route<{ id: string }>(async ({ db, requireUser }, { id }) => {
  await leaveLeague(db, requireUser().id, id);
  return { ok: true };
});
