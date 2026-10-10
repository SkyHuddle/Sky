import { hashString, Rng } from "@/domain/random";

/**
 * Original event artwork (no licensed tournament art exists for the demo): a top-down radar of a
 * fictional map, the view every CS2 fan reads at a glance. Rooms and corridors are drawn as one
 * outlined shape, with bombsites marked. The orientation and glow vary per event, so each event
 * has its own look while the layout stays recognisable.
 */

// Rooms and corridors on a 100 × 60 board (right-hand side; text sits on the left).
const ROOMS: Array<[number, number, number, number]> = [
  [54, 6, 19, 12], // A site
  [73, 9, 19, 6.5], // A long
  [86, 15, 7, 21], // long corridor
  [59, 18, 7, 15], // A ramp
  [66, 25, 12, 6.5], // mid
  [47, 23, 12, 7.5], // short
  [44.5, 30, 7.5, 21], // T side lane
  [52, 33, 23, 8.5], // lower mid
  [75, 35, 18, 13], // B site
  [52, 45, 16, 7.5], // B tunnels
  [68, 47.5, 9, 6], // tunnel exit
];

export function EventArt({ seed, accent = "#a78bfa", className, radar = true, banner }: { seed: string; accent?: string; className?: string; radar?: boolean; banner?: boolean }) {
  const rng = new Rng(hashString(seed));
  const flipX = rng.chance(0.5);
  const flipY = rng.chance(0.5);
  const tilt = -8 + rng.next() * 16;
  const glowX = 55 + rng.next() * 35;
  const glowY = rng.next() * 25;
  // The radar board spans x 44–94, y 6–54; mirror within that box.
  const transform = `translate(${flipX ? 138 : 0} ${flipY ? 60 : 0}) scale(${flipX ? -1 : 1} ${flipY ? -1 : 1}) rotate(${tilt} 69 30)`;
  const site = (x: number, y: number) => [flipX ? 138 - x : x, flipY ? 60 - y : y] as const;
  const sites = [
    ["A", site(63.5, 12)],
    ["B", site(84, 41.5)],
  ] as const;

  return (
    <div className={className} aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(80% 70% at ${glowX}% ${glowY}%, ${accent}40 0%, ${accent}0d 50%, transparent 75%), radial-gradient(70% 60% at 0% 100%, rgb(59 108 240 / 0.2), transparent 70%), #0c111b`,
        }}
      />
      <div className="absolute inset-0 opacity-60" style={{ backgroundImage: "linear-gradient(rgb(255 255 255 / 0.03) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.03) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
      {radar ? (
        <svg
          viewBox="38 0 62 60"
          className={banner ? "absolute top-[-30%] right-[-24%] h-auto w-[62%] max-w-[420px] opacity-70 sm:right-[-4%] sm:w-[40%]" : "absolute top-[-10%] right-[-22%] h-auto w-[80%] max-w-[520px] sm:right-[-6%] sm:w-[58%]"}
          style={{ maskImage: "radial-gradient(75% 75% at 60% 40%, #000 45%, transparent 100%)", WebkitMaskImage: "radial-gradient(75% 75% at 60% 40%, #000 45%, transparent 100%)" }}
          focusable="false"
        >
          <g opacity="0.7">
            <g transform={transform}>
              {/* every room stroked, then filled on top, so only the union's outline shows */}
              {ROOMS.map(([x, y, w, h], i) => (
                <rect key={`s${i}`} x={x} y={y} width={w} height={h} rx="0.6" fill="none" stroke={accent} strokeOpacity="0.6" strokeWidth="0.6" />
              ))}
              {ROOMS.map(([x, y, w, h], i) => (
                <rect key={`f${i}`} x={x} y={y} width={w} height={h} rx="0.6" fill="#111827" />
              ))}
              {ROOMS.map(([x, y, w, h], i) => (
                <rect key={`t${i}`} x={x} y={y} width={w} height={h} rx="0.6" fill={accent} fillOpacity="0.07" />
              ))}
            </g>
            {sites.map(([label, [x, y]]) => (
              <g key={label}>
                <circle cx={x} cy={y} r="3.2" fill={accent} fillOpacity="0.16" stroke={accent} strokeOpacity="0.75" strokeWidth="0.3" />
                <text x={x} y={y + 1.2} textAnchor="middle" fontSize="3.3" fontWeight="800" fill={accent} fontFamily="var(--font-archivo), sans-serif">
                  {label}
                </text>
              </g>
            ))}
          </g>
        </svg>
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgb(10_14_22/0.85)_100%)]" />
    </div>
  );
}

export const TIER_ACCENT: Record<string, string> = { major: "#a78bfa", tier1: "#5ce3cb", other: "#7d8ba0" };
export const TIER_LABEL: Record<string, string> = { major: "Major", tier1: "Tier 1", other: "Event" };
