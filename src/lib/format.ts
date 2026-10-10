/** Display formatting. Scores keep full precision in data; these only shape what's shown. */

export function money(n: number): string {
  if (Math.abs(n) >= 1_000_000) {
    const m = n / 1_000_000;
    return `$${Number.isInteger(m) ? m : m.toFixed(2)}M`;
  }
  if (Math.abs(n) >= 1000) {
    const k = n / 1000;
    return `${n < 0 ? "−" : ""}$${Number.isInteger(Math.abs(k)) ? Math.abs(k) : Math.abs(k).toFixed(1)}K`;
  }
  return `$${n}`;
}

/** Full salary for detail views (DESIGN.md §3.5): $245,000. */
export function moneyFull(n: number): string {
  return `${n < 0 ? "−" : ""}$${Math.abs(n).toLocaleString("en-US")}`;
}

export function pts(n: number, digits = 1): string {
  const v = Math.round(n * 10 ** digits) / 10 ** digits;
  return v.toFixed(digits);
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

export function percentileLabel(rank: number | null, total: number): string | null {
  if (!rank || total <= 0) return null;
  const p = (rank / total) * 100;
  if (p <= 1) return `Top ${p < 0.1 ? "0.1" : p.toFixed(1).replace(/\.0$/, "")}%`;
  return `Top ${Math.ceil(p)}%`;
}

const dateFmt = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const timeFmt = new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" });

export const shortDate = (iso: string | Date) => dateFmt.format(new Date(iso));
export const dateTime = (iso: string | Date) => dateTimeFmt.format(new Date(iso));
export const clockTime = (iso: string | Date) => timeFmt.format(new Date(iso));
const dayTimeFmt = new Intl.DateTimeFormat("en", { weekday: "short", hour: "numeric", minute: "2-digit" });
/** "3:00 PM" today, "Mon 3:00 PM" within the week, otherwise the full date and time. */
export const dayTime = (iso: string | Date, now = new Date()) => {
  const d = new Date(iso);
  const days = (d.getTime() - now.getTime()) / 86_400_000;
  if (d.toDateString() === now.toDateString()) return timeFmt.format(d);
  return days > -1 && days < 6 ? dayTimeFmt.format(d) : dateTimeFmt.format(d);
};

export function dateRange(a: string, b: string): string {
  const da = new Date(a);
  const db = new Date(b);
  if (da.getUTCMonth() === db.getUTCMonth()) return `${dateFmt.format(da)} – ${db.getUTCDate()}`;
  return `${dateFmt.format(da)} – ${dateFmt.format(db)}`;
}

/** "2d 4h", "3h 12m", "45m", "12s" */
export function durationShort(ms: number): string {
  if (ms <= 0) return "0m";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

export function relativeAgo(iso: string | null, now = Date.now()): string {
  if (!iso) return "never";
  const ms = now - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} min ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)} h ago`;
  return `${Math.floor(ms / 86_400_000)} d ago`;
}

const FLAGS: Record<string, string> = {};
/** Regional-indicator flag emoji for an ISO country code. */
export function flag(code: string): string {
  if (FLAGS[code]) return FLAGS[code]!;
  if (!/^[A-Z]{2}$/.test(code)) return "";
  const f = String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
  FLAGS[code] = f;
  return f;
}

export function initials(nickname: string): string {
  const clean = nickname.replace(/[^a-zA-Z0-9]/g, "");
  return (clean.slice(0, 2) || "?").toUpperCase();
}
