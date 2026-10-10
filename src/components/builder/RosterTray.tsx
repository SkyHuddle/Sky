"use client";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import type { BuilderData } from "@/server/queries/contest";
import { Icon } from "../ui/Icon";
import { PlayerAvatar } from "../ui/identity";
import type { BuilderState } from "./useBuilder";

/**
 * The roster at a glance: money left and players picked (the two numbers every decision turns on),
 * a salary bar, and five slots that fill with portraits. Compact enough to stay pinned on phones.
 */
export function RosterTray({ data, b, onOpenPlayer, className }: { data: BuilderData; b: BuilderState; onOpenPlayer: (id: string) => void; className?: string }) {
  const size = data.rules.rosterSize;
  const slots = Array.from({ length: size }, (_, i) => b.playerIds[i] ?? null);
  const used = b.summary.salaryUsed;
  const pct = Math.min(100, (used / data.rules.salaryCap) * 100);
  const over = b.summary.salaryRemaining < 0;
  const perSlot = b.summary.averagePerOpenSlot !== null && b.summary.openSlots > 0 && !over ? Math.round(b.summary.averagePerOpenSlot / 1000) * 1000 : null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0" aria-live="polite">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={b.summary.salaryRemaining}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className={cn("num text-[1.875rem] leading-none", over ? "text-negative" : "text-accent")}
            >
              {money(b.summary.salaryRemaining)}
            </motion.div>
          </AnimatePresence>
          <div className="mt-1 text-caption text-ink-2">
            {over ? "Over the cap" : "Salary left"}
            {perSlot !== null ? <span className="text-ink-3"> · {money(perSlot)} per open slot</span> : null}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-caption text-ink-2">
            <span className="num text-[1.875rem] leading-none text-ink">{b.playerIds.length}</span>
            <span className="num text-[1.125rem] text-ink-3">/{size}</span> players
          </div>
        </div>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-elevated" role="meter" aria-label="Salary used" aria-valuemin={0} aria-valuemax={data.rules.salaryCap} aria-valuenow={used}>
        <motion.div className={cn("h-full rounded-full", over ? "bg-negative" : "bg-accent")} initial={false} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 260, damping: 30 }} />
      </div>

      <ol className="grid grid-cols-5 gap-2" aria-label={`Your roster, ${b.playerIds.length} of ${size} players`}>
        {slots.map((id, i) => {
          const p = id ? b.byId.get(id) : null;
          const out = id ? b.ineligible.get(id) : null;
          const team = p ? data.teams[p.teamId] : out ? data.teams[out.teamId] : null;
          const name = p?.nickname ?? out?.nickname ?? null;
          const isCaptain = !!id && id === b.captainId;
          return (
            <li key={i} className="min-w-0">
              {id && name ? (
                <button
                  onClick={() => onOpenPlayer(id)}
                  className="group flex w-full flex-col gap-1"
                  aria-label={`${name}${isCaptain ? ", captain" : ""}${out ? ", eliminated" : ""}. Open details`}
                >
                  <motion.span
                    key={id}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 520, damping: 28 }}
                    className={cn(
                      "relative block aspect-[4/5] w-full rounded-[14px]",
                      isCaptain ? "ring-2 ring-lavender ring-offset-2 ring-offset-bg" : out ? "ring-1 ring-negative/60" : "",
                    )}
                  >
                    <PlayerAvatar nickname={name} team={team} size="fill" shape="tile" className={cn(out && "opacity-45 grayscale")} />
                    {isCaptain ? (
                      <span className="absolute -top-1.5 -right-1.5 inline-flex size-5 items-center justify-center rounded-full bg-lavender text-[#1b1035] ring-2 ring-bg" aria-hidden>
                        <Icon name="star" size={11} strokeWidth={2.6} />
                      </span>
                    ) : null}
                    {out ? (
                      <span className="absolute inset-x-1 bottom-1 rounded-md bg-negative py-0.5 text-center text-[0.625rem] font-bold text-[#2a0a0e]" aria-hidden>
                        OUT
                      </span>
                    ) : null}
                  </motion.span>
                  <span className={cn("w-full truncate text-center text-[0.6875rem] font-semibold", out ? "text-negative" : "text-ink-2 group-hover:text-ink")}>{name}</span>
                </button>
              ) : (
                <div className="flex w-full flex-col gap-1">
                  <span className="flex aspect-[4/5] w-full items-center justify-center rounded-[14px] border border-dashed border-border-strong bg-white/[0.02] text-ink-3">
                    <span className="inline-flex size-7 items-center justify-center rounded-full ring-1 ring-border-strong">
                      <Icon name="plus" size={15} />
                    </span>
                  </span>
                  <span className="text-center text-[0.6875rem] text-ink-3">Slot {i + 1}</span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
