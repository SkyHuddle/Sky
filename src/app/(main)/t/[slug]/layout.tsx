import { notFound } from "next/navigation";
import { EventArt, TIER_ACCENT, TIER_LABEL } from "@/components/tournament/EventArt";
import { HubTabs } from "@/components/tournament/HubTabs";
import { StageProgress } from "@/components/tournament/StageProgress";
import { DemoBadge } from "@/components/ui/identity";
import { StatePill } from "@/components/ui/status";
import { dateRange } from "@/lib/format";
import { pageContext } from "@/server/page";
import { tournamentSummaries } from "@/server/queries/tournament";

export default async function TournamentLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { db, viewer } = await pageContext();
  const [t] = await tournamentSummaries(db, viewer?.id ?? null, { slug });
  if (!t) notFound();
  const accent = TIER_ACCENT[t.tier] ?? "#a78bfa";
  return (
    <div>
      <header className="relative -mx-4 -mt-5 overflow-hidden border-b border-border px-4 pt-6 pb-5 lg:mx-0 lg:mt-0 lg:rounded-[24px] lg:border lg:px-7 lg:pt-7">
        <EventArt seed={t.slug} accent={accent} banner className="pointer-events-none absolute inset-0" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-eyebrow" style={{ color: accent }}>
              Counter-Strike 2 · {TIER_LABEL[t.tier]}
            </span>
            {t.isDemo ? <DemoBadge /> : null}
            <StatePill kind={t.status === "live" ? "live" : t.status === "completed" ? "completed" : "upcoming"} className="ml-auto" />
          </div>
          <h1 className="display mt-3 text-[2.5rem] leading-[0.95] text-ink uppercase sm:text-[3rem]">{t.shortName}</h1>
          <p className="mt-1 text-callout text-ink-2">
            {dateRange(t.beginAt, t.endAt)} · {t.location} · {t.stages.length} stages
          </p>
          <StageProgress stages={t.stages} className="mt-5 max-w-2xl" />
        </div>
      </header>
      <div className="mt-2 mb-6">
        <HubTabs slug={t.slug} />
      </div>
      {children}
    </div>
  );
}
