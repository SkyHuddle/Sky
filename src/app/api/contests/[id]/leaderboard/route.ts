import { route } from "@/server/http";
import { AppError } from "@/server/errors";
import { getBoard, type BoardScope } from "@/server/services/leaderboards";
import { isMember } from "@/server/services/leagues";

/** GET ?scope=global|friends|league&league=<id>&page=<n> */
export const GET = route<{ id: string }>(async ({ db, req, viewer }, { id }) => {
  const url = new URL(req.url);
  const kind = url.searchParams.get("scope") ?? "global";
  const page = Number(url.searchParams.get("page") ?? "1") || 1;
  let scope: BoardScope = { kind: "global" };
  if (kind === "friends") {
    if (!viewer) throw new AppError("UNAUTHENTICATED", "Sign in to see your friends' board.");
    scope = { kind: "friends", userId: viewer.id };
  } else if (kind === "stage") {
    scope = { kind: "stage", windowId: url.searchParams.get("window") ?? "" };
  } else if (kind === "league") {
    const leagueId = url.searchParams.get("league") ?? "";
    if (!(await isMember(db, leagueId, viewer?.id ?? null))) throw new AppError("FORBIDDEN", "Join the league to see its standings.");
    scope = { kind: "league", leagueId };
  }
  return getBoard(db, id, scope, { viewerId: viewer?.id ?? null, page, pageSize: 50 });
});
