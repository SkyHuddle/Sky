import { route, readJson } from "@/server/http";
import { createLeague } from "@/server/services/leagues";

export const POST = route(
  async ({ db, req, requireUser }) => {
    const user = requireUser();
    return { league: await createLeague(db, user.id, (await readJson(req)) as never) };
  },
  { rateLimit: { key: "league-create", limit: 10, windowMs: 60 * 60_000 } },
);
