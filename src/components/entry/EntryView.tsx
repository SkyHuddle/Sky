"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { money, ordinal, percentileLabel, pts, relativeAgo } from "@/lib/format";
import type { DashboardPlayer, DashboardWindow, EntryDashboard } from "@/server/queries/contest";
import type { Board } from "@/server/services/leaderboards";
import { StageProgress } from "../tournament/StageProgress";
import { ButtonLink } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { DemoBadge, PlayerAvatar } from "../ui/identity";
import { Movement, Notice } from "../ui/primitives";
import { Countdown, LocalTime, StatePill } from "../ui/status";
import { useToast } from "../ui/Toast";
import { Breakdown } from "./Breakdown";

export function EntryView({ d, board, nowIso, healthOk }: { d: EntryDashboard; board: Board; nowIso: string; healthOk: boolean }) {
  const now = new Date(nowIso);
  const lockedWindows = d.windows.filter((w) => w.status === "locked" || w.status === "completed");
  const defaultWindow = (lockedWindows[lockedWindows.length - 1] ?? d.windows[d.windows.length - 1])?.id ?? null;
  const [windowId, setWindowId] = useState<string | null>(defaultWindow);
  const [expanded, setExpanded] = useState<string | null>(null);
  const w = d.windows.find((x) => x.id === windowId) ?? d.windows[0];
  const open = d.contest.openWindow && new Date(d.contest.openWindow.lockAt) > now ? d.contest.openWindow : null;
  const movement = d.entry.previousRank && d.entry.rank ? d.entry.previousRank - d.entry.rank : null;
  const scored = d.entry.rank !== null;
  const stateKind = d.entry.scoreState === "settled" ? "settled" : d.entry.scoreState === "official" ? "official" : "provisional";

  return (
    <div className="space-y-6">
      {/* Score hero */}
      <section className="overflow-hidden rounded-[24px] border border-border bg-surface" aria-labelledby="score">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/t/${d.tournament.slug}`} className="text-eyebrow text-lavender hover:underline">
              {d.tournament.shortName}
            </Link>
            <span className="text-caption text-ink-3">· {d.contest.name}</span>
            {d.tournament.isDemo ? <DemoBadge /> : null}
            {scored ? <StatePill kind={stateKind} className="ml-auto" /> : null}
          </div>
          {!d.isOwner ? (
            <div className="mt-3 flex items-center gap-2.5">
              <PlayerAvatar nickname={d.entry.username} team={{ id: "u", name: "", acronym: "", color: `hsl(${d.entry.avatarHue} 70% 62%)`, country: "" }} size={32} />
              <Link href={`/u/${d.entry.username}`} className="text-headline text-ink hover:underline">
                {d.entry.username}
              </Link>
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap items-end gap-x-8 gap-y-4">
            <div>
              <div id="score" className="text-caption text-ink-3">
                Fantasy points
              </div>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={d.entry.totalPoints}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="tabular text-[3rem] leading-[1] font-semibold tracking-[-0.04em] text-ink"
                >
                  {scored ? pts(d.entry.totalPoints) : "—"}
                </motion.div>
              </AnimatePresence>
            </div>
            <div>
              <div className="text-caption text-ink-3">Rank</div>
              <div className="flex items-baseline gap-2">
                <span className="tabular text-title text-ink">{scored ? ordinal(d.entry.rank!) : "—"}</span>
                {scored ? <span className="text-callout text-ink-3">of {d.entry.entriesCount.toLocaleString("en")}</span> : null}
                {scored ? <Movement value={movement} /> : null}
              </div>
              {scored ? <div className="text-caption text-lavender">{percentileLabel(d.entry.rank, d.entry.entriesCount)}</div> : null}
            </div>
            <div className="text-caption text-ink-3 sm:ml-auto sm:text-right">
              <div>Data checked {relativeAgo(d.lastUpdated, Date.parse(d.realNow))}</div>
              {d.entry.scoreState !== "settled" ? <div>Scores update after each completed map</div> : null}
            </div>
          </div>
          {!scored ? (
            <p className="mt-3 text-callout text-ink-2">Scoring starts when {d.windows[0]?.stageName ?? "the first stage"} locks and the first maps are played.</p>
          ) : null}
          <StageProgress stages={d.tournament.stages.filter((s) => d.windows.some((x) => x.stageId === s.id))} className="mt-6" />
        </div>

        {/* What to do next */}
        {d.isOwner ? (
          <div className="border-t border-border bg-[#0e1520] px-5 py-4 sm:px-6">
            {open ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="hidden size-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent sm:inline-flex">
                  <Icon name={open.position > 1 ? "swap" : "roster"} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-callout font-semibold text-ink">{open.position > 1 ? `${open.stageName} transfer window is open` : "Your lineup is editable"}</div>
                  <div className="text-footnote text-ink-2">
                    {open.position > 1 ? `${d.rules.transfersPerWindow} transfers, plus free replacements for eliminated players. ` : ""}Locks in{" "}
                    <Countdown to={open.lockAt} now={nowIso} className="font-semibold text-ink" />
                  </div>
                </div>
                <ButtonLink href={`/c/${d.contest.id}/build`} iconRight="chevronRight" className="w-full sm:w-auto">
                  {open.position > 1 ? "Make transfers" : "Edit lineup"}
                </ButtonLink>
              </div>
            ) : d.contest.status === "completed" ? (
              <p className="flex items-center gap-2 text-callout text-ink-2">
                <Icon name="trophy" size={18} className="text-lavender" /> Final result{d.entry.scoreState === "settled" ? ", settled" : ""}. See you at the next event.
              </p>
            ) : d.contest.nextWindow ? (
              <p className="flex items-center gap-2 text-callout text-ink-2">
                <Icon name="lock" size={16} /> Locked. The {d.contest.nextWindow.stageName} transfer window opens when the current stage ends.
              </p>
            ) : (
              <p className="flex items-center gap-2 text-callout text-ink-2">
                <Icon name="lock" size={16} /> Locked for the final stage. No more transfers.
              </p>
            )}
          </div>
        ) : null}
      </section>

      {!healthOk ? <Notice tone="warning">Match stats are delayed from the data provider. Scores will catch up automatically.</Notice> : null}
      {d.pendingMaps > 0 ? (
        <Notice tone="info" icon="clock">
          {d.pendingMaps} match{d.pendingMaps > 1 ? "es are" : " is"} in progress. Finished maps are already scored provisionally; the series result is added when the match ends.
        </Notice>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Roster by stage */}
        <section aria-labelledby="roster-h">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="roster-h" className="text-headline text-ink">
              {d.isOwner ? "Your roster" : "Roster"}
            </h2>
            {w ? <span className="tabular text-callout text-ink-2">{pts(w.points)} pts this stage</span> : null}
          </div>
          {d.windows.length > 1 ? (
            <div role="tablist" aria-label="Stages" className="scrollbar-none mb-3 flex gap-1.5 overflow-x-auto">
              {d.windows.map((x) => (
                <button
                  key={x.id}
                  role="tab"
                  aria-selected={x.id === w?.id}
                  onClick={() => setWindowId(x.id)}
                  className={cn("inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-footnote font-semibold transition-colors", x.id === w?.id ? "bg-ink text-bg" : "bg-surface text-ink-2 ring-1 ring-border hover:text-ink")}
                >
                  {x.stageName}
                  {x.status === "open" ? <span className="size-1.5 rounded-full bg-accent" aria-label="(editable)" /> : null}
                </button>
              ))}
            </div>
          ) : null}
          {w ? <WindowRoster w={w} d={d} expanded={expanded} setExpanded={setExpanded} /> : null}
        </section>

        <aside className="space-y-6">
          <BoardPreview d={d} board={board} />
          <Upcoming d={d} w={w} />
          {d.isOwner ? <AutopilotCard d={d} /> : null}
        </aside>
      </div>
    </div>
  );
}

function statusLabel(p: DashboardPlayer, d: EntryDashboard): { kind: "live" | "next" | "done" | "eliminated" | "idle" | "dnp"; text: string } {
  switch (p.status.kind) {
    case "live":
      return { kind: "live", text: "Playing now" };
    case "next":
      return { kind: "next", text: `${p.status.postponed ? "Postponed · " : ""}vs ${d.teams[p.status.opponentId]?.acronym ?? "TBD"}` };
    case "eliminated":
      return { kind: "eliminated", text: "Eliminated" };
    case "done":
      return { kind: "done", text: "Done this stage" };
    case "did_not_play":
      return { kind: "dnp", text: "Did not play" };
    default:
      return { kind: "idle", text: "Not started" };
  }
}

function WindowRoster({ w, d, expanded, setExpanded }: { w: DashboardWindow; d: EntryDashboard; expanded: string | null; setExpanded: (id: string | null) => void }) {
  if (!w.visible) {
    return (
      <div className="rounded-2xl border border-dashed border-border-strong p-6 text-center">
        <Icon name="eye" size={22} className="mx-auto text-ink-3" />
        <p className="mt-2 text-headline text-ink">Hidden until lock</p>
        <p className="mt-1 text-callout text-ink-2">Lineups for {w.stageName} become public when the stage locks.</p>
      </div>
    );
  }
  const players = [...w.players].sort((a, b) => Number(b.isCaptain) - Number(a.isCaptain) || b.points - a.points);
  return (
    <div className="space-y-3">
      {w.autopilotChanges.length ? (
        <Notice tone="lavender" icon="autopilot">
          <span className="font-semibold text-ink">Autopilot made changes when {w.stageName} locked:</span>
          <ul className="mt-1 space-y-0.5 text-ink-2">
            {w.autopilotChanges.map((c, i) => (
              <li key={i}>
                {nameOf(c.outPlayerId, d)} (eliminated) → {c.inPlayerId ? nameOf(c.inPlayerId, d) : "no legal replacement; slot left empty"}
              </li>
            ))}
          </ul>
        </Notice>
      ) : null}
      {w.transfers.length ? (
        <p className="flex items-center gap-2 text-footnote text-ink-2">
          <Icon name="swap" size={15} /> {w.transfers.filter((t) => t.kind === "discretionary").length} transfer(s) and {w.transfers.filter((t) => t.kind === "free").length} free replacement(s) this stage
        </p>
      ) : null}
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {players.map((p) => {
          const s = statusLabel(p, d);
          const team = d.teams[p.teamId];
          const isOpen = expanded === `${w.id}:${p.id}`;
          return (
            <li key={p.id}>
              <button onClick={() => setExpanded(isOpen ? null : `${w.id}:${p.id}`)} aria-expanded={isOpen} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#131b28]">
                <PlayerAvatar nickname={p.nickname} team={team} size={44} ring={p.isCaptain ? "captain" : null} className={cn(s.kind === "eliminated" && "opacity-55")} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[0.9375rem] font-semibold text-ink">{p.nickname}</span>
                    {p.isCaptain ? (
                      <span className="inline-flex h-5 items-center gap-0.5 rounded-full bg-lavender-soft px-1.5 text-[0.625rem] font-bold text-lavender">
                        <Icon name="star" size={10} strokeWidth={2.6} /> C ×{d.rules.captainMultiplier}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-footnote text-ink-3">
                    <span className="inline-block size-1.5 rounded-full" style={{ background: team?.color }} aria-hidden />
                    {team?.acronym}
                    <span
                      className={cn(
                        "ml-1 inline-flex items-center gap-1 font-medium",
                        s.kind === "live" && "text-live",
                        s.kind === "eliminated" && "text-negative",
                        s.kind === "dnp" && "text-warning",
                        s.kind === "next" && "text-ink-2",
                      )}
                    >
                      {s.kind === "live" ? <span className="size-1.5 rounded-full bg-live motion-safe:animate-pulse-dot" aria-hidden /> : null}
                      {s.text}
                    </span>
                    {p.status.kind === "next" ? (
                      <span className="text-ink-3">
                        · <LocalTime iso={p.status.at} format="time" />
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="text-right">
                  <div className="tabular text-headline text-ink">{pts(p.points)}</div>
                  <div className="tabular text-caption text-ink-3">{money(p.price)}</div>
                </div>
                <Icon name="chevronDown" size={18} className={cn("shrink-0 text-ink-3 transition-transform", isOpen && "rotate-180")} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                    <div className="px-4 pb-4">
                      <Breakdown player={p} matches={d.matches} teams={d.teams} captainMultiplier={d.rules.captainMultiplier} />
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </li>
          );
        })}
        {players.length < d.rules.rosterSize ? (
          <li className="px-4 py-3 text-footnote text-warning">
            {d.rules.rosterSize - players.length} empty slot{d.rules.rosterSize - players.length > 1 ? "s" : ""}: no legal replacement was available.
          </li>
        ) : null}
      </ul>
      <p className="text-caption text-ink-3">Tap a player to see exactly how their points were calculated.</p>
    </div>
  );
}

function nameOf(id: string | null, d: EntryDashboard): string {
  if (!id) return "—";
  for (const w of d.windows) {
    const p = w.players.find((x) => x.id === id);
    if (p) return p.nickname;
  }
  return id.replace(/^demo-player-/, "");
}

function BoardPreview({ d, board }: { d: EntryDashboard; board: Board }) {
  const rows = board.rows.slice(0, 5);
  const meVisible = rows.some((r) => r.entryId === d.entry.id);
  return (
    <section aria-labelledby="board-h" className="rounded-2xl border border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 id="board-h" className="text-headline text-ink">
          Leaderboard
        </h2>
        <Link href={`/c/${d.contest.id}/leaderboard`} className="text-callout font-medium text-accent">
          Full standings
        </Link>
      </div>
      {board.total === 0 ? (
        <p className="text-callout text-ink-2">Standings appear once the first stage locks.</p>
      ) : (
        <ol className="space-y-0.5">
          {rows.map((r) => (
            <BoardLine key={r.entryId} r={r} me={r.entryId === d.entry.id} />
          ))}
          {!meVisible && board.me ? (
            <>
              <li className="py-0.5 text-center text-ink-3" aria-hidden>
                ⋯
              </li>
              <BoardLine r={board.me} me />
            </>
          ) : null}
        </ol>
      )}
    </section>
  );
}

function BoardLine({ r, me }: { r: Board["rows"][number]; me: boolean }) {
  return (
    <li>
      <Link href={`/e/${r.entryId}`} className={cn("flex h-10 items-center gap-2.5 rounded-lg px-2 text-callout", me ? "bg-lavender-soft" : "hover:bg-elevated")}>
        <span className="tabular w-8 text-right text-footnote text-ink-3">{r.rank}</span>
        <span className={cn("min-w-0 flex-1 truncate", me ? "font-semibold text-ink" : "text-ink-2")}>
          {r.username}
          {me ? " (you)" : ""}
        </span>
        <span className="tabular font-semibold text-ink">{pts(r.points)}</span>
      </Link>
    </li>
  );
}

function Upcoming({ d, w }: { d: EntryDashboard; w: DashboardWindow | undefined }) {
  if (!w || !w.visible) return null;
  const teamIds = new Set(w.players.map((p) => p.teamId));
  const list = d.matches
    .filter((m) => m.stageId === w.stageId && (m.status === "scheduled" || m.status === "live" || m.status === "postponed") && (teamIds.has(m.teamAId) || teamIds.has(m.teamBId)))
    .slice(0, 6);
  return (
    <section aria-labelledby="up-h" className="rounded-2xl border border-border bg-surface p-4">
      <h2 id="up-h" className="mb-2 text-headline text-ink">
        Your players&apos; matches
      </h2>
      {list.length === 0 ? (
        <p className="text-callout text-ink-2">
          {d.matches.some((m) => m.stageId === w.stageId)
            ? `No remaining matches for your players in ${w.stageName}.`
            : `Fixtures appear when ${w.stageName} pairings are set, about a day before it starts.`}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {list.map((m) => (
            <li key={m.id} className="flex items-center gap-2 rounded-xl bg-elevated px-3 py-2 text-footnote">
              <span className={cn("font-semibold", teamIds.has(m.teamAId) ? "text-ink" : "text-ink-2")}>{d.teams[m.teamAId]?.acronym}</span>
              <span className="text-ink-3">vs</span>
              <span className={cn("font-semibold", teamIds.has(m.teamBId) ? "text-ink" : "text-ink-2")}>{d.teams[m.teamBId]?.acronym}</span>
              <span className="text-caption text-ink-3">BO{m.format}</span>
              <span className="ml-auto">
                {m.status === "live" ? (
                  <StatePill kind="live" />
                ) : m.status === "postponed" ? (
                  <StatePill kind="postponed" />
                ) : (
                  <LocalTime iso={m.scheduledAt} className="text-ink-2" />
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AutopilotCard({ d }: { d: EntryDashboard }) {
  const [on, setOn] = useState(d.entry.autopilot);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const done = d.contest.status === "completed";
  async function toggle() {
    setBusy(true);
    const next = !on;
    setOn(next);
    const res = await fetch(`/api/entries/${d.entry.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ autopilot: next }) });
    setBusy(false);
    if (!res.ok) {
      setOn(!next);
      toast("Couldn't change Autopilot", "error");
    } else {
      toast(next ? "Autopilot on" : "Autopilot off", "success");
      router.refresh();
    }
  }
  return (
    <section aria-labelledby="ap-h" className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-lavender-soft text-lavender">
          <Icon name="autopilot" size={18} />
        </span>
        <div className="flex-1">
          <h2 id="ap-h" className="text-headline text-ink">
            Autopilot
          </h2>
          <p className="mt-0.5 text-footnote text-ink-2">Replaces eliminated players with the most-picked affordable player if you miss a window. Never touches players still in.</p>
        </div>
        <button
          role="switch"
          aria-checked={on}
          aria-labelledby="ap-h"
          disabled={busy || done}
          onClick={toggle}
          className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50", on ? "bg-accent" : "bg-raised ring-1 ring-border-strong")}
        >
          <span className={cn("absolute top-0.5 left-0 size-6 rounded-full bg-white shadow transition-transform", on ? "translate-x-[22px]" : "translate-x-0.5")} />
        </button>
      </div>
    </section>
  );
}
