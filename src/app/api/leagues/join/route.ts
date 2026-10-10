import { z } from "zod";
import { route, readJson } from "@/server/http";
import { now } from "@/server/clock";
import { joinLeague } from "@/server/services/leagues";

export const POST = route(
  async ({ db, req, requireUser }) => {
    const user = requireUser();
    const { code } = z.object({ code: z.string().trim().min(4).max(40) }).parse(await readJson(req));
    return joinLeague(db, user.id, code, await now(db));
  },
  { rateLimit: { key: "league-join", limit: 30, windowMs: 60 * 60_000 } },
);
