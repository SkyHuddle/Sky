"use client";

import { memo } from "react";
import { motion } from "motion/react";
import type { RosterError } from "@/domain/rules";
import { cn } from "@/lib/cn";
import { money, pts } from "@/lib/format";
import type { TeamLite } from "@/server/queries/common";
import type { PoolPlayerView } from "@/server/queries/contest";
import { Icon } from "../ui/Icon";
import { PlayerAvatar, rgba, TeamMark } from "../ui/identity";
import { FormBars } from "../ui/primitives";

/**
 * One row in the player pool: portrait, team, salary, one tap to add. The row opens details; the
 * square button adds/removes. A blocked player stays visible with the reason in words.
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
  const color = team?.color ?? "#6f7d92";
  return (
    <li
      className={cn(
        "group relative flex items-center gap-3 overflow-hidden rounded-[18px] border py-2 pr-2.5 pl-2 transition-colors",
        selected ? "border-accent/45 bg-accent-soft/40" : "border-border bg-surface hover:border-border-strong",
      )}
      style={{ backgroundImage: `linear-gradient(90deg, ${rgba(color, selected ? 0.1 : 0.13)} 0%, transparent 42%)` }}
    >
      <button onClick={() => onOpen(p.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`${p.nickname}, ${team?.name}, ${money(p.price)}. View details`}>
        <span className="relative shrink-0">
          <PlayerAvatar nickname={p.nickname} team={team} size={56} shape="tile" className={cn(disabled && "opacity-60")} />
          {captain ? (
            <span className="absolute -top-1 -right-1 inline-flex size-[18px] items-center justify-center rounded-full bg-lavender text-[#1b1035] ring-2 ring-surface" aria-hidden>
              <Icon name="star" size={10} strokeWidth={2.6} />
            </span>
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className={cn("truncate text-[1rem] font-semibold tracking-tight", disabled ? "text-ink-2" : "text-ink")}>{p.nickname}</span>
            <span className="shrink-0 rounded-md bg-white/[0.06] px-1.5 py-px text-[0.625rem] font-semibold tracking-wide text-ink-2">{p.role}</span>
          </span>
          {block && !selected ? (
            <span className={cn("mt-1 block truncate text-footnote font-medium", block.code === "OVER_CAP" ? "text-warning" : "text-ink-2")}>{block.message}</span>
          ) : (
            <span className="mt-1 flex items-center gap-1.5 truncate text-footnote text-ink-2">
              <TeamMark team={team} size={16} />
              <span className="truncate">{team?.name}</span>
              {opponent ? <span className="shrink-0 text-ink-3">· vs {opponent.acronym}</span> : null}
            </span>
          )}
        </span>
        <span className="hidden w-14 shrink-0 justify-end sm:flex">
          <FormBars values={p.form} />
        </span>
        <span className="w-[72px] shrink-0 text-right">
          <span className={cn("num block text-[1.125rem] leading-tight", disabled ? "text-ink-2" : "text-ink")}>{money(p.price)}</span>
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
          "inline-flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
          selected
            ? "bg-accent text-accent-ink shadow-[0_6px_18px_-8px_rgb(92_227_203/0.8)]"
            : disabled
              ? "bg-elevated text-ink-3 opacity-60"
              : "bg-accent-soft text-accent ring-1 ring-accent/35 hover:bg-accent/20",
        )}
      >
        <Icon name={selected ? "check" : disabled ? "lock" : "plus"} size={18} strokeWidth={2.4} />
      </motion.button>
    </li>
  );
});
