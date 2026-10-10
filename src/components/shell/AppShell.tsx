import Link from "next/link";
import type { ReactNode } from "react";
import type { SessionUser } from "@/server/auth/session";
import { UserAvatar } from "../ui/identity";
import { Icon } from "../ui/Icon";
import { Brand } from "./Brand";
import { DemoControl } from "./DemoControl";
import { SideNav, TabBar } from "./Nav";
import { SportSwitcher } from "./SportSwitcher";

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
 * The persistent frame: mobile top bar + bottom tabs; desktop sidebar. The esport switcher lists
 * future games as disabled ("Coming later"), never as working options.
 */
export function AppShell({ viewer, demo, now, children }: { viewer: SessionUser | null; demo: boolean; now: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-r border-border px-4 py-5 lg:flex">
        <Brand className="mb-7 px-2" />
        <SideNav />
        <div className="mt-auto space-y-3 px-1">
          <SportSwitcher variant="full" />
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
          <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-4 sm:px-5">
            <Brand />
            <div className="ml-1">
              <SportSwitcher />
            </div>
            <div className="ml-auto flex items-center gap-2">
              {demo ? <DemoControl now={now} signedIn={!!viewer} compact /> : null}
              <UserChip viewer={viewer} />
            </div>
          </div>
        </header>
        {demo ? (
          <div className="border-b border-border">
            <p className="mx-auto flex max-w-[1360px] items-center gap-1.5 px-4 py-1.5 text-caption text-ink-3 sm:px-5 lg:px-8">
              <Icon name="info" size={13} className="shrink-0" />
              Demo data: fictional teams, players and simulated results.
            </p>
          </div>
        ) : null}
        <main id="main" className="mx-auto w-full max-w-[1360px] px-4 pt-5 pb-28 sm:px-5 lg:px-8 lg:pt-8 lg:pb-16">
          {children}
        </main>
      </div>
      <TabBar />
    </div>
  );
}
