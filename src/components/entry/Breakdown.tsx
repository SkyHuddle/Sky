import { COMPONENT_LABELS, type SeriesBreakdown } from "@/domain/scoring/cs2";
import type { AdvancementCreditLine } from "@/domain/scoring/advancement";
import { cn } from "@/lib/cn";
import { pts } from "@/lib/format";
import type { DashboardPlayer } from "@/server/queries/contest";
import type { MatchLite, TeamLite } from "@/server/queries/common";
import { StatePill } from "../ui/status";

/**
 * Exactly how a player's points were calculated, straight from the scoring ledger:
 * per-map events → overtime cap → map win → average → series win → format weight → captain.
 */
export function Breakdown({ player, matches, teams, captainMultiplier }: { player: DashboardPlayer; matches: MatchLite[]; teams: Record<string, TeamLite>; captainMultiplier: number }) {
  if (player.events.length === 0) {
    return <p className="text-footnote text-ink-2">No points yet. Points appear after each completed map.</p>;
  }
  return (
    <div className="space-y-3">
      {player.events.map((ev, i) =>
        ev.kind === "series" ? (
          <SeriesBlock key={i} b={ev.breakdown as SeriesBreakdown} state={ev.state} corrected={ev.corrected} match={matches.find((m) => m.id === ev.matchId)} teams={teams} playerTeamId={player.teamId} />
        ) : (
          <div key={i} className="flex items-center justify-between rounded-xl bg-elevated px-3 py-2.5 text-footnote">
            <div>
              <div className="font-medium text-ink">Advancement credit</div>
              <div className="text-caption text-ink-3">
                Advanced with {(ev.breakdown as AdvancementCreditLine).unplayedSeries} series to spare (25 pts each)
              </div>
            </div>
            <span className="tabular font-semibold text-ink">+{pts(ev.points)}</span>
          </div>
        ),
      )}
      <div className="flex items-center justify-between border-t border-border pt-2.5 text-footnote">
        <span className="text-ink-2">
          Stage total{player.isCaptain ? ` × ${captainMultiplier} captain` : ""}
        </span>
        <span className="tabular font-semibold text-ink">
          {player.isCaptain ? `${pts(player.basePoints)} × ${captainMultiplier} = ` : ""}
          {pts(player.points)}
        </span>
      </div>
    </div>
  );
}

function SeriesBlock({ b, state, corrected, match, teams, playerTeamId }: { b: SeriesBreakdown; state: string; corrected: boolean; match?: MatchLite; teams: Record<string, TeamLite>; playerTeamId: string }) {
  const oppId = match ? (match.teamAId === playerTeamId ? match.teamBId : match.teamAId) : null;
  const opp = oppId ? teams[oppId] : null;
  const won = match?.winnerTeamId ? match.winnerTeamId === playerTeamId : null;
  const mine = match ? (match.teamAId === playerTeamId ? match.mapsA : match.mapsB) : 0;
  const theirs = match ? (match.teamAId === playerTeamId ? match.mapsB : match.mapsA) : 0;
  return (
    <div className="rounded-xl border border-border">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <span className="text-footnote font-semibold text-ink">vs {opp?.name ?? "opponent"}</span>
        <span className="text-caption text-ink-3">BO{b.format}</span>
        {match ? (
          <span className={cn("tabular text-caption font-semibold", won === null ? "text-ink-2" : won ? "text-positive" : "text-negative")}>
            {won === null ? "In progress" : won ? "Won" : "Lost"} {mine}–{theirs}
          </span>
        ) : null}
        <span className="ml-auto flex gap-1.5">
          {corrected ? <StatePill kind="corrected" /> : null}
          <StatePill kind={state === "settled" ? "settled" : state === "official" ? "official" : "provisional"} />
        </span>
      </div>
      <div className="divide-y divide-border">
        {b.maps.map((m) => (
          <details key={m.mapNumber} className="group px-3 py-2">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-footnote">
              <span className="font-medium text-ink">
                Map {m.mapNumber} · {m.mapName}
              </span>
              <span className="text-caption text-ink-3">
                {m.roundsPlayed} rds · {m.won ? "W" : "L"}
              </span>
              <span className="tabular ml-auto font-semibold text-ink">{pts(m.mapScore)}</span>
              <span className="text-ink-3 transition-transform group-open:rotate-90" aria-hidden>
                ›
              </span>
            </summary>
            <table className="mt-2 w-full text-caption">
              <tbody>
                {m.lines.map((l) => (
                  <tr key={l.component} className="text-ink-2">
                    <td className="py-0.5">{COMPONENT_LABELS[l.component]}</td>
                    <td className="tabular py-0.5 text-right">{l.quantity}</td>
                    <td className="tabular w-16 py-0.5 text-right text-ink">{l.points > 0 ? "+" : ""}{pts(l.points)}</td>
                  </tr>
                ))}
                {m.overtimeFactor < 1 ? (
                  <tr className="text-ink-2">
                    <td className="py-0.5">Overtime cap ({m.roundsPlayed} rounds → 24)</td>
                    <td className="tabular py-0.5 text-right">× {m.overtimeFactor.toFixed(3)}</td>
                    <td className="tabular py-0.5 text-right text-ink">{pts(m.cappedEventPoints)}</td>
                  </tr>
                ) : null}
                <tr className="text-ink-2">
                  <td className="py-0.5">Map won</td>
                  <td />
                  <td className="tabular py-0.5 text-right text-ink">{m.mapWinPoints ? `+${pts(m.mapWinPoints)}` : "0.0"}</td>
                </tr>
              </tbody>
            </table>
          </details>
        ))}
      </div>
      <dl className="grid grid-cols-3 gap-2 border-t border-border px-3 py-2 text-caption">
        <div>
          <dt className="text-ink-3">Map average</dt>
          <dd className="tabular font-semibold text-ink">{pts(b.mapAverage)}</dd>
        </div>
        <div>
          <dt className="text-ink-3">Series win</dt>
          <dd className="tabular font-semibold text-ink">{b.seriesWinPoints ? `+${pts(b.seriesWinPoints)}` : "0.0"}</dd>
        </div>
        <div className="text-right">
          <dt className="text-ink-3">Series total{b.formatWeight !== 1 ? ` × ${b.formatWeight}` : ""}</dt>
          <dd className="tabular font-semibold text-ink">{pts(b.total)}</dd>
        </div>
      </dl>
    </div>
  );
}
