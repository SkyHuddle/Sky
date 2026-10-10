import Link from "next/link";
import type { ReactNode } from "react";
import type { SessionUser } from "@/server/auth/session";
import { UserAvatar } from "../ui/identity";
import { Icon } from "../ui/Icon";
import { Brand } from "./Brand";
import { DemoControl } from "./DemoControl";
import { SideNav, TabBar } from "./Nav";

export function UserChip({ viewer }: { viewer: SessionUser | null }) {
  if (!viewer) {
    return (
      <Link href="/signin" className="inline-flex h-9 items-center rounded-full bg-elevated px-3.5 text-[0.8125rem] font-semibold text-ink hairline hover:bg-raised">
        Sign in
      </Link>
    );
  }
  return (
    <Link href={`/u/${viewer.username}`} aria-label="Your profile" className="rounded-full">
      <UserAvatar username={viewer.username} hue={viewer.avatarHue} size={34} />
    </Link>
  );
}

/**
 * The persistent frame: mobile top bar + bottom tabs; desktop sidebar. Game selection shows CS2
 * only (the one supported game), as a label rather than a fake switcher.
 */
export function AppShell({ viewer, demo, now, children }: { viewer: SessionUser | null; demo: boolean; now: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-r border-border px-4 py-5 lg:flex">
        <Brand className="mb-7 px-2" />
        <SideNav />
        <div className="mt-auto space-y-3 px-1">
          <div className="flex items-center justify-between rounded-xl bg-surface px-3 py-2.5 hairline">
            <span className="text-caption text-ink-3">Game</span>
            <span className="inline-flex items-center gap-1.5 text-callout font-semibold text-ink">
              <span className="size-1.5 rounded-full bg-accent" aria-hidden />
              Counter-Strike 2
            </span>
          </div>
          {demo ? <DemoControl now={now} signedIn={!!viewer} /> : null}
          <div className="flex items-center justify-between">
            <UserChip viewer={viewer} />
            {viewer ? <span className="truncate pl-2 text-callout text-ink-2">{viewer.username}</span> : null}
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <header className="glass sticky top-0 z-30 border-b border-border lg:hidden">
          <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-4">
            <Brand />
            <span className="ml-1 inline-flex h-6 items-center rounded-full bg-elevated px-2 text-[0.6875rem] font-bold tracking-wide text-ink-2" title="Counter-Strike 2">
              CS2
            </span>
            <div className="ml-auto flex items-center gap-2">
              {demo ? <DemoControl now={now} signedIn={!!viewer} compact /> : null}
              <UserChip viewer={viewer} />
            </div>
          </div>
        </header>
        {demo ? (
          <div className="border-b border-border bg-[rgb(167_139_250/0.06)]">
            <p className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-1.5 text-caption text-ink-2 lg:px-8">
              <Icon name="info" size={14} className="text-lavender" />
              Demo mode: fictional teams and players with simulated results. Not real tournament data.
            </p>
          </div>
        ) : null}
        <main id="main" className="mx-auto w-full max-w-6xl px-4 pt-5 pb-28 lg:px-8 lg:pt-8 lg:pb-16">
          {children}
        </main>
      </div>
      <TabBar />
    </div>
  );
}
