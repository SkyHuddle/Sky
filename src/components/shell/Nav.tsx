"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "../ui/Icon";

export const NAV: { href: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
  { href: "/", label: "Home", icon: "home", match: (p) => p === "/" || p.startsWith("/t/") },
  { href: "/fantasy", label: "Fantasy", icon: "roster", match: (p) => p.startsWith("/fantasy") || p.startsWith("/e/") || p.startsWith("/c/") },
  { href: "/leagues", label: "Leagues", icon: "trophy", match: (p) => p.startsWith("/leagues") || p.startsWith("/join") },
  { href: "/profile", label: "Profile", icon: "user", match: (p) => p.startsWith("/profile") || p.startsWith("/u/") },
];

/** Mobile bottom tab bar. */
export function TabBar() {
  const path = usePathname();
  return (
    <nav aria-label="Primary" className="glass pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border lg:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {NAV.map((item) => {
          const active = item.match(path);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn("flex h-14 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium transition-colors", active ? "text-ink" : "text-ink-3 hover:text-ink-2")}
              >
                <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-colors", active && "bg-elevated text-accent")}>
                  <Icon name={item.icon} size={21} strokeWidth={active ? 2 : 1.75} />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Desktop sidebar navigation. */
export function SideNav() {
  const path = usePathname();
  return (
    <nav aria-label="Primary">
      <ul className="space-y-1">
        {NAV.map((item) => {
          const active = item.match(path);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-xl px-3 text-[0.9375rem] font-medium transition-colors",
                  active ? "bg-elevated text-ink" : "text-ink-2 hover:bg-surface hover:text-ink",
                )}
              >
                <Icon name={item.icon} size={20} className={active ? "text-accent" : undefined} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
