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
  open: { label: "Open", cls: "bg-accent-soft text-accent", icon: "check" },
  live: { label: "Live", cls: "bg-[rgb(255_90_104/0.14)] text-live", dot: true },
  locked: { label: "Locked", cls: "bg-elevated text-ink-2", icon: "lock" },
  upcoming: { label: "Upcoming", cls: "text-ink-2 hairline", icon: "calendar" },
  completed: { label: "Final", cls: "bg-elevated text-ink-2", icon: "check" },
  eliminated: { label: "Eliminated", cls: "bg-negative-soft text-negative", icon: "x" },
  window: { label: "Transfers open", cls: "bg-accent-soft text-accent", icon: "swap" },
  provisional: { label: "Provisional", cls: "bg-warning-soft text-warning", icon: "clock" },
  official: { label: "Official", cls: "bg-elevated text-ink-2", icon: "check" },
  settled: { label: "Settled", cls: "bg-accent-soft text-accent", icon: "check" },
  corrected: { label: "Corrected", cls: "bg-lavender-soft text-lavender", icon: "refresh" },
  postponed: { label: "Postponed", cls: "bg-warning-soft text-warning", icon: "clock" },
  delayed: { label: "Stats delayed", cls: "bg-warning-soft text-warning", icon: "alert" },
};

export function StatePill({ kind, label, className }: { kind: StateKind; label?: string; className?: string }) {
  const s = STATES[kind];
  return (
    <span className={cn("inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[0.75rem] font-semibold", s.cls, className)}>
      {s.dot ? <span className="size-1.5 rounded-full bg-live motion-safe:animate-pulse-dot" aria-hidden /> : s.icon ? <Icon name={s.icon} size={13} strokeWidth={2.2} /> : null}
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
