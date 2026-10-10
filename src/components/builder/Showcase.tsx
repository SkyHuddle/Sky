"use client";

import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import type { TeamLite } from "@/server/queries/common";
import { PortraitSvg } from "../ui/art";
import { Icon } from "../ui/Icon";
import { rgba, TeamMark } from "../ui/identity";

export interface ShowcasePlayer {
  id: string;
  nickname: string;
  team: TeamLite | undefined;
  price: number;
  eliminated?: boolean;
}

/**
 * The completed lineup as a poster (DESIGN.md §5.5): captain in the centre, two players either side.
 * Portraits dominate; names, teams and salaries stay readable at 375px. With `onCaptain`, tapping a
 * player makes them captain and they glide to the centre.
 */
export function LineupShowcase({
  players,
  captainId,
  captainMultiplier,
  onCaptain,
  header,
  footer,
}: {
  players: ShowcasePlayer[];
  captainId: string | null;
  captainMultiplier: number;
  onCaptain?: (id: string) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const captain = players.find((p) => p.id === captainId) ?? null;
  const centre = captain ?? players[0] ?? null;
  const rest = players.filter((p) => p.id !== centre?.id);
  const left = rest.slice(0, 2);
  const right = rest.slice(2, 4);

  const card = (p: ShowcasePlayer, big: boolean) => {
    const isCaptain = p.id === captainId;
    const color = p.team?.color ?? "#788ba0";
    const body = (
      <>
        <span className="absolute inset-0" style={{ background: rgba(color, big ? 0.3 : 0.22) }} aria-hidden />
        <PortraitSvg
          seed={p.nickname}
          color={color}
          team={p.team}
          className={cn("absolute left-1/2 max-w-none -translate-x-1/2", big ? "bottom-[18%] h-[68%] w-auto" : "top-[3%] h-auto w-[70%]", p.eliminated && "opacity-45 grayscale")}
        />
        <span className={cn("absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,var(--color-elevated)_45%,transparent)]", big ? "h-[42%]" : "h-[50%]")} aria-hidden />
        {isCaptain ? (
          <span className="absolute top-2.5 left-1/2 inline-flex h-6 -translate-x-1/2 items-center gap-1 rounded-full bg-lavender px-2 text-caption font-semibold whitespace-nowrap text-lavender-ink">
            <Icon name="star" size={12} strokeWidth={2.4} /> Captain {captainMultiplier}×
          </span>
        ) : null}
        {p.eliminated ? <span className="absolute top-2.5 right-2.5 rounded-full bg-negative-soft px-2 py-0.5 text-caption font-semibold text-negative">Out</span> : null}
        <span className={cn("absolute inset-x-0 bottom-0 text-left", big ? "p-3.5" : "p-2.5")}>
          <span className={cn("font-display block truncate font-bold uppercase text-ink", big ? "text-[1.75rem] leading-7" : "text-[1.25rem] leading-6")}>{p.nickname}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-caption text-ink-2">
            <TeamMark team={p.team} size={big ? 16 : 14} />
            <span className="truncate">{big ? p.team?.name : p.team?.acronym}</span>
          </span>
          <span className={cn("num mt-1 block text-ink", big ? "text-callout" : "text-footnote")}>{money(p.price)}</span>
        </span>
      </>
    );
    const cls = cn(
      "relative block h-full w-full overflow-hidden rounded-2xl bg-elevated text-left",
      isCaptain ? "ring-2 ring-lavender" : "ring-1 ring-border ring-inset",
      onCaptain && !isCaptain && !p.eliminated && "transition-transform hover:-translate-y-0.5",
    );
    return (
      <motion.div key={p.id} layoutId={reduce ? undefined : `show-${p.id}`} transition={{ type: "spring", stiffness: 380, damping: 34 }} className={big ? "h-full" : "aspect-[5/8] w-full sm:aspect-[3/4]"}>
        {onCaptain && !p.eliminated ? (
          <button onClick={() => onCaptain(p.id)} aria-pressed={isCaptain} aria-label={isCaptain ? `${p.nickname}, captain` : `Make ${p.nickname} captain`} className={cls}>
            {body}
          </button>
        ) : (
          <div className={cls}>{body}</div>
        )}
      </motion.div>
    );
  };

  return (
    <section aria-label="Your lineup" className="overflow-hidden rounded-2xl bg-surface">
      {header ? <div className="px-4 pt-4 sm:px-5 sm:pt-5">{header}</div> : null}
      <LayoutGroup>
        <div className="grid grid-cols-[1fr_1.3fr_1fr] gap-2 p-3 sm:gap-3 sm:p-5">
          <div className="flex flex-col gap-2 sm:gap-3">{left.map((p) => card(p, false))}</div>
          <div className="min-h-0">{centre ? card(centre, true) : null}</div>
          <div className="flex flex-col gap-2 sm:gap-3">{right.map((p) => card(p, false))}</div>
        </div>
      </LayoutGroup>
      {footer ? <div className="border-t border-border px-4 py-3 sm:px-5">{footer}</div> : null}
    </section>
  );
}
