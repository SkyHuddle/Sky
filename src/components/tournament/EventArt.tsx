import { hashString, Rng } from "@/domain/random";

/**
 * Original event artwork (no licensed tournament key art exists for the demo): a type poster.
 * The event's name repeats in outlined display type, stepping down in strength, bleeding off the
 * right edge behind one soft spotlight in the tier colour. Each event gets its own angle and glow,
 * and the name itself is the artwork, so no stock imagery is needed (DESIGN.md v1.3 §3.4).
 */
export function EventArt({ seed, title, accent = "#4fe0c4", className, banner }: { seed: string; title: string; accent?: string; className?: string; banner?: boolean }) {
  const rng = new Rng(hashString(seed));
  const tilt = -7 + rng.next() * 4;
  const glowX = 70 + rng.next() * 25;
  const glowY = rng.next() * 30;
  const word = title.toUpperCase();
  const lines = [0.42, 0.2, 0.08];

  return (
    <div className={className} aria-hidden>
      <div className="absolute inset-0 bg-surface" style={{ backgroundImage: `radial-gradient(55% 90% at ${glowX}% ${glowY}%, ${accent}30 0%, transparent 70%)` }} />
      <div
        className={banner ? "absolute top-[-8%] right-[-6%] hidden w-[62%] sm:block" : "absolute top-[-4%] right-[-14%] w-[86%] sm:right-[-4%] sm:w-[70%]"}
        style={{
          transform: `rotate(${tilt}deg)`,
          transformOrigin: "100% 0%",
          maskImage: "linear-gradient(90deg, transparent 5%, #000 60%), linear-gradient(180deg, #000 30%, transparent 85%)",
          maskComposite: "intersect",
          WebkitMaskImage: "linear-gradient(90deg, transparent 5%, #000 60%), linear-gradient(180deg, #000 30%, transparent 85%)",
          WebkitMaskComposite: "source-in",
        }}
      >
        {lines.map((o, i) => (
          <div
            key={i}
            className="font-display text-right leading-[0.82] font-bold whitespace-nowrap"
            style={{
              fontSize: banner ? "clamp(4rem, 12vw, 8rem)" : "clamp(4.5rem, 14vw, 11rem)",
              color: i === 0 ? `${accent}14` : "transparent",
              WebkitTextStroke: `1.25px ${accent}`,
              opacity: o,
            }}
          >
            {word}
          </div>
        ))}
      </div>
      {/* bottom-left fade so the headline overlay stays readable */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,var(--color-surface)_92%)]" />
    </div>
  );
}

export const TIER_ACCENT: Record<string, string> = { major: "#4fe0c4", tier1: "#a5aab2", other: "#788ba0" };
export const TIER_LABEL: Record<string, string> = { major: "Major", tier1: "Tier 1", other: "Event" };
