"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/** Contextual navigation inside a tournament. Underlined tabs, horizontally scrollable on mobile. */
export function HubTabs({ slug }: { slug: string }) {
  const path = usePathname();
  const tabs = [
    { href: `/t/${slug}`, label: "Overview" },
    { href: `/t/${slug}/fantasy`, label: "Fantasy" },
    { href: `/t/${slug}/matches`, label: "Matches" },
    { href: `/t/${slug}/bracket`, label: "Bracket" },
    { href: `/t/${slug}/standings`, label: "Standings" },
  ];
  return (
    <nav aria-label="Tournament sections" className="scrollbar-none -mx-4 overflow-x-auto border-b border-border px-4 lg:mx-0 lg:px-0">
      <ul className="flex gap-6">
        {tabs.map((t) => {
          const active = path === t.href;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex h-11 items-center text-callout font-semibold whitespace-nowrap transition-colors",
                  active ? "text-ink" : "text-ink-3 hover:text-ink-2",
                )}
              >
                {t.label}
                {active ? <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-accent" aria-hidden /> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
