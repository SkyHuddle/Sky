"use client";

import { memo } from "react";
import { motion } from "motion/react";
import type { RosterError } from "@/domain/rules";
import { cn } from "@/lib/cn";
import { money, pts } from "@/lib/format";
import type { TeamLite } from "@/server/queries/common";
import type { PoolPlayerView } from "@/server/queries/contest";
import { Icon } from "../ui/Icon";
import { PlayerAvatar } from "../ui/identity";
import { FormBars } from "../ui/primitives";

/**
 * One row in the player pool: compact, scannable, one tap to add. The row opens details; the
 * round button adds/removes. A blocked player stays visible with the reason in words.
 */
export const PlayerRow = memo(function PlayerRow({
  p,
  team,
  opponent,
  selected,
  captain,
  block,
  metric,
  onToggle,
  onOpen,
}: {
  p: PoolPlayerView;
  team: TeamLite | undefined;
  opponent: TeamLite | undefined;
  selected: boolean;
  captain: boolean;
  block: RosterError | null;
  metric: "avg" | "form" | "value" | "owned";
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const disabled = !selected && !!block;
  return (
    <li className={cn("group relative flex items-center gap-3 px-3 py-2.5 transition-colors sm:px-4", selected ? "bg-accent-soft/60" : "hover:bg-surface")}>
      <button onClick={() => onOpen(p.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`${p.nickname}, ${team?.name}, ${money(p.price)}. View details`}>
        <PlayerAvatar nickname={p.nickname} team={team} size={42} ring={captain ? "captain" : selected ? "selected" : null} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className={cn("truncate text-[0.9375rem] font-semibold", disabled ? "text-ink-2" : "text-ink")}>{p.nickname}</span>
            {captain ? <Icon name="star" size={13} className="shrink-0 text-lavender" strokeWidth={2.4} /> : null}
            <span className="shrink-0 rounded px-1 text-[0.625rem] font-semibold tracking-wide text-ink-3 ring-1 ring-border">{p.role}</span>
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 truncate text-footnote text-ink-3">
            {block && !selected ? (
              <span className={cn("truncate font-medium", block.code === "OVER_CAP" ? "text-warning" : "text-ink-2")}>{block.message}</span>
            ) : (
              <>
                <span className="inline-block size-1.5 shrink-0 rounded-full" style={{ background: team?.color }} aria-hidden />
                <span className="truncate">{team?.acronym}</span>
                {opponent ? <span className="truncate">· vs {opponent.acronym}</span> : null}
              </>
            )}
          </span>
        </span>
        <span className="hidden w-14 shrink-0 justify-end sm:flex">
          <FormBars values={p.form} />
        </span>
        <span className="w-[68px] shrink-0 text-right">
          <span className={cn("tabular block text-[0.9375rem] font-semibold", disabled && block?.code === "OVER_CAP" ? "text-warning" : "text-ink")}>{money(p.price)}</span>
          <span className="tabular block text-caption text-ink-3">
            {p.held ? "price paid" : metric === "owned" && p.ownership !== null ? `${Math.round(p.ownership * 100)}% owned` : metric === "value" ? `${pts((p.avgPoints / p.price) * 10000, 2)}/10k` : `${pts(p.avgPoints)} avg`}
          </span>
        </span>
      </button>
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={() => onToggle(p.id)}
        disabled={disabled}
        aria-pressed={selected}
        aria-label={selected ? `Remove ${p.nickname}` : disabled ? `${p.nickname} can't be added: ${block?.message}` : `Add ${p.nickname}`}
        className={cn(
          "inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-colors",
          selected ? "bg-accent text-accent-ink" : disabled ? "bg-elevated text-ink-3 opacity-60" : "bg-elevated text-accent ring-1 ring-border-strong hover:bg-raised",
        )}
      >
        <Icon name={selected ? "check" : disabled ? "lock" : "plus"} size={18} strokeWidth={2.4} />
      </motion.button>
    </li>
  );
});
