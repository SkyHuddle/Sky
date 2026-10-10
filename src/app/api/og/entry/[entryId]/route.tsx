import { ImageResponse } from "next/og";
import { CrestSvg, PortraitSvg } from "@/components/ui/art";
import { now as clockNow } from "@/server/clock";
import { getDb } from "@/server/db/client";
import { entryDashboard } from "@/server/queries/contest";
import { ordinal, pts } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The shareable team card (1200×630) for link previews and downloads. Privacy follows the contest:
 * player names appear only for a window that has locked, so an early share never reveals a lineup.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ entryId: string }> }) {
  const db = await getDb();
  const entryId = decodeURIComponent((await params).entryId);
  const d = await entryDashboard(db, entryId, null, await clockNow(db));
  if (!d) return new Response("Not found", { status: 404 });
  const locked = [...d.windows].reverse().find((w) => (w.status === "locked" || w.status === "completed") && w.visible);
  const players = locked?.players ?? [];
  const scored = d.entry.rank !== null;
  const final = d.contest.status === "completed";
  const bg = "#0a0f18";

  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", flexDirection: "column", background: bg, color: "#f3f6fa", padding: 56, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <svg width={44} height={44} viewBox="0 0 32 32">
            <rect x="1" y="1" width="30" height="30" rx="9" fill="#58e3cd" />
            <path d="M10.5 9v14h11" fill="none" stroke="#04241f" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="20.5" cy="13" r="3" fill="#04241f" />
          </svg>
          <div style={{ fontSize: 30, fontWeight: 700 }}>lockin</div>
          <div style={{ marginLeft: "auto", fontSize: 24, color: "#a2b1c3", display: "flex" }}>
            {`${d.tournament.shortName} · ${d.contest.name}${d.tournament.isDemo ? " · Demo data" : ""}`}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", marginTop: 40, gap: 48 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 26, color: "#a2b1c3", display: "flex" }}>{`${d.entry.username}'s team`}</div>
            <div style={{ fontSize: 64, fontWeight: 700, marginTop: 6, display: "flex" }}>
              {final && scored ? `${ordinal(d.entry.rank!)} of ${d.entry.entriesCount}` : scored ? `${pts(d.entry.totalPoints)} pts` : "Locked in"}
            </div>
          </div>
          {scored ? (
            <div style={{ display: "flex", flexDirection: "column", marginLeft: "auto", alignItems: "flex-end" }}>
              <div style={{ fontSize: 24, color: "#a2b1c3" }}>{final ? "Final points" : "Rank"}</div>
              <div style={{ fontSize: 44, fontWeight: 700 }}>{final ? pts(d.entry.totalPoints) : ordinal(d.entry.rank!)}</div>
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 44 }}>
          {(players.length ? players : Array.from({ length: d.rules.rosterSize }, () => null)).map((p, i) => {
            const team = p ? d.teams[p.teamId] : null;
            return (
              <div key={i} style={{ width: 200, height: 250, borderRadius: 22, background: "#192536", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", border: p?.isCaptain ? "3px solid #a99aff" : "1px solid #2a394c", overflow: "hidden" }}>
                <div style={{ display: "flex", marginTop: 10 }}>
                  <PortraitSvg seed={p?.nickname ?? `slot-${i}`} color={team?.color ?? "#788ba0"} size={170} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  {team ? <CrestSvg id={team.id} name={team.name} color={team.color} size={24} /> : null}
                  <div style={{ fontSize: 26, fontWeight: 700 }}>{p ? p.nickname : "Hidden until lock"}</div>
                </div>
                {p?.isCaptain ? <div style={{ position: "absolute", top: 12, left: 12, background: "#a99aff", color: "#1b1240", borderRadius: 999, padding: "4px 12px", fontSize: 18, fontWeight: 700 }}>C</div> : null}
              </div>
            );
          })}
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "cache-control": "public, max-age=60" } },
  );
}
