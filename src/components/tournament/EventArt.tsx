import { hashString, Rng } from "@/domain/random";

/**
 * Original, generated event artwork (no licensed tournament art is available). Fine contour lines
 * in the event's accent colour, deterministic per event, intentionally quiet so text stays legible.
 */
export function EventArt({ seed, accent = "#a78bfa", className }: { seed: string; accent?: string; className?: string }) {
  const rng = new Rng(hashString(seed));
  const cx = 70 + rng.next() * 30;
  const cy = 10 + rng.next() * 40;
  const rings = Array.from({ length: 14 }, (_, i) => {
    const r = 18 + i * 11 + rng.next() * 4;
    const squash = 0.62 + rng.next() * 0.08;
    return { r, squash, o: 0.5 - i * 0.03 };
  });
  return (
    <svg className={className} viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <radialGradient id={`g-${seed}`} cx={`${cx}%`} cy={`${cy}%`} r="70%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.22" />
          <stop offset="60%" stopColor={accent} stopOpacity="0.04" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="60" fill={`url(#g-${seed})`} />
      {rings.map((ring, i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx={ring.r}
          ry={ring.r * ring.squash}
          fill="none"
          stroke={accent}
          strokeOpacity={Math.max(0.05, ring.o * 0.5)}
          strokeWidth={0.18}
          transform={`rotate(${-12 + i * 0.6} ${cx} ${cy})`}
        />
      ))}
    </svg>
  );
}

export const TIER_ACCENT: Record<string, string> = { major: "#a78bfa", tier1: "#5ce3cb", other: "#7d8ba0" };
export const TIER_LABEL: Record<string, string> = { major: "Major", tier1: "Tier 1", other: "Event" };
