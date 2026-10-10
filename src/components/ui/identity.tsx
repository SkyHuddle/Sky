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
      {team.logoUrl ? (
        // A licensed logo from the data provider replaces the generated crest in the same box.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={team.logoUrl} alt="" className="size-full object-contain" loading="lazy" decoding="async" />
      ) : (
        <CrestSvg id={team.id} name={team.name} color={team.color} className="size-full" />
      )}
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
  photoUrl,
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
  /** A licensed headshot from the data provider; the illustration is used when there is none. */
  photoUrl?: string | null;
}) {
  const color = team?.color ?? "#6f7d92";
  return (
    <span
      className={cn("relative inline-flex shrink-0 overflow-hidden", className)}
      style={{
        width: size === "fill" ? "100%" : size,
        height: size === "fill" ? "100%" : size,
        borderRadius: shape === "tile" ? (size === "fill" ? 14 : Math.round(size * 0.24)) : 999,
        // A flat tile in the team's colour (DESIGN.md v1.2 §3.4): colour comes from the content.
        background: `linear-gradient(${rgba(color, 0.24)}, ${rgba(color, 0.24)}), var(--color-raised)`,
        boxShadow:
          ring === "captain"
            ? `0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-lavender)`
            : ring === "selected"
              ? `0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-accent)`
              : undefined,
      }}
      aria-hidden
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className={cn("absolute inset-0 size-full object-cover object-top", muted && "opacity-45 grayscale")} loading="lazy" decoding="async" />
      ) : (
        <PortraitSvg seed={seed ?? nickname} color={color} team={team ?? undefined} className={cn("absolute inset-0 size-full", muted && "opacity-45 grayscale")} />
      )}
    </span>
  );
}

/**
 * A fan's avatar: initials on a muted tint of their chosen hue, tinted text on top. Never a
 * portrait, so fans and players read differently; low chroma so a board of fans stays calm.
 */
export function UserAvatar({ username, hue, size = 32, className }: { username: string; hue: number; size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold", className)}
      style={{
        width: size,
        height: size,
        background: `hsl(${hue} 18% 21%)`,
        color: `hsl(${hue} 55% 80%)`,
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
      className={cn("inline-flex h-5 items-center rounded-[4px] bg-raised px-1.5 text-[0.75rem] font-medium text-ink-2", className)}
      title="Fictional teams and players, simulated results"
    >
      Demo data
    </span>
  );
}
