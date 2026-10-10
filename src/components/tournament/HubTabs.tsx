"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Contextual navigation inside a tournament. Underlined tabs, horizontally scrollable on mobile:
 * the active tab is scrolled into view and a fade marks the edge while more tabs are hidden.
 */
export function HubTabs({ slug }: { slug: string }) {
  const path = usePathname();
  const ref = useRef<HTMLElement>(null);
  const [more, setMore] = useState({ left: false, right: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.querySelector<HTMLElement>("[aria-current=page]")?.scrollIntoView({ block: "nearest", inline: "center" });
    const update = () => setMore({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [path]);
  const fade = `linear-gradient(90deg, ${more.left ? "transparent 0, #000 40px" : "#000 0"}, ${more.right ? "#000 calc(100% - 40px), transparent 100%" : "#000 100%"})`;
  const tabs = [
    { href: `/t/${slug}`, label: "Overview" },
    { href: `/t/${slug}/fantasy`, label: "Fantasy" },
    { href: `/t/${slug}/matches`, label: "Matches" },
    { href: `/t/${slug}/bracket`, label: "Bracket" },
    { href: `/t/${slug}/standings`, label: "Standings" },
  ];
  return (
    <nav ref={ref} aria-label="Tournament sections" className="scrollbar-none -mx-4 overflow-x-auto border-b border-border px-4 lg:mx-0 lg:px-0" style={{ maskImage: fade, WebkitMaskImage: fade }}>
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
