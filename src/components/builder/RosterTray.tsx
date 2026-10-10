"use client";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import type { BuilderData } from "@/server/queries/contest";
import { Icon } from "../ui/Icon";
import { PlayerAvatar } from "../ui/identity";
import type { BuilderState } from "./useBuilder";

/**
 * The compact roster: five slots, players picked, money left, a slim salary bar.
 * Stays small while searching; the full roster lives on the review screen.
 */
export function RosterTray({ data, b, onOpenPlayer, className }: { data: BuilderData; b: BuilderState; onOpenPlayer: (id: string) => void; className?: string }) {
  const size = data.rules.rosterSize;
  const slots = Array.from({ length: size }, (_, i) => b.playerIds[i] ?? null);
  const used = b.summary.salaryUsed;
  const pct = Math.min(100, (used / data.rules.salaryCap) * 100);
  const over = b.summary.salaryRemaining < 0;

  return (
    <div className={cn("space-y-3", className)}>
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
                <button onClick={() => onOpenPlayer(id)} className="group flex w-full flex-col items-center gap-1 rounded-xl py-1" aria-label={`${name}${isCaptain ? ", captain" : ""}${out ? ", eliminated" : ""}. Open details`}>
                  <motion.span key={id} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 520, damping: 26 }} className="relative">
                    <PlayerAvatar nickname={name} team={team} size={46} ring={isCaptain ? "captain" : null} className={cn(out && "opacity-50 grayscale")} />
                    {isCaptain ? (
                      <span className="absolute -right-1 -bottom-1 inline-flex size-[18px] items-center justify-center rounded-full bg-lavender text-[#1b1035] ring-2 ring-bg" aria-hidden>
                        <Icon name="star" size={11} strokeWidth={2.6} />
                      </span>
                    ) : null}
                    {out ? (
                      <span className="absolute -right-1 -bottom-1 inline-flex size-[18px] items-center justify-center rounded-full bg-negative text-[#2a0a0e] ring-2 ring-bg" aria-hidden>
                        <Icon name="x" size={11} strokeWidth={3} />
                      </span>
                    ) : null}
                  </motion.span>
                  <span className={cn("w-full truncate text-center text-[0.6875rem] font-medium", out ? "text-negative" : "text-ink-2 group-hover:text-ink")}>{out ? "Out" : name}</span>
                </button>
              ) : (
                <div className="flex w-full flex-col items-center gap-1 py-1">
                  <span className="inline-flex size-[46px] items-center justify-center rounded-full border border-dashed border-border-strong text-ink-3">
                    <Icon name="plus" size={18} />
                  </span>
                  <span className="text-[0.6875rem] text-ink-3">Slot {i + 1}</span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <div>
        <div className="flex items-baseline justify-between text-footnote">
          <span className="text-ink-2">
            <span className="tabular font-semibold text-ink">{b.playerIds.length}</span>/{size} players
          </span>
          <span className="text-ink-2" aria-live="polite">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={b.summary.salaryRemaining}
                initial={{ y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -6, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className={cn("tabular inline-block font-semibold", over ? "text-negative" : "text-ink")}
              >
                {money(b.summary.salaryRemaining)}
              </motion.span>
            </AnimatePresence>{" "}
            left
            {b.summary.averagePerOpenSlot !== null && b.summary.openSlots > 0 && !over ? (
              <span className="text-ink-3"> · {money(Math.round(b.summary.averagePerOpenSlot / 1000) * 1000)}/slot</span>
            ) : null}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-elevated" role="meter" aria-label="Salary used" aria-valuemin={0} aria-valuemax={data.rules.salaryCap} aria-valuenow={used}>
          <motion.div className={cn("h-full rounded-full", over ? "bg-negative" : "bg-accent")} initial={false} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 260, damping: 30 }} />
        </div>
      </div>
    </div>
  );
}
