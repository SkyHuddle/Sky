import { cn } from "@/lib/cn";
import { flag, initials } from "@/lib/format";
import type { TeamLite } from "@/server/queries/common";

/**
 * Team and player identity. No licensed photos exist for the demo (and fictional players have no
 * likeness), so players get a typographic portrait: initials over a team-tinted field. Photos slot
 * into the same frame when licensed (portraitUrl), so layouts never change.
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

export function TeamMark({ team, size = 24, className }: { team: TeamLite | null | undefined; size?: number; className?: string }) {
  const color = team?.color ?? "#6f7d92";
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center font-bold tracking-tight", className)}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        background: `linear-gradient(145deg, ${rgba(color, 0.32)}, ${rgba(color, 0.14)})`,
        boxShadow: `inset 0 0 0 1px ${rgba(color, 0.42)}`,
        color,
        fontSize: Math.max(8, Math.round(size * 0.34)),
      }}
      aria-hidden
    >
      {team?.acronym.slice(0, 3) ?? "?"}
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

export function PlayerAvatar({
  nickname,
  team,
  size = 40,
  className,
  ring,
}: {
  nickname: string;
  team: TeamLite | null | undefined;
  size?: number;
  className?: string;
  ring?: "captain" | "selected" | null;
}) {
  const color = team?.color ?? "#6f7d92";
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden font-semibold text-ink", className)}
      style={{
        width: size,
        height: size,
        borderRadius: size >= 72 ? Math.round(size * 0.28) : 999,
        background: `radial-gradient(120% 120% at 20% 10%, ${rgba(color, 0.55)} 0%, ${rgba(color, 0.18)} 45%, #121925 100%)`,
        boxShadow:
          ring === "captain"
            ? `0 0 0 2px #0a0e16, 0 0 0 4px var(--color-lavender)`
            : ring === "selected"
              ? `0 0 0 2px #0a0e16, 0 0 0 4px var(--color-accent)`
              : `inset 0 0 0 1px ${rgba(color, 0.35)}`,
        fontSize: Math.round(size * 0.36),
        letterSpacing: "-0.02em",
      }}
      aria-hidden
    >
      {initials(nickname)}
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
  return <span className={cn("inline-flex h-5 items-center rounded-md bg-elevated px-1.5 text-[0.6875rem] font-medium text-ink-2", className)}>{role}</span>;
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex h-5 items-center gap-1 rounded-full bg-lavender-soft px-2 text-[0.6875rem] font-semibold text-lavender", className)}
      title="Fictional teams and players, simulated results"
    >
      Demo data
    </span>
  );
}
