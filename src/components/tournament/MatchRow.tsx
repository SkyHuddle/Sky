import { cn } from "@/lib/cn";
import type { MatchLite, TeamLite } from "@/server/queries/common";
import { TeamMark } from "../ui/identity";
import { LocalTime, StatePill } from "../ui/status";

/** One series: teams, maps won, status. Winner emphasised by weight and a text marker, not colour alone. */
export function MatchRow({ m, teams, compact }: { m: MatchLite; teams: Record<string, TeamLite>; compact?: boolean }) {
  const done = m.status === "completed" || m.status === "forfeit";
  const side = (id: string, maps: number) => {
    const t = teams[id];
    const won = done && m.winnerTeamId === id;
    const lost = done && m.winnerTeamId && m.winnerTeamId !== id;
    return (
      <div className="flex items-center gap-2.5">
        <TeamMark team={t} size={compact ? 24 : 28} />
        <span className={cn("min-w-0 flex-1 truncate text-callout", won ? "font-semibold text-ink" : lost ? "text-ink-3" : "text-ink-2")}>
          {t?.name ?? "TBD"}
          {won ? <span className="sr-only"> (winner)</span> : null}
        </span>
        <span className={cn("tabular w-5 text-right text-callout", won ? "font-semibold text-ink" : "text-ink-3")}>{m.status === "scheduled" || m.status === "postponed" ? "" : maps}</span>
      </div>
    );
  };
  return (
    <div className="rounded-xl border border-border bg-surface px-3.5 py-3">
      <div className="mb-2 flex items-center gap-2 text-caption text-ink-3">
        <span>BO{m.format}</span>
        {m.slot !== "swiss" ? <span className="capitalize">· {m.slot}</span> : <span>· Round {m.round}</span>}
        <span className="ml-auto">
          {m.status === "live" ? (
            <StatePill kind="live" />
          ) : m.status === "postponed" ? (
            <StatePill kind="postponed" />
          ) : m.status === "scheduled" ? (
            <LocalTime iso={m.scheduledAt} />
          ) : m.status === "forfeit" ? (
            "Forfeit"
          ) : m.status === "cancelled" ? (
            "Cancelled"
          ) : (
            "Final"
          )}
        </span>
      </div>
      <div className="space-y-1.5">
        {side(m.teamAId, m.mapsA)}
        {side(m.teamBId, m.mapsB)}
      </div>
      {!compact && m.maps.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5 border-t border-border pt-2">
          {m.maps.map((g) => (
            <span key={g.number} className="tabular inline-flex h-6 items-center rounded-md bg-elevated px-2 text-caption text-ink-2">
              {g.mapName} {g.roundsA}–{g.roundsB}
            </span>
          ))}
        </div>
      ) : null}
      {m.originalScheduledAt && m.status !== "completed" ? <p className="mt-2 text-caption text-warning">Moved from its original time</p> : null}
    </div>
  );
}
