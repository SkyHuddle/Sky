import { z } from "zod";
import { route, readJson } from "@/server/http";
import { now } from "@/server/clock";
import { saveEntry } from "@/server/services/entries";

const body = z.object({
  playerIds: z.array(z.string().min(1)).max(10),
  captainId: z.string().min(1).nullable(),
  autopilot: z.boolean().optional(),
});

/** Create or update the signed-in user's roster for the contest's open window. */
export const PUT = route<{ id: string }>(
  async ({ db, req, requireUser }, { id }) => {
    const user = requireUser();
    const input = body.parse(await readJson(req));
    return saveEntry(db, { userId: user.id, contestId: id, ...input }, await now(db));
  },
  { rateLimit: { key: "entry", limit: 30, windowMs: 60_000 } },
);
