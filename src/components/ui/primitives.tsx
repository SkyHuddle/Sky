import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./Icon";

export function Card({ children, className, as: As = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" | "article" | "li" }) {
  return <As className={cn("rounded-2xl border border-border bg-surface", className)}>{children}</As>;
}

export function SectionHeader({ title, action, className, id }: { title: string; action?: ReactNode; className?: string; id?: string }) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-3", className)}>
      <h2 id={id} className="text-headline text-ink">
        {title}
      </h2>
      {action}
    </div>
  );
}

export function TextLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-0.5 text-callout font-medium text-accent hover:text-accent-strong", className)}>
      {children}
      <Icon name="chevronRight" size={16} />
    </Link>
  );
}

export function EmptyState({ icon, title, body, action, className }: { icon: IconName; title: string; body?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong px-6 py-10 text-center", className)}>
      <span className="mb-3 inline-flex size-11 items-center justify-center rounded-full bg-elevated text-ink-2">
        <Icon name={icon} size={22} />
      </span>
      <p className="text-headline text-ink">{title}</p>
      {body ? <p className="mt-1 max-w-sm text-callout text-ink-2">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Notice({ tone = "info", icon, children, className }: { tone?: "info" | "warning" | "danger" | "success" | "lavender"; icon?: IconName; children: ReactNode; className?: string }) {
  const tones = {
    info: "bg-elevated text-ink-2 border-border",
    warning: "bg-warning-soft text-warning border-warning/25",
    danger: "bg-negative-soft text-negative border-negative/25",
    success: "bg-accent-soft text-accent border-accent/25",
    lavender: "bg-lavender-soft text-lavender border-lavender/25",
  };
  const defaultIcon: Record<string, IconName> = { info: "info", warning: "alert", danger: "alert", success: "check", lavender: "info" };
  return (
    <div className={cn("flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-callout", tones[tone], className)} role={tone === "danger" ? "alert" : "status"}>
      <Icon name={icon ?? defaultIcon[tone]!} size={18} className="mt-px shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function Stat({ label, value, sub, className, valueClassName }: { label: string; value: ReactNode; sub?: ReactNode; className?: string; valueClassName?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="text-caption text-ink-3">{label}</div>
      <div className={cn("tabular mt-0.5 text-headline text-ink", valueClassName)}>{value}</div>
      {sub ? <div className="mt-0.5 text-caption text-ink-2">{sub}</div> : null}
    </div>
  );
}

/** Rank movement: ▲ 12 / ▼ 3 / – ; always paired with text for screen readers. */
export function Movement({ value, className }: { value: number | null | undefined; className?: string }) {
  if (value === null || value === undefined || value === 0) {
    return (
      <span className={cn("tabular text-caption text-ink-3", className)} aria-label="No change">
        –
      </span>
    );
  }
  const up = value > 0;
  return (
    <span className={cn("tabular inline-flex items-center gap-0.5 text-caption font-semibold", up ? "text-positive" : "text-negative", className)} aria-label={`${up ? "Up" : "Down"} ${Math.abs(value)}`}>
      <Icon name={up ? "arrowUp" : "arrowDown"} size={12} strokeWidth={2.4} />
      {Math.abs(value)}
    </span>
  );
}

/** Tiny bar chart of recent map scores (oldest → newest). Height encodes value; values ≥ 25 are highlighted. */
export function FormBars({ values, className, max = 60 }: { values: number[]; className?: string; max?: number }) {
  if (values.length === 0) return <span className={cn("text-caption text-ink-3", className)}>No data</span>;
  return (
    <span className={cn("inline-flex h-5 items-end gap-[3px]", className)} role="img" aria-label={`Last ${values.length} maps: ${values.map((v) => v.toFixed(0)).join(", ")} points`}>
      {values.map((v, i) => (
        <span
          key={i}
          className={cn("w-[5px] rounded-[2px]", v >= 25 ? "bg-accent" : v >= 12 ? "bg-ink-3" : "bg-negative/70")}
          style={{ height: `${Math.max(12, Math.min(100, (Math.max(0, v) / max) * 100))}%` }}
        />
      ))}
    </span>
  );
}
