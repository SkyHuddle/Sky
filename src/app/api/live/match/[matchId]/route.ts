import { now as clockNow } from "@/server/clock";
import { getDb } from "@/server/db/client";
import { getViewer } from "@/server/http";
import { matchCenter } from "@/server/queries/match";
import { sseResponse } from "@/server/sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Match Center stream: maps, current scoreboard and fantasy contributions for one series. */
export async function GET(req: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const db = await getDb();
  const viewer = await getViewer();
  const matchId = decodeURIComponent((await params).matchId);
  return sseResponse(req, db, async () => matchCenter(db, matchId, viewer?.id ?? null, await clockNow(db)), (p) => ({ ...p, asOf: undefined }));
}
