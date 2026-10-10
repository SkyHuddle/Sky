"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "../ui/Icon";

const SPORTS = [
  { id: "cs2", short: "CS2", name: "Counter-Strike 2", available: true },
  { id: "lol", short: "LoL", name: "League of Legends", available: false },
  { id: "val", short: "VAL", name: "VALORANT", available: false },
] as const;

/**
 * Esport selector (DESIGN.md §5.1). CS2 is the only playable game; the others are listed so the
 * model is clear, disabled and marked "Coming later" rather than hidden or faked.
 */
export function SportSwitcher({ variant = "compact" }: { variant?: "compact" | "full" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", variant === "full" && "w-full")}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Esport: Counter-Strike 2. Change esport"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full text-ink transition-colors hover:bg-raised",
          variant === "compact" ? "h-8 bg-elevated px-3 text-footnote font-semibold" : "h-11 w-full justify-between rounded-xl bg-surface px-3 text-callout font-semibold hairline",
        )}
      >
        {variant === "full" ? <span className="text-caption font-normal text-ink-3">Esport</span> : null}
        <span className="inline-flex items-center gap-1.5">
          {variant === "full" ? "Counter-Strike 2" : "CS2"}
          <Icon name="chevronDown" size={14} className={cn("text-ink-3 transition-transform", open && "rotate-180")} />
        </span>
      </button>
      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute z-50 mt-2 w-64 overflow-hidden rounded-2xl bg-elevated p-1.5 shadow-[0_16px_40px_rgb(0_0_0/0.45)]",
            variant === "full" ? "bottom-full left-0 mb-2" : "left-0",
          )}
        >
          {SPORTS.map((s) => (
            <button
              key={s.id}
              role="menuitemradio"
              aria-checked={s.id === "cs2"}
              aria-disabled={!s.available}
              disabled={!s.available}
              onClick={() => setOpen(false)}
              className="flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left enabled:hover:bg-raised disabled:cursor-not-allowed"
            >
              <span className={cn("inline-flex h-7 w-10 items-center justify-center rounded-lg text-caption font-bold", s.available ? "bg-accent-soft text-accent" : "bg-surface text-ink-3")}>{s.short}</span>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-callout font-medium", s.available ? "text-ink" : "text-ink-2")}>{s.name}</span>
                {!s.available ? <span className="block text-caption text-ink-3">Coming later</span> : null}
              </span>
              {s.id === "cs2" ? <Icon name="check" size={16} className="text-accent" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
