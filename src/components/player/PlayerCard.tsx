import { cn } from "@/lib/cn";
import { initials, money, pts } from "@/lib/format";
import type { TeamLite } from "@/server/queries/common";
import { Icon } from "../ui/Icon";
import { Flag, rgba } from "../ui/identity";

/**
 * The "team announcement" card used on roster review, confirmation and sharing.
 * A tall portrait frame: team-tinted field, oversized initials (photo slot when licensed),
 * the team's acronym as a watermark, and the facts that matter.
 */
export function PlayerCard({
  player,
  team,
  captain,
  size = "md",
  footer,
  className,
  eliminated,
}: {
  player: { nickname: string; role: string; nationality: string; price: number; avgPoints?: number };
  team: TeamLite | null | undefined;
  captain?: boolean;
  size?: "md" | "lg";
  footer?: React.ReactNode;
  className?: string;
  eliminated?: boolean;
}) {
  const color = team?.color ?? "#6f7d92";
  const lg = size === "lg";
  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-[20px] border bg-surface",
        captain ? "border-lavender/60" : "border-border",
        eliminated && "opacity-60",
        className,
      )}
      style={{ boxShadow: captain ? "0 0 0 1px rgb(167 139 250 / 0.25), 0 18px 50px -20px rgb(167 139 250 / 0.35)" : undefined }}
    >
      <div
        className={cn("relative overflow-hidden", lg ? "h-44 sm:h-52" : "h-32")}
        style={{ background: `radial-gradient(130% 110% at 25% 0%, ${rgba(color, 0.5)} 0%, ${rgba(color, 0.16)} 48%, #111824 100%)` }}
      >
        <span
          className="pointer-events-none absolute -right-2 -bottom-6 font-black tracking-tighter select-none"
          style={{ color: rgba(color, 0.14), fontSize: lg ? 120 : 84, lineHeight: 1 }}
          aria-hidden
        >
          {team?.acronym ?? ""}
        </span>
        <span
          className="absolute left-4 font-semibold tracking-tight text-ink/95"
          style={{ fontSize: lg ? 64 : 44, bottom: lg ? 10 : 6, letterSpacing: "-0.04em" }}
          aria-hidden
        >
          {initials(player.nickname)}
        </span>
        {captain ? (
          <span className="absolute top-3 left-3 inline-flex h-6 items-center gap-1 rounded-full bg-lavender px-2 text-[0.6875rem] font-bold text-[#1b1035]">
            <Icon name="star" size={12} strokeWidth={2.4} /> Captain 1.5×
          </span>
        ) : null}
        {eliminated ? (
          <span className="absolute top-3 right-3 inline-flex h-6 items-center rounded-full bg-negative-soft px-2 text-[0.6875rem] font-bold text-negative">Eliminated</span>
        ) : null}
      </div>
      <div className={cn("flex flex-1 flex-col", lg ? "p-4" : "p-3")}>
        <div className="flex items-center gap-1.5">
          <span className={cn("truncate font-semibold tracking-tight text-ink", lg ? "text-title" : "text-headline")}>{player.nickname}</span>
          <Flag code={player.nationality} className="text-[0.9rem]" />
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 truncate text-footnote text-ink-2">
          <span className="inline-block size-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
          <span className="truncate">{team?.name}</span>
          <span className="text-ink-3">· {player.role}</span>
        </div>
        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <div className="text-caption text-ink-3">Salary</div>
            <div className="tabular text-callout font-semibold text-ink">{money(player.price)}</div>
          </div>
          {player.avgPoints !== undefined ? (
            <div className="text-right">
              <div className="text-caption text-ink-3">Avg / map</div>
              <div className="tabular text-callout font-semibold text-ink">{pts(player.avgPoints)}</div>
            </div>
          ) : null}
        </div>
        {footer ? <div className="mt-3">{footer}</div> : null}
      </div>
    </div>
  );
}
