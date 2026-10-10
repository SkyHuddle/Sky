import "server-only";
import { ensureFresh, pipelineVersion } from "./fresh";
import type { Db } from "./db/connect";
import { stableHash } from "./ids";

const TICK_MS = 4_000; // how often a stream checks for a new pipeline run
const INGEST_MS = 5_000; // the shared pipeline runs at most this often while anyone is watching
const PING_MS = 15_000;

/**
 * A Server-Sent Events response fed by the shared pipeline. One ingestion per server process
 * serves every open stream; a stream recomputes only after a new pipeline run and sends only when
 * its payload changed. Browsers reconnect automatically (EventSource `retry`).
 */
export function sseResponse<T>(req: Request, db: Db, compute: () => Promise<T | null>, ignoreForChange: (p: T) => unknown = (p) => p): Response {
  const enc = new TextEncoder();
  let closed = false;
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (!closed) controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      req.signal.addEventListener("abort", () => {
        closed = true;
      });
      controller.enqueue(enc.encode(`retry: 3000\n\n`));
      let lastVersion = -1;
      let lastHash = "";
      let lastPing = Date.now();
      while (!closed) {
        try {
          await ensureFresh(db, false, INGEST_MS);
          const v = pipelineVersion();
          if (v !== lastVersion) {
            lastVersion = v;
            const payload = await compute();
            if (!payload) {
              send("gone", { message: "Nothing to follow here any more." });
              break;
            }
            const hash = stableHash(ignoreForChange(payload));
            if (hash !== lastHash) {
              lastHash = hash;
              send("update", payload);
            }
          }
          if (Date.now() - lastPing > PING_MS) {
            lastPing = Date.now();
            if (!closed) controller.enqueue(enc.encode(`: ping\n\n`));
          }
        } catch (err) {
          send("delayed", { message: "Live data is delayed. Retrying." });
          console.error("[live] stream tick failed", err);
        }
        await new Promise((r) => setTimeout(r, TICK_MS));
      }
      try {
        controller.close();
      } catch {
        /* already closed */
      }
    },
    cancel() {
      closed = true;
    },
  });
  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
