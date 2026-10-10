import { z } from "zod";
import { route, readJson } from "@/server/http";
import { now } from "@/server/clock";
import { AppError } from "@/server/errors";
import { entryDashboard } from "@/server/queries/contest";
import { setAutopilot } from "@/server/services/entries";

/** An entry's scores and rosters. Rosters for an open window are only visible to the owner. */
export const GET = route<{ id: string }>(async ({ db, viewer }, { id }) => {
  const d = await entryDashboard(db, id, viewer?.id ?? null, await now(db));
  if (!d) throw new AppError("NOT_FOUND", "Entry not found.");
  return d;
});

export const PATCH = route<{ id: string }>(async ({ db, req, requireUser }, { id }) => {
  const user = requireUser();
  const { autopilot } = z.object({ autopilot: z.boolean() }).parse(await readJson(req));
  await setAutopilot(db, user.id, id, autopilot);
  return { ok: true, autopilot };
});
