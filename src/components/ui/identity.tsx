import { cn } from "@/lib/cn";
import { flag, initials } from "@/lib/format";
import type { TeamLite } from "@/server/queries/common";
import { CrestSvg, PortraitSvg } from "./art";

/**
 * Team and player identity. No licensed photos or logos exist for the demo (and fictional players
 * have no likeness), so portraits and crests are generated (see ./art). Licensed images slot into
 * the same frames, so layouts never change.
 */

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const rgba = (hex: string, a: number) => {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${r} ${g} ${b} / ${a})`;
};

/** Team crest: a generated mark (shape + emblem from the team's name). Licensed logos replace it. */
export function TeamMark({ team, size = 24, className }: { team: TeamLite | null | undefined; size?: number; className?: string }) {
  if (!team) {
    return <span className={cn("inline-block shrink-0 rounded-md bg-elevated", className)} style={{ width: size, height: size }} aria-hidden />;
  }
  return (
    <span className={cn("inline-flex shrink-0", className)} style={{ width: size, height: size }} aria-hidden>
      <CrestSvg id={team.id} name={team.name} color={team.color} className="size-full" />
    </span>
  );
}

export function TeamTag({ team, className }: { team: TeamLite | null | undefined; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-ink-2", className)}>
      <span className="inline-block size-2 rounded-full" style={{ background: team?.color ?? "#6f7d92" }} aria-hidden />
      <span className="truncate">{team?.name ?? "Unknown team"}</span>
    </span>
  );
}

/**
 * A player's portrait: generated bust in team colours over a team-tinted field. Circle for lists,
 * rounded tile for cards. A licensed headshot drops into the same frame.
 */
export function PlayerAvatar({
  nickname,
  seed,
  team,
  size = 40,
  className,
  ring,
  shape = "circle",
  muted,
}: {
  nickname: string;
  seed?: string;
  team: TeamLite | null | undefined;
  /** Pixels, or "fill" to take the parent's box (tile shape). */
  size?: number | "fill";
  className?: string;
  ring?: "captain" | "selected" | null;
  shape?: "circle" | "tile";
  /** Dim the portrait only (eliminated players), keeping any captain/selected ring at full colour. */
  muted?: boolean;
}) {
  const color = team?.color ?? "#6f7d92";
  return (
    <span
      className={cn("relative inline-flex shrink-0 overflow-hidden", className)}
      style={{
        width: size === "fill" ? "100%" : size,
        height: size === "fill" ? "100%" : size,
        borderRadius: shape === "tile" ? (size === "fill" ? 14 : Math.round(size * 0.24)) : 999,
        // Flat frame; the team tint stays inside the portrait region as a soft halo (DESIGN.md §3.4).
        background: `radial-gradient(70% 62% at 50% 42%, ${rgba(color, 0.3)} 0%, transparent 72%), var(--color-raised)`,
        boxShadow:
          ring === "captain"
            ? `0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-lavender)`
            : ring === "selected"
              ? `0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-accent)`
              : `inset 0 0 0 1px rgb(255 255 255 / 0.06)`,
      }}
      aria-hidden
    >
      <PortraitSvg seed={seed ?? nickname} color={color} team={team ?? undefined} className={cn("absolute inset-0 size-full", muted && "opacity-45 grayscale")} />
    </span>
  );
}

/** A fan's avatar: initials on their chosen hue. Never a portrait, so fans and players read differently. */
export function UserAvatar({ username, hue, size = 32, className }: { username: string; hue: number; size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-ink", className)}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(145deg, hsl(${hue} 60% 42%), hsl(${hue} 55% 24%))`,
        boxShadow: `inset 0 0 0 1px hsl(${hue} 70% 62% / 0.4)`,
        fontSize: Math.round(size * 0.38),
        letterSpacing: "-0.02em",
      }}
      aria-hidden
    >
      {initials(username)}
    </span>
  );
}

export function Flag({ code, className }: { code: string; className?: string }) {
  const f = flag(code);
  if (!f) return null;
  return (
    <span className={className} role="img" aria-label={code}>
      {f}
    </span>
  );
}

export function RoleChip({ role, className }: { role: string; className?: string }) {
  return <span className={cn("inline-flex h-5 items-center rounded-md bg-elevated px-1.5 text-[0.75rem] font-medium text-ink-2", className)}>{role}</span>;
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex h-5 items-center gap-1 rounded-full bg-lavender-soft px-2 text-[0.75rem] font-semibold text-lavender", className)}
      title="Fictional teams and players, simulated results"
    >
      Demo data
    </span>
  );
}
