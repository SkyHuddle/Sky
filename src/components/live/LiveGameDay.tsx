"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";
import { ordinal, percentileLabel, pts } from "@/lib/format";
import type { TeamLite } from "@/server/queries/common";
import type { FeedItem, LivePayload, LivePlayer, Rival } from "@/server/queries/live";
import { ButtonLink } from "../ui/Button";
import { Icon, type IconName } from "../ui/Icon";
import { DemoBadge, PlayerAvatar, TeamMark, UserAvatar } from "../ui/identity";
import { Movement, Notice } from "../ui/primitives";
import { Countdown, LocalTime, StatePill } from "../ui/status";
import { useAge, useLiveStream, type StreamState } from "./useLiveStream";

/**
 * Live GameDay (docs/DESIGN.md §5.9): your players first. Everything on this screen comes from the
 * server's pipeline over a live stream; numbers change only when the provider sends new data.
 */
export function LiveGameDay({ initial, nowIso }: { initial: LivePayload; nowIso: string }) {
  const { data, state, receivedAt } = useLiveStream<LivePayload>(`/api/live/stream?entry=${encodeURIComponent(initial.entryId)}`, initial);
  const d = data;
  const playing = d.players.filter((p) => p.state === "live");
  const upcoming = d.players.filter((p) => p.state === "upcoming").sort((a, b) => (a.next?.at ?? "").localeCompare(b.next?.at ?? ""));
  const rest = d.players.filter((p) => p.state !== "live" && p.state !== "upcoming");
  const movement = d.entry.previousRank && d.entry.rank ? d.entry.previousRank - d.entry.rank : null;
  const scored = d.entry.rank !== null;

  return (
    <div className="mx-auto max-w-[1180px]">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-eyebrow text-ink-2">
            <Link href={`/t/${d.tournament.slug}`} className="truncate hover:text-ink">
              {d.tournament.name}
            </Link>
            <span className="text-ink-3">·</span>
            <span className="truncate">{d.contest.name}</span>
          </div>
          <h1 className="mt-1 flex items-center gap-2 text-title text-ink">
            {d.anyLive ? "Live" : "GameDay"}
            {d.anyLive ? <span className="size-2 rounded-full bg-live motion-safe:animate-pulse-dot" aria-hidden /> : null}
          </h1>
          <p className="text-footnote text-ink-2">{d.stageName ? `${d.stageName}${d.anyLive ? " in progress" : ""}` : "Waiting for the first lock"}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Connection state={state} receivedAt={receivedAt} stale={d.freshness.stale} />
          {d.tournament.isDemo ? <DemoBadge /> : null}
        </div>
      </header>

      {d.freshness.stale ? (
        <Notice tone="warning" icon="clock" className="mt-4">
          <span className="font-semibold text-ink">Live data is delayed.</span> <span className="text-ink-2">The data provider hasn&apos;t sent a new scoreboard recently. Numbers below are the last we received and will catch up automatically.</span>
        </Notice>
      ) : null}

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        <div className="min-w-0 space-y-6">
          {/* Your score: the one dominant number on the screen */}
          <section aria-labelledby="live-score" className="rounded-[20px] border border-border bg-surface p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div id="live-score" className="text-footnote text-ink-2">
                  Fantasy points
                </div>
                <Flash value={d.entry.points}>
                  <span className="text-score text-ink sm:text-[2.5rem] sm:leading-[2.75rem]">{scored ? pts(d.entry.points) : "—"}</span>
                </Flash>
              </div>
              <div className="border-l border-border pl-4">
                <div className="text-footnote text-ink-2">Global rank</div>
                <div className="flex items-baseline gap-2">
                  <Flash value={d.entry.rank ?? 0}>
                    <span className="text-score text-ink sm:text-[2.5rem] sm:leading-[2.75rem]">{scored ? ordinal(d.entry.rank!) : "—"}</span>
                  </Flash>
                  {scored && movement !== null ? <Movement value={movement} className="text-footnote" /> : null}
                </div>
                {scored ? (
                  <div className="text-caption text-ink-3">
                    of {d.entry.entriesCount.toLocaleString("en")} · <span className="text-lavender">{percentileLabel(d.entry.rank, d.entry.entriesCount)}</span>
                  </div>
                ) : null}
              </div>
            </div>
            <p className="mt-4 flex flex-wrap items-center gap-2 text-caption text-ink-3">
              <StatePill kind={d.entry.scoreState === "settled" ? "settled" : d.entry.scoreState === "official" ? "official" : "provisional"} />
              Totals update when each map ends. Live map points show how it&apos;s going.
            </p>
            {d.leagues.length ? (
              <ul className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                {d.leagues.map((l) => (
                  <li key={l.id}>
                    <Link href={`/leagues/${l.id}`} className="inline-flex h-9 items-center gap-2 rounded-full bg-elevated px-3 text-footnote text-ink-2 hover:text-ink">
                      <Icon name="trophy" size={14} className="text-lavender" />
                      <span className="max-w-[160px] truncate">{l.name}</span>
                      <span className="num text-ink">{l.rank ? `${ordinal(l.rank)} of ${l.size}` : "—"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {d.openWindow && d.isOwner ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-accent/30 bg-accent-soft p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="text-headline text-ink">{d.openWindow.stageName} transfers are open</p>
                <p className="text-footnote text-ink-2">
                  {d.openWindow.transfers} strategic transfer{d.openWindow.transfers === 1 ? "" : "s"}, plus free replacements for eliminated players. Locks in{" "}
                  <Countdown to={d.openWindow.lockAt} now={nowIso} className="num text-ink" />
                </p>
              </div>
              <ButtonLink href={`/c/${d.contest.id}/build`}>Make Transfers</ButtonLink>
            </div>
          ) : null}

          <PlayerGroup title="Playing now" players={playing} d={d} empty={<NoLive d={d} nowIso={nowIso} />} />
          {upcoming.length ? <PlayerGroup title="Up next" players={upcoming} d={d} /> : null}
          {rest.length ? <PlayerGroup title="Finished or out" players={rest} d={d} /> : null}
        </div>

        <aside className="min-w-0 space-y-6">
          <RivalWatch d={d} />
          {d.matches.length ? (
            <section aria-labelledby="live-matches">
              <h2 id="live-matches" className="mb-3 text-section text-ink">
                Your matches
              </h2>
              <ul className="space-y-2">
                {d.matches.map((m) => {
                  const a = d.teams[m.teamAId];
                  const b = d.teams[m.teamBId];
                  return (
                    <li key={m.id}>
                      <Link href={`/live/match/${m.id}`} className="flex min-h-[72px] items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 transition-colors hover:bg-elevated">
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 text-callout font-semibold text-ink">
                            <TeamMark team={a} size={20} /> {a?.acronym} <span className="num text-ink-2">{m.mapsA}–{m.mapsB}</span> {b?.acronym} <TeamMark team={b} size={20} />
                          </span>
                          <span className="mt-0.5 block truncate text-footnote text-ink-2">
                            {m.live ? (
                              <>
                                Map {m.live.number} · {m.live.mapName} · <span className="num text-ink">{m.live.roundsA}–{m.live.roundsB}</span>
                              </>
                            ) : (
                              "Between maps"
                            )}
                            {" · "}BO{m.format}
                          </span>
                        </span>
                        <StatePill kind="live" label="Match live" />
                        <Icon name="chevronRight" size={18} className="text-ink-3" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
          <Activity feed={d.feed} />
        </aside>
      </div>
    </div>
  );
}

function Connection({ state, receivedAt, stale }: { state: StreamState; receivedAt: number; stale: boolean }) {
  const age = useAge(receivedAt);
  const label =
    state === "offline" ? "Offline" : state === "reconnecting" ? "Reconnecting…" : state === "connecting" ? "Connecting…" : state === "delayed" || stale ? "Data delayed" : `Updated ${age ?? "now"}`;
  const tone = state === "live" && !stale ? "text-ink-2" : "text-warning";
  return (
    <span className={cn("inline-flex h-7 items-center gap-1.5 rounded-full bg-elevated px-2.5 text-caption", tone)} role="status" aria-live="polite">
      <span className={cn("size-1.5 rounded-full", state === "live" && !stale ? "bg-accent" : "bg-warning")} aria-hidden />
      {label}
    </span>
  );
}

/** Briefly highlights a value once when it changes (no counters, no blinking). */
function Flash({ value, children }: { value: number; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={value}
        initial={reduce ? false : { opacity: 0.4, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="inline-block"
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}

function PlayerGroup({ title, players, d, empty }: { title: string; players: LivePlayer[]; d: LivePayload; empty?: React.ReactNode }) {
  return (
    <section aria-label={title}>
      <h2 className="mb-3 flex items-baseline justify-between text-section text-ink">
        {title}
        {players.length ? <span className="text-footnote font-normal text-ink-3">{players.length}</span> : null}
      </h2>
      {players.length === 0 ? (
        empty ?? null
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {players.map((p) => (
            <li key={p.id}>
              <PlayerLine p={p} d={d} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PlayerLine({ p, d }: { p: LivePlayer; d: LivePayload }) {
  const team = d.teams[p.teamId];
  const body = (
    <>
      <PlayerAvatar nickname={p.nickname} team={team} size={52} shape="tile" ring={p.isCaptain ? "captain" : null} muted={p.state === "eliminated"} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[0.9375rem] font-semibold text-ink">{p.nickname}</span>
          {p.isCaptain ? (
            <span className="inline-flex h-5 shrink-0 items-center gap-0.5 rounded-full bg-lavender-soft px-1.5 text-caption font-semibold text-lavender">
              <Icon name="star" size={11} strokeWidth={2.4} /> {p.multiplier}×
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-footnote text-ink-2">
          <TeamMark team={team} size={14} />
          <span className="shrink-0">{team?.acronym}</span>
          <StatusText p={p} teams={d.teams} />
        </span>
        {p.live ? (
          <span className="tabular mt-1 block text-caption text-ink-3">
            {p.live.mapName}{" "}
            <span className="text-ink">
              {p.live.roundsFor}–{p.live.roundsAgainst}
            </span>{" "}
            · K–D–A <span className="text-ink-2">{p.live.kills}–{p.live.deaths}–{p.live.assists}</span>
          </span>
        ) : null}
      </span>
      <span className="shrink-0 text-right">
        {p.live ? (
          <>
            <Flash value={p.live.mapPoints}>
              <span className="num block text-[1.125rem] text-accent">{pts(p.live.mapPoints)}</span>
            </Flash>
            <span className="block text-caption text-ink-3">map pts · live</span>
          </>
        ) : (
          <>
            <Flash value={p.points}>
              <span className="num block text-[1.0625rem] text-ink">{pts(p.points)}</span>
            </Flash>
            <span className="block text-caption text-ink-3">this stage</span>
          </>
        )}
      </span>
    </>
  );
  return p.live ? (
    <Link href={`/live/match/${p.live.matchId}`} className="flex min-h-[76px] items-center gap-3 py-2.5 pr-3 pl-3 transition-colors hover:bg-elevated/60 sm:pl-4" aria-label={`${p.nickname}: ${pts(p.live.mapPoints)} map points live. Open match`}>
      {body}
      <Icon name="chevronRight" size={18} className="shrink-0 text-ink-3" />
    </Link>
  ) : (
    <div className="flex min-h-[72px] items-center gap-3 py-2.5 pr-4 pl-3 sm:pl-4">{body}</div>
  );
}

function StatusText({ p, teams }: { p: LivePlayer; teams: Record<string, TeamLite> }) {
  if (p.live) {
    return (
      <span className="min-w-0 truncate">
        vs {teams[p.live.opponentId]?.acronym} · <span className="text-live">Map {p.live.mapNumber} live</span>
      </span>
    );
  }
  if (p.state === "live") return <span className="truncate text-live">Between maps</span>;
  if (p.next)
    return (
      <span className="min-w-0 truncate">
        {p.next.postponed ? <span className="text-warning">Postponed · </span> : null}vs {teams[p.next.opponentId]?.acronym ?? "TBD"} · <LocalTime iso={p.next.at} />
      </span>
    );
  if (p.state === "eliminated") return <span className="text-negative">Eliminated</span>;
  if (p.state === "finished") return <span>Done this stage</span>;
  return <span>Not started</span>;
}

function NoLive({ d, nowIso }: { d: LivePayload; nowIso: string }) {
  const next = d.players.map((p) => p.next?.at).filter((x): x is string => !!x).sort()[0];
  return (
    <div className="rounded-2xl border border-dashed border-border-strong p-5">
      <p className="text-headline text-ink">None of your players are on the server right now</p>
      <p className="mt-1 text-callout text-ink-2">
        {next ? (
          <>
            Next up in <Countdown to={next} now={nowIso} className="num font-semibold text-ink" /> (<LocalTime iso={next} />). This screen updates by itself when they start.
          </>
        ) : d.contest.status === "completed" ? (
          "The event is over. Your final result is on your team page."
        ) : (
          "No matches are scheduled for your players yet."
        )}
      </p>
    </div>
  );
}

function RivalWatch({ d }: { d: LivePayload }) {
  const [open, setOpen] = useState<"above" | "below" | null>(null);
  const { above, below } = d.rivals;
  if (!above && !below) return null;
  const nick = (id: string) => d.players.find((p) => p.id === id)?.nickname ?? id;
  const row = (r: Rival, which: "above" | "below") => {
    const liveTheirs = r.theirsOnly.filter((x) => x.live);
    const myLive = d.players.filter((p) => p.state === "live" && r.mineOnly.includes(p.id));
    const isOpen = open === which;
    return (
      <li>
        <button onClick={() => setOpen(isOpen ? null : which)} aria-expanded={isOpen} className="flex w-full min-h-[64px] items-center gap-3 px-4 py-3 text-left hover:bg-elevated/60">
          <UserAvatar username={r.username} hue={r.avatarHue} size={36} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-callout font-semibold text-ink">
              {ordinal(r.rank)} · {r.username}
            </span>
            <span className="block text-footnote text-ink-2">
              {r.gap > 0 ? (
                <>
                  You trail by <span className="num text-ink">{pts(r.gap)}</span>
                </>
              ) : r.gap < 0 ? (
                <>
                  You lead by <span className="num text-ink">{pts(-r.gap)}</span>
                </>
              ) : (
                "Level on points"
              )}
              {myLive.length ? ` · ${myLive.length} of your different players ${myLive.length === 1 ? "is" : "are"} playing` : ""}
            </span>
          </span>
          <Icon name="chevronDown" size={18} className={cn("shrink-0 text-ink-3 transition-transform", isOpen && "rotate-180")} />
        </button>
        {isOpen ? (
          <div className="space-y-2 px-4 pb-4 text-footnote">
            <p className="text-ink-2">
              <span className="text-ink">{r.shared.length}</span> shared player{r.shared.length === 1 ? "" : "s"}
              {r.shared.length ? `: ${r.shared.map(nick).join(", ")}` : ""}
            </p>
            <p className="text-ink-2">
              Theirs only:{" "}
              {r.theirsOnly.length
                ? r.theirsOnly.map((x, i) => (
                    <span key={x.id}>
                      {i ? ", " : ""}
                      <span className="text-ink">{x.nickname}</span>
                      {x.live ? <span className="text-live"> (playing)</span> : null}
                    </span>
                  ))
                : "none"}
            </p>
            <p className="text-ink-2">Yours only: {r.mineOnly.length ? r.mineOnly.map(nick).join(", ") : "none"}</p>
            {liveTheirs.length || myLive.length ? (
              <p className="text-ink-3">The gap can move while these players are on the server; totals update as each map ends.</p>
            ) : null}
          </div>
        ) : null}
      </li>
    );
  };
  return (
    <section aria-labelledby="rivals">
      <h2 id="rivals" className="mb-3 text-section text-ink">
        Rival Watch
      </h2>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {above ? row(above, "above") : null}
        <li className="flex min-h-[52px] items-center gap-3 bg-accent-soft px-4 py-2 text-callout">
          <span className="num w-10 text-ink">{d.entry.rank ? ordinal(d.entry.rank) : "—"}</span>
          <span className="flex-1 font-semibold text-ink">You</span>
          <span className="num text-ink">{pts(d.entry.points)}</span>
        </li>
        {below ? row(below, "below") : null}
      </ul>
    </section>
  );
}

const FEED_ICON: Record<FeedItem["kind"], IconName> = { map: "map", series: "check", credit: "trophy", correction: "refresh", rank: "arrowUp" };

function Activity({ feed }: { feed: FeedItem[] }) {
  return (
    <section aria-labelledby="activity">
      <h2 id="activity" className="mb-3 text-section text-ink">
        Activity
      </h2>
      {feed.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border-strong p-4 text-callout text-ink-2">Scoring updates for your players appear here as maps finish.</p>
      ) : (
        <ol className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {feed.slice(0, 12).map((f) => (
            <li key={f.id} className="flex items-start gap-3 px-4 py-3">
              <span
                className={cn(
                  "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full",
                  f.kind === "correction" ? "bg-lavender-soft text-lavender" : f.kind === "rank" ? (f.state === "up" ? "bg-accent-soft text-accent" : "bg-negative-soft text-negative") : "bg-elevated text-ink-2",
                )}
              >
                <Icon name={f.kind === "rank" && f.state === "down" ? "arrowDown" : FEED_ICON[f.kind]} size={14} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-footnote text-ink">{f.text}</span>
                <span className="block text-caption text-ink-3">
                  <LocalTime iso={f.at} format="time" />
                  {f.state && f.kind !== "rank" ? ` · ${f.state}` : ""}
                </span>
              </span>
              {f.points !== null ? (
                <span className={cn("num shrink-0 text-footnote", f.points >= 0 ? "text-positive" : "text-negative")}>
                  {f.points >= 0 ? "+" : "−"}
                  {pts(Math.abs(f.points))}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
