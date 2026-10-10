"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Mobile-first sections: on phones a segmented control shows one panel at a time (no sideways
 * scrolling, no endless pages); from `lg` every panel sits side by side in a grid.
 */
export function Panels({ panels, initial, label, gridClass = "lg:grid-cols-3" }: { panels: Array<{ id: string; label: string; content: ReactNode }>; initial?: string; label: string; gridClass?: string }) {
  const [active, setActive] = useState(initial ?? panels[0]?.id);
  return (
    <div>
      {panels.length > 1 ? (
        <div role="tablist" aria-label={label} className="scrollbar-none mb-4 flex gap-1 overflow-x-auto rounded-xl bg-surface p-1 lg:hidden">
          {panels.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={active === p.id}
              onClick={(e) => {
                e.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
                setActive(p.id);
              }}
              className={cn(
                "inline-flex h-9 min-w-[72px] flex-auto shrink-0 items-center justify-center rounded-md px-3 text-footnote font-semibold whitespace-nowrap transition-colors",
                active === p.id ? "bg-raised text-ink" : "text-ink-2 hover:text-ink",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className={cn("grid grid-cols-1 gap-5", gridClass)}>
        {panels.map((p) => (
          <div key={p.id} role="tabpanel" aria-label={p.label} className={cn("min-w-0", active === p.id ? "block" : "hidden lg:block")}>
            {p.content}
          </div>
        ))}
      </div>
    </div>
  );
}
