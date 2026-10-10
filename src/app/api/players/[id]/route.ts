import { route } from "@/server/http";
import { now } from "@/server/clock";
import { AppError } from "@/server/errors";
import { playerDetail } from "@/server/queries/contest";

export const GET = route<{ id: string }>(async ({ db, req }, { id }) => {
  const contestId = new URL(req.url).searchParams.get("contest");
  const d = await playerDetail(db, id, contestId, await now(db));
  if (!d) throw new AppError("NOT_FOUND", "Player not found.");
  return d;
});
