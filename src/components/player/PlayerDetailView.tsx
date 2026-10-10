"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { money, pts } from "@/lib/format";
import type { PlayerDetail } from "@/server/queries/contest";
import { Icon } from "../ui/Icon";
import { Flag, PlayerAvatar, RoleChip, TeamMark, rgba } from "../ui/identity";
import { LocalTime } from "../ui/status";

/**
 * Player research: facts first (recent fantasy points, consistency, schedule), organised in tabs.
 * Everything shown is historical and reproducible from match stats; no projections yet, and the
 * view says so.
 */
export function PlayerDetailView({ d, compact }: { d: PlayerDetail; compact?: boolean }) {
  const [tab, setTab] = useState<"form" | "maps" | "schedule">("form");
  const color = d.team?.color ?? "#6f7d92";
  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-border p-4" style={{ background: `radial-gradient(120% 140% at 0% 0%, ${rgba(color, 0.32)} 0%, ${rgba(color, 0.08)} 50%, #111824 100%)` }}>
        <div className="flex items-center gap-4">
          <PlayerAvatar nickname={d.player.nickname} team={d.team} size={compact ? 72 : 88} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-title text-ink">{d.player.nickname}</h3>
              <Flag code={d.player.nationality} />
            </div>
            <div className="truncate text-callout text-ink-2">
              {d.player.firstName} {d.player.lastName}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <TeamMark team={d.team} size={22} />
              <span className="truncate text-footnote text-ink-2">{d.team?.name}</span>
              <RoleChip role={d.player.role} />
            </div>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-2">
          <Fact label="Salary" value={d.price !== null ? money(d.price) : "—"} />
          <Fact label="Avg / map" value={d.recent.length ? pts(d.avgPoints) : "—"} hint={`last ${d.recent.length} maps`} />
          <Fact label="25+ maps" value={d.consistency !== null ? `${Math.round(d.consistency * 100)}%` : "—"} hint="consistency" />
        </dl>
        {d.contestPoints !== null ? (
          <div className="mt-2 rounded-xl bg-[rgb(10_14_22/0.45)] px-3 py-2 text-footnote text-ink-2">
            In this contest so far: <span className="tabular font-semibold text-ink">{pts(d.contestPoints)} pts</span>
          </div>
        ) : null}
      </div>

      <div role="tablist" aria-label="Player research" className="mt-4 flex gap-1 rounded-xl bg-elevated p-1">
        {(
          [
            ["form", "Form"],
            ["maps", "Recent maps"],
            ["schedule", "Schedule"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn("h-9 flex-1 rounded-[9px] text-footnote font-semibold transition-colors", tab === k ? "bg-raised text-ink shadow-sm" : "text-ink-3 hover:text-ink-2")}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4" role="tabpanel">
        {tab === "form" ? <FormChart d={d} /> : null}
        {tab === "maps" ? <RecentMaps d={d} /> : null}
        {tab === "schedule" ? <Schedule d={d} /> : null}
      </div>

      <p className="mt-4 flex items-start gap-2 text-caption text-ink-3">
        <Icon name="info" size={14} className="mt-px shrink-0" />
        Historical facts from completed maps, scored with this contest&apos;s rules. Projections aren&apos;t shown until a model has been validated.
      </p>
    </div>
  );
}

function Fact({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-[rgb(10_14_22/0.45)] px-3 py-2.5">
      <dt className="text-caption text-ink-3">{label}</dt>
      <dd className="tabular text-headline text-ink">{value}</dd>
      {hint ? <dd className="text-[0.6875rem] text-ink-3">{hint}</dd> : null}
    </div>
  );
}

/** Bars of fantasy points per map, oldest → newest, with the 25-point reference line. */
function FormChart({ d }: { d: PlayerDetail }) {
  const maps = [...d.recent].reverse();
  if (maps.length === 0) return <p className="text-callout text-ink-2">No completed maps yet.</p>;
  const max = Math.max(50, ...maps.map((m) => m.mapScore));
  const min = Math.min(0, ...maps.map((m) => m.mapScore));
  const H = 140;
  const scale = (v: number) => ((v - min) / (max - min)) * H;
  const ref = 25;
  return (
    <figure>
      <div className="relative h-[164px]" role="img" aria-label={`Fantasy points per map, last ${maps.length}: ${maps.map((m) => pts(m.mapScore)).join(", ")}`}>
        <div className="absolute inset-x-0 border-t border-dashed border-border-strong" style={{ bottom: 24 + scale(ref) }}>
          <span className="absolute -top-4 right-0 text-[0.625rem] text-ink-3">25 pts</span>
        </div>
        <div className="absolute inset-x-0 bottom-6 flex h-[140px] items-end gap-1.5">
          {maps.map((m) => (
            <div key={m.mapId} className="group relative flex h-full flex-1 flex-col justify-end">
              <span className="tabular mb-1 text-center text-[0.625rem] text-ink-2 opacity-0 transition-opacity group-hover:opacity-100">{pts(m.mapScore, 0)}</span>
              <div
                className={cn("rounded-t-[4px]", m.mapScore >= ref ? "bg-accent" : m.mapScore >= 10 ? "bg-ink-3" : "bg-negative/70")}
                style={{ height: Math.max(3, scale(m.mapScore) - scale(min)) }}
                title={`${m.mapName} vs ${d.teams[m.opponentId]?.acronym ?? ""}: ${pts(m.mapScore)} pts`}
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 flex gap-1.5">
          {maps.map((m) => (
            <span key={m.mapId} className="flex-1 truncate text-center text-[0.625rem] text-ink-3">
              {d.teams[m.opponentId]?.acronym ?? ""}
            </span>
          ))}
        </div>
      </div>
      <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-ink-3">
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-sm bg-accent" />25+ points</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-sm bg-ink-3" />10–25</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-sm bg-negative/70" />under 10</span>
        <span>Labels: opponent</span>
      </figcaption>
    </figure>
  );
}

function RecentMaps({ d }: { d: PlayerDetail }) {
  if (d.recent.length === 0) return <p className="text-callout text-ink-2">No completed maps yet.</p>;
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-footnote">
        <thead className="bg-elevated text-left text-caption text-ink-3">
          <tr>
            <th className="px-3 py-2 font-medium">Map</th>
            <th className="px-2 py-2 font-medium">Result</th>
            <th className="px-2 py-2 text-right font-medium">K–D–A</th>
            <th className="px-3 py-2 text-right font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {d.recent.map((m) => (
            <tr key={m.mapId} className="border-t border-border">
              <td className="px-3 py-2">
                <div className="font-medium text-ink">{m.mapName}</div>
                <div className="text-caption text-ink-3">vs {d.teams[m.opponentId]?.acronym} · {m.tournamentName}</div>
              </td>
              <td className="tabular px-2 py-2">
                <span className={m.won ? "text-positive" : "text-negative"}>{m.won ? "W" : "L"}</span>{" "}
                <span className="text-ink-2">
                  {m.roundsFor}–{m.roundsAgainst}
                </span>
              </td>
              <td className="tabular px-2 py-2 text-right text-ink-2">
                {m.kills}–{m.deaths}–{m.assists}
              </td>
              <td className="tabular px-3 py-2 text-right font-semibold text-ink">{pts(m.mapScore)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Schedule({ d }: { d: PlayerDetail }) {
  if (d.upcoming.length === 0) return <p className="text-callout text-ink-2">No scheduled matches yet. Fixtures appear once pairings are set.</p>;
  return (
    <ul className="space-y-2">
      {d.upcoming.map((u) => (
        <li key={u.matchId} className="flex items-center gap-3 rounded-xl bg-elevated px-3 py-2.5">
          <TeamMark team={d.teams[u.opponentId]} size={30} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-callout font-medium text-ink">vs {d.teams[u.opponentId]?.name}</div>
            <div className="text-caption text-ink-3">
              {u.stageName} · BO{u.format}
            </div>
          </div>
          <LocalTime iso={u.at} className="text-footnote text-ink-2" />
        </li>
      ))}
    </ul>
  );
}
