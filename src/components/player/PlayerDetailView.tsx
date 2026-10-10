"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { money, pts } from "@/lib/format";
import type { PlayerDetail } from "@/server/queries/contest";
import { Icon } from "../ui/Icon";
import { CrestSvg, PortraitSvg } from "../ui/art";
import { Flag, TeamMark, rgba } from "../ui/identity";
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
      <div
        className={cn("relative overflow-hidden rounded-[22px] border border-white/[0.07]", compact ? "h-[232px]" : "h-[280px]")}
        style={{ background: `radial-gradient(110% 120% at 75% 10%, ${rgba(color, 0.45)} 0%, ${rgba(color, 0.12)} 45%, #0e141f 80%)` }}
      >
        {d.team ? (
          <span className="pointer-events-none absolute -top-10 -left-12 size-[230px] opacity-[0.07]" aria-hidden>
            <CrestSvg id={d.team.id} name={d.team.name} color="#ffffff" className="size-full" />
          </span>
        ) : null}
        <PortraitSvg seed={d.player.nickname} color={color} team={d.team ?? undefined} className="pointer-events-none absolute right-[-6%] bottom-0 h-[96%] w-auto" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(10_14_22/0.85)_0%,rgb(10_14_22/0.35)_55%,transparent_80%),linear-gradient(0deg,rgb(10_14_22/0.7)_0%,transparent_45%)]" aria-hidden />

        <div className="absolute top-4 left-4">
          <div className="text-caption text-ink-2">Salary</div>
          <div className="num text-[1.875rem] leading-none text-accent">{d.price !== null ? money(d.price) : "—"}</div>
        </div>
        <div className="absolute inset-x-4 bottom-4">
          <div className="flex items-center gap-2">
            <h3 className="display truncate text-[2.75rem] leading-[0.95] text-ink">{d.player.nickname}</h3>
            <Flag code={d.player.nationality} className="text-[1.25rem]" />
          </div>
          <div className="truncate text-footnote text-ink-2">
            {d.player.firstName} {d.player.lastName}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <TeamMark team={d.team} size={22} />
            <span className="truncate text-callout font-medium text-ink">{d.team?.name}</span>
            <span className="inline-flex h-6 items-center rounded-full px-2.5 text-caption font-semibold text-ink ring-1 ring-white/20">{d.player.role}</span>
          </div>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2">
        <Fact label="Avg / map" value={d.recent.length ? pts(d.avgPoints) : "—"} hint={`last ${d.recent.length} maps`} />
        <Fact label="25+ maps" value={d.consistency !== null ? `${Math.round(d.consistency * 100)}%` : "—"} hint="consistency" />
        {d.contestPoints !== null ? (
          <Fact label="This contest" value={pts(d.contestPoints)} hint="points so far" accent />
        ) : (
          <Fact label="Best map" value={d.recent.length ? pts(Math.max(...d.recent.map((m) => m.mapScore))) : "—"} hint="recent high" />
        )}
      </dl>

      <div role="tablist" aria-label="Player research" className="mt-4 flex gap-1 border-b border-border">
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
            className={cn(
              "relative h-10 flex-1 text-footnote font-semibold transition-colors",
              tab === k ? "text-ink after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-accent" : "text-ink-3 hover:text-ink-2",
            )}
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

function Fact({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-3 py-2.5">
      <dt className="text-caption text-ink-3">{label}</dt>
      <dd className={cn("num text-[1.5rem] leading-tight", accent ? "text-accent" : "text-ink")}>{value}</dd>
      {hint ? <dd className="text-[0.6875rem] text-ink-3">{hint}</dd> : null}
    </div>
  );
}

/** Bars of fantasy points per map, oldest → newest, value on top, opponent crest below, with the 25-point reference line. */
function FormChart({ d }: { d: PlayerDetail }) {
  const maps = [...d.recent].reverse();
  if (maps.length === 0) return <p className="text-callout text-ink-2">No completed maps yet.</p>;
  const max = Math.max(50, ...maps.map((m) => m.mapScore));
  const min = Math.min(0, ...maps.map((m) => m.mapScore));
  const H = 132;
  const scale = (v: number) => ((v - min) / (max - min)) * H;
  const ref = 25;
  const band = (v: number) => (v >= ref ? "bg-[linear-gradient(180deg,var(--color-accent),rgb(92_227_203/0.35))]" : v >= 10 ? "bg-[linear-gradient(180deg,var(--color-lavender),rgb(167_139_250/0.3))]" : "bg-negative/70");
  return (
    <figure>
      <div className="relative h-[190px]" role="img" aria-label={`Fantasy points per map, last ${maps.length}: ${maps.map((m) => pts(m.mapScore)).join(", ")}`}>
        <div className="absolute inset-x-0 border-t border-dashed border-border-strong" style={{ bottom: 28 + scale(ref) - scale(min) }}>
          <span className="absolute -top-4 right-0 text-[0.625rem] text-ink-3">25 pts</span>
        </div>
        <div className="absolute inset-x-0 bottom-7 flex h-[156px] items-end gap-1.5">
          {maps.map((m) => (
            <div key={m.mapId} className="relative flex h-full flex-1 flex-col items-stretch justify-end">
              <span className="num mb-1 text-center text-[0.6875rem] leading-none text-ink-2">{pts(m.mapScore, 0)}</span>
              <div
                className={cn("rounded-t-[6px] rounded-b-[2px]", band(m.mapScore))}
                style={{ height: Math.max(3, scale(m.mapScore) - scale(min)) }}
                title={`${m.mapName} vs ${d.teams[m.opponentId]?.name ?? ""}: ${pts(m.mapScore)} pts`}
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 flex gap-1.5">
          {maps.map((m) => (
            <span key={m.mapId} className="flex flex-1 justify-center" title={d.teams[m.opponentId]?.name}>
              <TeamMark team={d.teams[m.opponentId]} size={18} />
            </span>
          ))}
        </div>
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-ink-3">
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-sm bg-accent" />25+ points</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-sm bg-lavender" />10–25</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-sm bg-negative/70" />under 10</span>
        <span>Below each bar: the opponent</span>
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
