import { hashString, Rng } from "@/domain/random";

/**
 * Generated identity art. Demo players are fictional and have no photos, and no team logos are
 * licensed, so both are drawn here: deterministic per player and per team, never a real likeness
 * or a real organisation's mark. A licensed headshot or logo replaces these in the same frame.
 */

// ── colour helpers ─────────────────────────────────────────────────────────────────────────────

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]) {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
}

/** Mix `hex` toward `to` by t (0 = hex, 1 = to). */
export function mix(hex: string, to: string, t: number) {
  if (!hex.startsWith("#")) return hex;
  const a = parseHex(hex);
  const b = parseHex(to);
  return toHex([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
}

export function luminance(hex: string) {
  if (!hex.startsWith("#")) return 0.5;
  const [r, g, b] = parseHex(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ── player portrait ───────────────────────────────────────────────────────────────────────────

const HAIRSTYLES = [
  // short crop
  "M35.6 38 C35 24.5 42 20 50 20 C58.5 20 65.6 24.6 64.4 38 C62.4 31.2 57.4 28.2 50 28.4 C42.8 28.2 37.8 31.2 35.6 38 Z",
  // quiff
  "M35.2 39 C32.6 22.5 43.4 15.6 53 17.4 C62.4 18.8 67.6 26 64.8 39 C63 30.6 58.6 27.4 52.4 27.2 C47.4 27.4 44.2 25.6 42.4 23.4 C40.4 29 37.6 32.4 35.2 39 Z",
  // fringe
  "M35 40 C33.6 23.6 42 18.6 50.4 18.6 C59.4 18.6 67 23.8 65 40 C64 34.8 62.6 31.6 60.6 30.4 C55.8 32.6 47.4 33 40.2 30.6 C37.8 32.6 36.2 35.6 35 40 Z",
  // longer, over the ears
  "M33.6 47 C30.6 24.4 41.6 17 50.2 17 C60 17 69.6 24 66.4 47 C64.6 37.4 62.6 31.8 58.6 29.4 C52.6 31.4 44.6 31.6 40.4 29.4 C37 32.8 35.2 38.4 33.6 47 Z",
  // buzz
  "M35.8 37 C35.6 25.6 42.4 21.6 50 21.6 C57.8 21.6 64.6 25.6 64.2 37 C61.6 30.6 56.6 27.8 50 27.8 C43.4 27.8 38.4 30.6 35.8 37 Z",
];

const SKIN = ["#f3cfb1", "#e8b894", "#d39e74", "#b67d55", "#8d5a3a", "#64402a"] as const;
const HAIR = ["#17120f", "#17120f", "#2b1d15", "#3d2a1d", "#5e3d24", "#8a5d34", "#c79d62", "#e2d6c2", "#a5432b"] as const;

/**
 * A flat illustrated bust for a fictional demo player: skin tone, hair, brows and accessories
 * vary by seed; the jersey wears the team's colours. Illustrated, not photographic, so it never
 * passes for a real person; licensed headshots replace it inside the same frame for real players.
 * Flat fills only (gradient ids would collide when the same player appears twice on a page).
 */
export function PortraitSvg({ seed, color, team, className, size }: { seed: string; color: string; team?: { id: string; name: string }; className?: string; size?: number }) {
  const rng = new Rng(hashString(`portrait:${seed}`));
  const style = rng.int(0, HAIRSTYLES.length - 1);
  const skin = SKIN[rng.int(0, SKIN.length - 1)]!;
  const hair = HAIR[rng.int(0, HAIR.length - 1)]!;
  const headset = rng.chance(0.4);
  const beard = rng.chance(0.22);
  const stubble = !beard && rng.chance(0.25);
  const glasses = rng.chance(0.16);
  const skinShade = mix(skin, "#3a2418", 0.22);
  const featureInk = mix(skin, "#140c08", 0.78);
  // Jersey in the team colour, kept away from the extremes so it reads on the tile.
  const lum = luminance(color);
  const jersey = lum < 0.06 ? mix(color, "#ffffff", 0.18) : lum > 0.6 ? mix(color, "#000000", 0.12) : color;
  const jerseyShade = mix(jersey, "#000000", 0.28);
  const trim = luminance(jersey) > 0.42 ? "#111316" : "#f4f5f6";

  return (
    <svg viewBox="12 6 76 76" className={className} width={size} height={size} aria-hidden focusable="false">
      {/* jersey: team colour, darker side panels, contrast collar */}
      <path d="M4 100 C6 81 19 71.6 35.4 68.8 L44 67 L56 67 L64.6 68.8 C81 71.6 94 81 96 100 Z" fill={jersey} />
      <path d="M4 100 C5.4 87 11 79.4 19.6 74.6 L24 100 Z M96 100 C94.6 87 89 79.4 80.4 74.6 L76 100 Z" fill={jerseyShade} />
      {/* neck */}
      <path d="M43.4 51 L43.4 67.4 Q50 74.6 56.6 67.4 L56.6 51 Z" fill={skinShade} />
      <path d="M41.6 66.6 L50 76.4 L58.4 66.6" fill="none" stroke={trim} strokeWidth="2.2" strokeLinejoin="round" />
      {/* ears and head */}
      <ellipse cx="35.4" cy="42.6" rx="2.8" ry="4.3" fill={skinShade} />
      <ellipse cx="64.6" cy="42.6" rx="2.8" ry="4.3" fill={skinShade} />
      <ellipse cx="50" cy="40" rx="14.6" ry="17.6" fill={skin} />
      <path d="M58.6 27 C63.6 32 65.8 41 62.4 49.6 C61 53 58.6 55.4 56 56.6 C61.4 50.6 62.6 38.6 58.6 27 Z" fill="#000" opacity="0.1" />
      {/* face: brows, eyes, nose, mouth */}
      <path d="M41.4 37.2 Q44.4 35.6 47.2 36.8 M52.8 36.8 Q55.6 35.6 58.6 37.2" stroke={mix(hair, "#000000", 0.2)} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <ellipse cx="44.4" cy="41.6" rx="1.35" ry="1.6" fill={featureInk} />
      <ellipse cx="55.6" cy="41.6" rx="1.35" ry="1.6" fill={featureInk} />
      <path d="M50.6 42.6 Q52 47.4 49.4 48.2" stroke={skinShade} strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <path d="M46.4 51.6 Q50 53.4 53.6 51.6" stroke={mix(skin, "#5a2a1e", 0.45)} strokeWidth="1.3" strokeLinecap="round" fill="none" />
      {stubble ? <path d="M37.4 45 C38.6 55.4 44 58 50 58 C56 58 61.4 55.4 62.6 45 C60.8 52 56.4 55.4 50 55.4 C43.6 55.4 39.2 52 37.4 45 Z" fill={hair} opacity="0.28" /> : null}
      {beard ? (
        <path d="M36.6 44 C37.4 55.6 43.6 58.6 50 58.6 C56.4 58.6 62.6 55.6 63.4 44 C61.8 49.4 58.6 51.2 55.4 50.6 C53.4 50.2 51.6 50.4 50 51 C48.4 50.4 46.6 50.2 44.6 50.6 C41.4 51.2 38.2 49.4 36.6 44 Z" fill={hair} />
      ) : null}
      <path d={HAIRSTYLES[style]} fill={hair} />
      {glasses ? (
        <g fill="none" stroke="#14161a" strokeWidth="1.3">
          <rect x="39.6" y="38.6" width="9" height="6.4" rx="2.4" />
          <rect x="51.4" y="38.6" width="9" height="6.4" rx="2.4" />
          <path d="M48.6 41.2 H51.4" />
        </g>
      ) : null}
      {headset ? (
        <g>
          <path d="M33.2 41 C32.2 17.6 67.8 17.6 66.8 41" stroke="#16181c" strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <rect x="29.6" y="34.6" width="7.8" height="13.2" rx="3.6" fill="#16181c" />
          <rect x="62.6" y="34.6" width="7.8" height="13.2" rx="3.6" fill="#16181c" />
          <rect x="31.2" y="37.6" width="2" height="7.2" rx="1" fill={jersey} />
          <path d="M33.6 46.6 C34.6 52.4 38.4 55 42.6 55.4" stroke="#16181c" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </g>
      ) : null}
      {team ? (
        <g transform="translate(59.5 72.5) scale(0.2)">
          <CrestSvg id={team.id} name={team.name} color={color} bare />
        </g>
      ) : null}
    </svg>
  );
}

// ── team crest ────────────────────────────────────────────────────────────────────────────────

const SHAPES = {
  shield: "M20 2.4 L35 7.2 V18.4 C35 28.2 28.4 34.6 20 37.8 C11.6 34.6 5 28.2 5 18.4 V7.2 Z",
  round: "M20 2.6 A17.4 17.4 0 1 1 19.99 2.6 Z",
  hex: "M20 2.4 L35.4 11.2 V28.8 L20 37.6 L4.6 28.8 V11.2 Z",
  kite: "M20 2.4 L36 12.4 L30.4 33.2 L20 37.8 L9.6 33.2 L4 12.4 Z",
  badge: "M8.4 3.6 H31.6 Q36 3.6 36 8 V25.6 C36 31 28.4 35.8 20 37.8 C11.6 35.8 4 31 4 25.6 V8 Q4 3.6 8.4 3.6 Z",
} as const;

type Glyph = { fill?: string; stroke?: string };
const GLYPHS: Record<string, Glyph> = {
  star: { fill: "M20 8.6 L22.8 16.6 L30.6 19.4 L22.8 22.2 L20 30.2 L17.2 22.2 L9.4 19.4 L17.2 16.6 Z" },
  sun: {
    fill: "M20 14.4 A5 5 0 1 1 19.99 14.4 Z",
    stroke: "M20 8.4 V11.4 M20 27.4 V30.4 M9 19.4 H12 M28 19.4 H31 M12.2 11.6 L14.4 13.8 M25.6 25 L27.8 27.2 M12.2 27.2 L14.4 25 M25.6 13.8 L27.8 11.6",
  },
  wave: { stroke: "M9.4 15.6 C12 12.6 14.6 12.6 17.2 15.6 S22.4 18.6 25 15.6 S29.6 12.6 30.8 14 M9.4 23.2 C12 20.2 14.6 20.2 17.2 23.2 S22.4 26.2 25 23.2 S29.6 20.2 30.8 21.6" },
  bolt: { fill: "M22.6 7.8 L12.6 21.4 H19.2 L17 31.2 L27.6 16.8 H21 Z" },
  flame: { fill: "M20.4 7.8 C24.6 12.6 27.6 16 27.6 21.4 C27.6 26.6 24.2 30.4 20 30.4 C15.8 30.4 12.4 26.8 12.4 22 C12.4 18.6 14.4 16.2 16.2 14.2 C16.6 17.2 17.8 18.8 19.4 19.4 C18.8 15.4 18.8 11.4 20.4 7.8 Z" },
  wing: { fill: "M8.6 24.4 C13.4 13.4 21.4 9.6 31.8 9.4 C28.8 12.6 26.6 14.6 22.6 16 C25.6 16 28 16.6 30 17 C27 20.4 22.6 21.6 18.4 21.6 C20.6 22.6 22.4 23.6 23.6 24.8 C18.6 26.2 13.2 26.2 8.6 24.4 Z" },
  mountain: { fill: "M7.6 29 L15.8 15.2 L20.2 21.6 L24.4 12.8 L32.4 29 Z" },
  petal: { fill: "M20 8.8 C23.4 12.6 23.4 16.4 20 19.4 C16.6 16.4 16.6 12.6 20 8.8 Z M20 29.8 C16.6 26 16.6 22.2 20 19.4 C23.4 22.2 23.4 26 20 29.8 Z M9.4 19.4 C13.2 16 17 16 20 19.4 C17 22.8 13.2 22.8 9.4 19.4 Z M30.6 19.4 C26.8 22.8 23 22.8 20 19.4 C23 16 26.8 16 30.6 19.4 Z" },
  compass: { fill: "M20 7.6 L28.4 29.6 L20 24.4 L11.6 29.6 Z" },
  fin: { fill: "M9.4 27.4 C13 18.6 19.6 11 30 8.6 C26.8 15 26.8 21.4 30.8 27.4 Z" },
  shard: { fill: "M20.6 7.8 L28.8 17.4 L22.4 31.4 L12.6 20.6 Z", stroke: "M20.6 7.8 L19.2 21 L22.4 31.4 M12.6 20.6 L19.2 21 L28.8 17.4" },
  diamond: { fill: "M20 7.8 L28.8 19.4 L20 31 L11.2 19.4 Z" },
  leaf: { fill: "M10.6 29 C10.6 17.4 17.8 10 30 9.8 C30 21.6 22.6 29 10.6 29 Z", stroke: "M10.6 29 L24 15.8" },
  ring: { stroke: "M20 10.2 A9.2 9.2 0 1 1 19.99 10.2 Z", fill: "M20 16.2 A3.2 3.2 0 1 1 19.99 16.2 Z" },
  columns: { fill: "M11 12 H15.6 V28 H11 Z M17.7 9 H22.3 V28 H17.7 Z M24.4 12 H29 V28 H24.4 Z" },
};

const KEYWORDS: Array<[RegExp, keyof typeof GLYPHS]> = [
  [/polar|nova|star/i, "star"],
  [/sol|lumen|sun|bright(?!line)/i, "sun"],
  [/tide|halcy|salt|wave/i, "wave"],
  [/arc|brightline|static|volt/i, "bolt"],
  [/ember|copper|fire/i, "flame"],
  [/kestrel|raven|hawk/i, "wing"],
  [/granite|quarry|moor|ridge/i, "mountain"],
  [/fox|orchid|bloom/i, "petal"],
  [/north|wind/i, "compass"],
  [/meridian|eye|lens/i, "ring"],
  [/fin|shark/i, "fin"],
  [/obsidian|vanta|glass/i, "shard"],
  [/wild|card/i, "diamond"],
  [/thorn|juniper|drift|leaf/i, "leaf"],
  [/union|mono|iron|clad/i, "columns"],
];

export function crestGlyph(name: string): keyof typeof GLYPHS {
  for (const [re, g] of KEYWORDS) if (re.test(name)) return g;
  const keys = Object.keys(GLYPHS) as Array<keyof typeof GLYPHS>;
  return keys[hashString(name) % keys.length]!;
}

export function CrestSvg({ id, name, color, className, bare, size }: { id: string; name: string; color: string; className?: string; bare?: boolean; size?: number }) {
  const shapes = Object.values(SHAPES);
  const shape = shapes[hashString(`crest:${id}`) % shapes.length]!;
  const glyph = GLYPHS[crestGlyph(name)]!;
  const light = luminance(color) > 0.42;
  const ink = light ? mix(color, "#070a10", 0.82) : "#f7f9fc";
  const body = (
    <g>
      <path d={shape} fill={mix(color, "#070a10", 0.12)} />
      <path d={shape} fill="none" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="1.2" transform="translate(2.6 2.6) scale(0.87)" />
      <g transform="translate(20 20) scale(0.92) translate(-20 -19.6)">
        {glyph.fill ? <path d={glyph.fill} fill={ink} /> : null}
        {glyph.stroke ? <path d={glyph.stroke} fill="none" stroke={ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /> : null}
      </g>
    </g>
  );
  if (bare) return body;
  return (
    <svg viewBox="0 0 40 40" className={className} width={size} height={size} aria-hidden focusable="false">
      {body}
    </svg>
  );
}
