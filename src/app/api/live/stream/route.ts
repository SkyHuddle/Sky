import { now as clockNow } from "@/server/clock";
import { getDb } from "@/server/db/client";
import { getViewer } from "@/server/http";
import { liveEntryFor, liveView, toLivePayload } from "@/server/queries/live";
import { sseResponse } from "@/server/sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Live GameDay stream for one entry (default: the viewer's most relevant entry). */
export async function GET(req: Request) {
  const db = await getDb();
  const viewer = await getViewer();
  const entryId = new URL(req.url).searchParams.get("entry") ?? (viewer ? await liveEntryFor(db, viewer.id) : null);
  if (!entryId) return new Response("No entry to follow", { status: 404 });
  return sseResponse(
    req,
    db,
    async () => {
      const v = await liveView(db, entryId, viewer?.id ?? null, await clockNow(db));
      return v ? toLivePayload(v) : null;
    },
    (p) => ({ ...p, asOf: undefined }),
  );
}
