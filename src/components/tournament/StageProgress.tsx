import { cn } from "@/lib/cn";
import type { StageView } from "@/server/queries/tournament";
import { Icon } from "../ui/Icon";

/** Stage 1 → Stage 2 → Stage 3 → Playoffs, with the current stage emphasised. */
export function StageProgress({ stages, className, compact }: { stages: StageView[]; className?: string; compact?: boolean }) {
  return (
    <ol className={cn("flex items-center gap-1.5", className)} aria-label="Tournament stages">
      {stages.map((s, i) => {
        const done = s.status === "completed";
        const live = s.status === "live";
        return (
          <li key={s.id} className="flex min-w-0 flex-1 items-center gap-1.5">
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "h-1 rounded-full",
                  done ? "bg-ink-3" : live ? "bg-accent" : "bg-border-strong",
                )}
              />
              {!compact ? (
                <div className={cn("mt-1.5 flex items-center gap-1 truncate text-caption", live ? "font-semibold text-ink" : done ? "text-ink-3" : "text-ink-2")}>
                  {done ? <Icon name="check" size={12} strokeWidth={2.4} /> : live ? <span className="size-1.5 shrink-0 rounded-full bg-live motion-safe:animate-pulse-dot" aria-hidden /> : null}
                  <span className="truncate">{s.name}</span>
                  <span className="sr-only">{done ? "(complete)" : live ? "(live)" : "(upcoming)"}</span>
                </div>
              ) : null}
            </div>
            {i < stages.length - 1 && compact ? null : null}
          </li>
        );
      })}
    </ol>
  );
}
