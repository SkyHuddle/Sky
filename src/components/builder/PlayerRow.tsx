"use client";

import { memo } from "react";
import { motion } from "motion/react";
import type { RosterError } from "@/domain/rules";
import { cn } from "@/lib/cn";
import { money, pts } from "@/lib/format";
import type { TeamLite } from "@/server/queries/common";
import type { PoolPlayerView } from "@/server/queries/contest";
import { Icon } from "../ui/Icon";
import { PlayerAvatar, TeamMark } from "../ui/identity";
import { FormBars } from "../ui/primitives";

/**
 * One row in the player pool (DESIGN.md §5.3): 72px, portrait, name, team and role, salary and
 * average, and a 44px add/remove button. The row body opens the player sheet; the button selects
 * immediately. Selection shows as a mint strip and a filled check, never a painted row. A player who
 * can't be added stays visible, with the reason in words.
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
    <li className={cn("group relative flex min-h-[72px] items-center gap-3 py-2 pr-1 pl-3 transition-colors sm:pl-4", !selected && "hover:bg-elevated/60")}>
      <span className={cn("absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-accent transition-opacity duration-150", selected ? "opacity-100" : "opacity-0")} aria-hidden />
      <button onClick={() => onOpen(p.id)} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left" aria-label={`${p.nickname}, ${team?.name}, ${money(p.price)}. View details`}>
        <span className="relative shrink-0">
          <PlayerAvatar nickname={p.nickname} team={team} size={48} shape="tile" className={cn(disabled && "opacity-55")} />
          {captain ? (
            <span className="absolute -top-1 -right-1 inline-flex size-[18px] items-center justify-center rounded-full bg-lavender text-lavender-ink ring-2 ring-bg" aria-hidden>
              <Icon name="star" size={10} strokeWidth={2.6} />
            </span>
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-[0.9375rem] leading-5 font-semibold", disabled ? "text-ink-2" : "text-ink")}>{p.nickname}</span>
          {block && !selected ? (
            <span className={cn("mt-0.5 line-clamp-2 block text-footnote leading-4", block.code === "OVER_CAP" ? "text-warning" : "text-ink-2")}>{block.message}</span>
          ) : (
            <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-footnote text-ink-2">
              <TeamMark team={team} size={14} />
              <span className="truncate">{team?.name}</span>
              <span className="shrink-0 text-ink-3">· {p.role}</span>
              {opponent ? <span className="hidden shrink-0 text-ink-3 sm:inline">· vs {opponent.acronym}</span> : null}
            </span>
          )}
        </span>
        <span className="hidden w-14 shrink-0 justify-end md:flex">
          <FormBars values={p.form} />
        </span>
        <span className="w-[68px] shrink-0 text-right">
          <span className={cn("num block text-callout", disabled ? "text-ink-2" : "text-ink")}>{money(p.price)}</span>
          <span className="tabular block text-footnote text-ink-3">
            {p.held ? "price paid" : metric === "owned" && p.ownership !== null ? `${Math.round(p.ownership * 100)}% owned` : `${pts(p.avgPoints)} avg`}
          </span>
        </span>
      </button>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => onToggle(p.id)}
        disabled={disabled}
        aria-pressed={selected}
        aria-label={selected ? `Remove ${p.nickname}` : disabled ? `${p.nickname} can't be added: ${block?.message}` : `Add ${p.nickname}`}
        className={cn(
          "inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors duration-150",
          selected ? "bg-accent text-accent-ink" : disabled ? "text-ink-3" : "text-accent ring-1 ring-accent/45 ring-inset hover:bg-accent-soft",
        )}
      >
        <Icon name={selected ? "check" : disabled ? "lock" : "plus"} size={19} strokeWidth={2.4} />
      </motion.button>
    </li>
  );
});
