"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { clockTime, dateTime, dayLabel, dayTime, durationShort, shortDate } from "@/lib/format";
import { Icon, type IconName } from "./Icon";

/**
 * State labels. Colour is never the only signal: every state has an icon or text.
 */
export type StateKind = "open" | "live" | "locked" | "upcoming" | "completed" | "eliminated" | "window" | "provisional" | "official" | "settled" | "corrected" | "postponed" | "delayed";

const STATES: Record<StateKind, { label: string; cls: string; icon?: IconName; dot?: boolean }> = {
  open: { label: "Open", cls: "text-accent", icon: "check" },
  live: { label: "Live", cls: "text-live", dot: true },
  locked: { label: "Locked", cls: "text-ink-2", icon: "lock" },
  upcoming: { label: "Upcoming", cls: "text-ink-2", icon: "calendar" },
  completed: { label: "Final", cls: "text-ink-2", icon: "check" },
  eliminated: { label: "Eliminated", cls: "text-negative", icon: "x" },
  window: { label: "Transfers open", cls: "text-accent", icon: "swap" },
  provisional: { label: "Provisional", cls: "text-warning", icon: "clock" },
  official: { label: "Official", cls: "text-ink-2", icon: "check" },
  settled: { label: "Settled", cls: "text-accent", icon: "check" },
  corrected: { label: "Corrected", cls: "text-warning", icon: "refresh" },
  postponed: { label: "Postponed", cls: "text-warning", icon: "clock" },
  delayed: { label: "Stats delayed", cls: "text-warning", icon: "alert" },
};

/** A state as coloured text with an icon or dot: no pill container (DESIGN.md v1.2 §3.5). */
export function StatePill({ kind, label, className }: { kind: StateKind; label?: string; className?: string }) {
  const s = STATES[kind];
  return (
    <span className={cn("inline-flex h-6 shrink-0 items-center gap-1.5 text-[0.8125rem] font-semibold", s.cls, className)}>
      {s.dot ? <span className="size-1.5 rounded-full bg-live motion-safe:animate-pulse-dot" aria-hidden /> : s.icon ? <Icon name={s.icon} size={14} strokeWidth={2.2} /> : null}
      {label ?? s.label}
    </span>
  );
}

/** Live-updating countdown in the user's own time. Renders a stable placeholder on the server. */
export function Countdown({ to, now: serverNow, prefix, className }: { to: string; now?: string; prefix?: string; className?: string }) {
  const [now, setNow] = useState<number | null>(null);
  const offset = useClockOffset(serverNow);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const target = new Date(to).getTime();
  const remaining = now === null ? null : target - (now + offset);
  return (
    <span className={cn("tabular", className)} suppressHydrationWarning>
      {prefix}
      {remaining === null ? "…" : remaining <= 0 ? "now" : durationShort(remaining)}
    </span>
  );
}

/**
 * The server clock can be ahead of real time in demo mode. Pages pass the server's "now" so
 * countdowns match the server's lock decisions exactly.
 */
function useClockOffset(serverNow?: string): number {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (serverNow) setOffset(new Date(serverNow).getTime() - Date.now());
  }, [serverNow]);
  return offset;
}

/** Formats a time in the viewer's local time zone (client-side, so the server's zone never leaks). */
export function LocalTime({ iso, format = "datetime", className }: { iso: string; format?: "datetime" | "date" | "time" | "day" | "weekday"; className?: string }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    setText(format === "date" ? shortDate(iso) : format === "time" ? clockTime(iso) : format === "day" ? dayTime(iso) : format === "weekday" ? dayLabel(iso) : dateTime(iso));
  }, [iso, format]);
  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {text ?? " "}
    </time>
  );
}

/**
 * A deadline as segmented blocks in the display face (days · hours · minutes, or hours · minutes ·
 * seconds in the last hour). Same clock source as Countdown; stable placeholder on the server.
 */
export function CountdownBlocks({ to, now: serverNow, className }: { to: string; now?: string; className?: string }) {
  const [now, setNow] = useState<number | null>(null);
  const offset = useClockOffset(serverNow);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = now === null ? null : Math.max(0, new Date(to).getTime() - (now + offset));
  const s = remaining === null ? null : Math.floor(remaining / 1000);
  const parts: Array<[string, string]> =
    s === null
      ? [["–", "days"], ["–", "hrs"], ["–", "min"]]
      : s >= 3600
        ? [[String(Math.floor(s / 86400)), Math.floor(s / 86400) === 1 ? "day" : "days"], [String(Math.floor((s % 86400) / 3600)).padStart(2, "0"), "hrs"], [String(Math.floor((s % 3600) / 60)).padStart(2, "0"), "min"]]
        : [["00", "hrs"], [String(Math.floor(s / 60)).padStart(2, "0"), "min"], [String(s % 60).padStart(2, "0"), "sec"]];
  return (
    <span className={cn("inline-flex items-stretch gap-1.5", className)} suppressHydrationWarning>
      {parts.map(([v, unit]) => (
        <span key={unit} className="flex min-w-[52px] flex-col items-center rounded-lg bg-white/[0.06] px-2 pt-1.5 pb-1">
          <span className="font-display text-[1.75rem] leading-7 font-bold text-ink tabular-nums">{v}</span>
          <span className="text-[0.6875rem] leading-4 text-ink-3">{unit}</span>
        </span>
      ))}
      <span className="sr-only">{remaining === null ? "" : durationShort(remaining)}</span>
    </span>
  );
}
