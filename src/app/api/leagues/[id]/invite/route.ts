import { route } from "@/server/http";
import { regenerateInvite } from "@/server/services/leagues";

/** Owner only: issue a new invite link (the old one stops working). */
export const POST = route<{ id: string }>(async ({ db, requireUser }, { id }) => ({ inviteCode: await regenerateInvite(db, requireUser().id, id) }));
