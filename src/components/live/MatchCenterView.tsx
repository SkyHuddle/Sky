"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { pts } from "@/lib/format";
import type { MatchCenter, ScoreLine } from "@/server/queries/match";
import { Icon } from "../ui/Icon";
import { DemoBadge, PlayerAvatar, TeamMark } from "../ui/identity";
import { LocalTime, StatePill } from "../ui/status";
import { useAge, useLiveStream } from "./useLiveStream";

/**
 * Match Center: one series, as much as the provider supplies (a scoreboard snapshot per map),
 * with fantasy points per player under your contest's rules. Your players are marked.
 */
export function MatchCenterView({ initial }: { initial: MatchCenter }) {
  const live = initial.status === "live";
  const { data: m, state, receivedAt } = useLiveStream<MatchCenter>(`/api/live/match/${encodeURIComponent(initial.id)}`, initial);
  const age = useAge(receivedAt);
  const maps = [...m.maps].sort((a, b) => a.number - b.number);
  const [tab, setTab] = useState<number | "live">(m.live ? "live" : (maps[maps.length - 1]?.number ?? 1));
  const shown = tab === "live" ? m.live : maps.find((x) => x.number === tab);
  const done = m.status === "completed";
  const side = (team: MatchCenter["teamA"]) => (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
      <TeamMark team={team} size={52} />
      <span className="max-w-full truncate text-callout font-semibold text-ink">{team.name}</span>
    </div>
  );
  // A scoreboard: crests either side, the series score in the display face between them.
  const score = (n: number, other: number) => (
    <span className={cn("font-display text-[3.25rem] leading-none font-bold tabular-nums", done && n < other ? "text-ink-3" : "text-ink")}>{n}</span>
  );

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/live" className="mb-3 inline-flex h-10 items-center gap-1 text-callout text-ink-2 hover:text-ink">
        <Icon name="chevronLeft" size={16} /> Live
      </Link>
      <section className="rounded-2xl bg-surface p-5">
        <div className="flex items-center gap-2 text-caption text-ink-3">
          <span className="kicker truncate">
            {m.tournament.name} · {m.stageName} · BO{m.format}
          </span>
          <span className="ml-auto flex items-center gap-2">
            {m.tournament.isDemo ? <DemoBadge /> : null}
            {m.status === "live" ? <StatePill kind="live" label="Live" /> : m.status === "completed" ? <StatePill kind="completed" /> : <LocalTime iso={m.scheduledAt} />}
          </span>
        </div>
        <div className="mt-5 flex items-center gap-2">
          {side(m.teamA)}
          <div className="flex shrink-0 flex-col items-center">
            <span className="sr-only">
              Maps {m.mapsA} to {m.mapsB}
            </span>
            <div className="flex items-center gap-3" aria-hidden>
              {score(m.mapsA, m.mapsB)}
              <span className="font-display text-[2rem] leading-none text-ink-3">–</span>
              {score(m.mapsB, m.mapsA)}
            </div>
            <span className="mt-1 text-caption text-ink-3">Maps</span>
          </div>
          {side(m.teamB)}
        </div>
        {m.live ? (
          <div className="mt-4 rounded-xl bg-elevated px-4 py-3 text-center">
            <div className="text-caption text-ink-3">
              Map {m.live.number} · {m.live.mapName} · round {m.live.roundsA + m.live.roundsB + 1}
            </div>
            <div className="num mt-0.5 text-headline text-ink">
              {m.teamA.acronym} {m.live.roundsA} – {m.live.roundsB} {m.teamB.acronym}
            </div>
          </div>
        ) : null}
        {live ? (
          <p className="mt-3 text-center text-caption text-ink-3" role="status" aria-live="polite">
            {state === "live" ? `Scoreboard updated ${age ?? "now"}` : state === "reconnecting" || state === "offline" ? "Reconnecting…" : state === "delayed" ? "Data delayed" : "Connecting…"}
          </p>
        ) : null}
      </section>

      {maps.length || m.live ? (
        <div role="tablist" aria-label="Maps" className="scrollbar-none mt-5 flex gap-1 overflow-x-auto rounded-xl bg-surface p-1">
          {maps.map((g) => (
            <button
              key={g.number}
              role="tab"
              aria-selected={tab === g.number}
              onClick={() => setTab(g.number)}
              className={cn("h-10 min-w-[96px] flex-1 rounded-md px-3 text-footnote font-semibold whitespace-nowrap", tab === g.number ? "bg-raised text-ink" : "text-ink-2 hover:text-ink")}
            >
              {g.mapName} <span className="num text-ink-3">{g.roundsA}–{g.roundsB}</span>
            </button>
          ))}
          {m.live ? (
            <button
              role="tab"
              aria-selected={tab === "live"}
              onClick={() => setTab("live")}
              className={cn("inline-flex h-10 min-w-[96px] flex-1 items-center justify-center gap-1.5 rounded-md px-3 text-footnote font-semibold whitespace-nowrap", tab === "live" ? "bg-raised text-ink" : "text-ink-2 hover:text-ink")}
            >
              <span className="size-1.5 rounded-full bg-live" aria-hidden /> {m.live.mapName}
            </button>
          ) : null}
        </div>
      ) : (
        <p className="mt-5 rounded-2xl bg-surface p-5 text-callout text-ink-2">The scoreboard appears when the first map starts.</p>
      )}

      {shown ? (
        <div className="mt-4 space-y-4">
          <Scoreboard lines={shown.lines.filter((l) => l.teamId === m.teamA.id)} team={m.teamA} live={tab === "live"} />
          <Scoreboard lines={shown.lines.filter((l) => l.teamId === m.teamB.id)} team={m.teamB} live={tab === "live"} />
          <p className="text-caption text-ink-3">
            {tab === "live"
              ? "Fantasy column: this map so far, under your contest's rules. It's provisional and joins your total when the map ends. Round-by-round play isn't supplied by the data provider, only the scoreboard."
              : "Fantasy column: map points under your contest's rules, before the series average and bonuses."}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Scoreboard({ lines, team, live }: { lines: ScoreLine[]; team: MatchCenter["teamA"]; live: boolean }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <TeamMark team={team} size={18} />
        <span className="text-callout font-semibold text-ink">{team.name}</span>
      </div>
      <table className="w-full text-footnote">
        <thead className="text-left text-caption text-ink-3">
          <tr>
            <th className="px-4 py-2 font-medium">Player</th>
            <th className="w-[84px] px-2 py-2 text-right font-medium">K–D–A</th>
            <th className="w-[84px] px-4 py-2 text-right font-medium">{live ? "Map pts" : "Fantasy"}</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.playerId} className={cn("border-t border-border", l.mine && "bg-accent-soft")}>
              <td className="px-4 py-2">
                <span className="flex items-center gap-2.5">
                  <PlayerAvatar nickname={l.nickname} team={team} size={28} />
                  <span className={cn("truncate", l.mine ? "font-semibold text-ink" : "text-ink")}>{l.nickname}</span>
                  {l.mine ? <span className="text-caption text-accent">yours</span> : null}
                </span>
              </td>
              <td className="tabular px-2 py-2 text-right text-ink-2">
                {l.kills}–{l.deaths}–{l.assists}
              </td>
              <td className={cn("num px-4 py-2 text-right", l.mine ? "text-accent" : "text-ink")}>{pts(l.mapPoints)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
