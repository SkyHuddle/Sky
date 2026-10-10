import { route } from "@/server/http";
import { removeMember } from "@/server/services/leagues";

/** Owner only: remove a member. Their entry is unaffected; it just leaves this league's board. */
export const DELETE = route<{ id: string; userId: string }>(async ({ db, requireUser }, { id, userId }) => {
  await removeMember(db, requireUser().id, id, userId);
  return { ok: true };
});
