"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import type { BuilderData } from "@/server/queries/contest";
import { IconButton } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { PlayerAvatar, TeamMark } from "../ui/identity";
import type { BuilderState } from "./useBuilder";

/** Salary left (the number every pick turns on), players picked, and a subordinate bar. */
export function SalarySummary({ data, b, onOpenLineup, className }: { data: BuilderData; b: BuilderState; onOpenLineup?: () => void; className?: string }) {
  const size = data.rules.rosterSize;
  const used = b.summary.salaryUsed;
  const pct = Math.min(100, (used / data.rules.salaryCap) * 100);
  const over = b.summary.salaryRemaining < 0;
  const reduce = useReducedMotion();
  const count = (
    <span className="text-footnote text-ink-2">
      <span className="num text-headline text-ink">{b.playerIds.length}</span> of {size} players
    </span>
  );
  return (
    <div className={className}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0" aria-live="polite">
          <div className="text-caption text-ink-3">{over ? "Over the cap by" : "Salary left"}</div>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={b.summary.salaryRemaining}
              initial={reduce ? false : { y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduce ? undefined : { y: -6, opacity: 0 }}
              transition={{ duration: 0.16 }}
              className={cn("font-display text-[1.875rem] leading-8 font-bold tabular-nums", over ? "text-negative" : "text-ink")}
            >
              {money(Math.abs(b.summary.salaryRemaining))}
            </motion.div>
          </AnimatePresence>
        </div>
        {onOpenLineup ? (
          <button onClick={onOpenLineup} className="-mr-2 inline-flex h-11 items-center gap-1 rounded-xl px-2 hover:bg-elevated" aria-label={`${b.playerIds.length} of ${size} players. View lineup`}>
            {count}
            <Icon name="chevronRight" size={16} className="text-ink-3" />
          </button>
        ) : (
          count
        )}
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-raised" role="meter" aria-label="Salary used" aria-valuemin={0} aria-valuemax={data.rules.salaryCap} aria-valuenow={used}>
        <motion.div className={cn("h-full rounded-full", over ? "bg-negative" : "bg-accent")} initial={false} animate={{ width: `${pct}%` }} transition={{ duration: reduce ? 0 : 0.2 }} />
      </div>
      <div className="mt-1 flex justify-between text-caption text-ink-3">
        <span className="tabular">{money(used)} used</span>
        <span className="tabular">{money(data.rules.salaryCap)} cap</span>
      </div>
    </div>
  );
}

/** Five neutral slots (no forced positions): portrait + nickname when filled. */
export function RosterSlots({ data, b, onOpenPlayer, className }: { data: BuilderData; b: BuilderState; onOpenPlayer: (id: string) => void; className?: string }) {
  const size = data.rules.rosterSize;
  const slots = Array.from({ length: size }, (_, i) => b.playerIds[i] ?? null);
  return (
    <ol className={cn("grid grid-cols-5 gap-1", className)} aria-label={`Your lineup, ${b.playerIds.length} of ${size} players`}>
      {slots.map((id, i) => {
        const p = id ? b.byId.get(id) : null;
        const out = id ? b.ineligible.get(id) : null;
        const team = p ? data.teams[p.teamId] : out ? data.teams[out.teamId] : null;
        const name = p?.nickname ?? out?.nickname ?? null;
        const captain = !!id && id === b.captainId;
        return (
          <li key={i} className="flex min-w-0 flex-col items-center">
            {id && name ? (
              <button onClick={() => onOpenPlayer(id)} className="flex w-full min-w-0 flex-col items-center gap-1 rounded-xl py-0.5" aria-label={`${name}${captain ? ", captain" : ""}${out ? ", eliminated" : ""}. View details`}>
                <motion.span key={id} initial={b.lastAdded === id ? { scale: 0.8, opacity: 0 } : false} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.18 }} className="relative">
                  <PlayerAvatar nickname={name} team={team} size={44} ring={captain ? "captain" : null} muted={!!out} />
                  {out ? (
                    <span className="absolute -right-1 -bottom-1 inline-flex size-[18px] items-center justify-center rounded-full bg-negative text-negative-ink ring-2 ring-bg" aria-hidden>
                      <Icon name="x" size={11} strokeWidth={3} />
                    </span>
                  ) : null}
                </motion.span>
                <span className={cn("w-full truncate text-center text-caption", out ? "text-negative" : "text-ink-2")}>{out ? "Out" : name}</span>
              </button>
            ) : (
              <span className="flex w-full flex-col items-center gap-1 py-0.5">
                <span className="inline-flex size-11 items-center justify-center rounded-full bg-elevated text-caption text-ink-3">{i + 1}</span>
                <span className="text-caption text-ink-3">Empty</span>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** The expanded lineup: each pick with team, salary, captain choice and remove. */
export function LineupList({ data, b, onOpenPlayer }: { data: BuilderData; b: BuilderState; onOpenPlayer: (id: string) => void }) {
  if (b.playerIds.length === 0) {
    return <p className="rounded-xl bg-elevated px-3 py-4 text-center text-footnote text-ink-2">No players yet. Tap + on any player to add them.</p>;
  }
  return (
    <ul className="space-y-1">
      {b.playerIds.map((id) => {
        const p = b.byId.get(id);
        const out = b.ineligible.get(id);
        const team = data.teams[p?.teamId ?? out?.teamId ?? ""];
        const name = p?.nickname ?? out?.nickname ?? "?";
        const cap = id === b.captainId;
        return (
          <li key={id} className="flex min-h-[60px] items-center gap-3 rounded-xl px-1.5 py-1.5 hover:bg-elevated">
            <button onClick={() => onOpenPlayer(id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`${name}. View details`}>
              <PlayerAvatar nickname={name} team={team} size={40} muted={!!out} />
              <span className="min-w-0">
                <span className={cn("block truncate text-callout font-semibold", out ? "text-negative" : "text-ink")}>{name}</span>
                <span className="flex items-center gap-1.5 text-footnote text-ink-3">
                  <TeamMark team={team} size={14} />
                  {out ? "Eliminated · replace free" : <span className="tabular">{money(p?.price ?? 0)}</span>}
                </span>
              </span>
            </button>
            {!out ? (
              <IconButton
                icon="star"
                label={cap ? `${name} is captain` : `Make ${name} captain`}
                size={44}
                onClick={() => b.setCaptainId(id)}
                aria-pressed={cap}
                className={cn(cap ? "bg-lavender-soft text-lavender hover:text-lavender" : "text-ink-3")}
              />
            ) : null}
            <IconButton icon="x" label={`Remove ${name}`} size={44} onClick={() => b.remove(id)} className="text-ink-3" />
          </li>
        );
      })}
    </ul>
  );
}
