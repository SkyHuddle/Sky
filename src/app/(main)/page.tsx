import Link from "next/link";
import { EventArt, TIER_ACCENT, TIER_LABEL } from "@/components/tournament/EventArt";
import { StageProgress } from "@/components/tournament/StageProgress";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { DemoBadge } from "@/components/ui/identity";
import { EmptyState, SectionHeader } from "@/components/ui/primitives";
import { Countdown, LocalTime, StatePill } from "@/components/ui/status";
import { cn } from "@/lib/cn";
import { contestCta, primaryContest } from "@/lib/contest";
import { dateRange, ordinal, percentileLabel, pts } from "@/lib/format";
import { pageContext } from "@/server/page";
import { tournamentSummaries, type TournamentSummary } from "@/server/queries/tournament";

export default async function HomePage() {
  const { db, viewer, now } = await pageContext();
  const all = await tournamentSummaries(db, viewer?.id ?? null);
  const nowIso = now.toISOString();

  const featured =
    all.find((t) => t.tier === "major" && t.status !== "completed") ?? all.find((t) => t.status !== "completed") ?? all[all.length - 1] ?? null;
  const upcoming = all.filter((t) => t !== featured && t.status !== "completed");
  const completed = all.filter((t) => t.status === "completed" && t !== featured);
  const mine = all.flatMap((t) => t.contests.filter((c) => c.myEntry && c.status !== "completed").map((c) => ({ t, c })));

  if (!featured) {
    return <EmptyState icon="calendar" title="No tournaments yet" body="When the next CS2 event is announced, its fantasy contests will appear here." />;
  }

  return (
    <div className="space-y-9">
      <FeaturedEvent t={featured} now={now} nowIso={nowIso} />

      <section aria-labelledby="your-fantasy">
        <SectionHeader id="your-fantasy" title="Your fantasy" action={mine.length ? <Link href="/fantasy" className="text-callout font-medium text-accent">All entries</Link> : null} />
        {mine.length === 0 ? (
          <div className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-border-strong p-5 sm:flex-row sm:items-center">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Icon name="roster" size={22} />
            </span>
            <div className="flex-1">
              <p className="text-headline text-ink">You haven&apos;t entered a contest yet</p>
              <p className="mt-0.5 text-callout text-ink-2">Pick five players under a $1M cap. Takes about two minutes, and you can edit until lock.</p>
            </div>
            {primaryContest(featured, now) ? (
              <ButtonLink href={`/c/${primaryContest(featured, now)!.id}/build`} iconRight="chevronRight">
                Build your team
              </ButtonLink>
            ) : null}
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {mine.map(({ t, c }) => {
              const cta = contestCta(c, now);
              const e = c.myEntry!;
              const scored = e.rank !== null;
              return (
                <li key={c.id}>
                  <Link href={`/e/${e.id}`} className="group block rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-[#131b28]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-caption text-ink-3">{t.shortName}</div>
                        <div className="truncate text-headline text-ink">{c.name}</div>
                      </div>
                      <StatePill kind={cta.state} label={cta.stateLabel} />
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-4">
                      <div>
                        <div className="tabular text-[1.75rem] leading-none font-semibold tracking-tight text-ink">{scored ? pts(e.points) : "—"}</div>
                        <div className="mt-1 text-caption text-ink-3">{scored ? "points" : "no points yet"}</div>
                      </div>
                      <div className="text-right">
                        {scored ? (
                          <>
                            <div className="tabular flex items-center justify-end gap-1.5 text-headline text-ink">
                              {ordinal(e.rank!)}
                              <span className="text-callout font-normal text-ink-3">/ {e.entriesCount}</span>
                            </div>
                            <div className="text-caption text-lavender">{percentileLabel(e.rank, e.entriesCount)}</div>
                          </>
                        ) : (
                          <div className="text-callout text-ink-2">Scoring starts at lock</div>
                        )}
                      </div>
                    </div>
                    {cta.deadline ? (
                      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-footnote text-ink-2">
                        <Icon name="clock" size={15} />
                        {cta.deadline.label} <Countdown to={cta.deadline.at} now={nowIso} className="font-semibold text-ink" />
                        <span className="ml-auto inline-flex items-center gap-0.5 font-medium text-accent">
                          Open <Icon name="chevronRight" size={15} />
                        </span>
                      </div>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {upcoming.length ? (
        <section aria-labelledby="upcoming">
          <SectionHeader id="upcoming" title="Upcoming tournaments" />
          <ul className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
            {upcoming.map((t) => (
              <li key={t.id} className="w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-auto">
                <EventTile t={t} now={now} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {completed.length ? (
        <section aria-labelledby="completed">
          <SectionHeader id="completed" title="Recently completed" />
          <ul className="space-y-2">
            {completed.map((t) => {
              const myDone = t.contests.find((c) => c.myEntry);
              return (
                <li key={t.id}>
                  <Link href={`/t/${t.slug}`} className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 hover:border-border-strong">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-elevated text-ink-2">
                      <Icon name="trophy" size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-callout font-semibold text-ink">{t.name}</div>
                      <div className="text-caption text-ink-3">{dateRange(t.beginAt, t.endAt)}</div>
                    </div>
                    {myDone?.myEntry?.rank ? (
                      <div className="text-right">
                        <div className="tabular text-callout font-semibold text-ink">{ordinal(myDone.myEntry.rank)}</div>
                        <div className="text-caption text-lavender">{percentileLabel(myDone.myEntry.rank, myDone.myEntry.entriesCount)}</div>
                      </div>
                    ) : (
                      <StatePill kind="completed" />
                    )}
                    <Icon name="chevronRight" size={18} className="text-ink-3" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function FeaturedEvent({ t, now, nowIso }: { t: TournamentSummary; now: Date; nowIso: string }) {
  const contest = primaryContest(t, now);
  const cta = contest ? contestCta(contest, now) : null;
  const accent = TIER_ACCENT[t.tier] ?? "#a78bfa";
  return (
    <section aria-labelledby="featured" className="relative overflow-hidden rounded-[24px] border border-border bg-surface">
      <EventArt seed={t.slug} accent={accent} className="pointer-events-none absolute inset-0 h-full w-full" />
      <div className="relative p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-eyebrow" style={{ color: accent }}>
            CS2 {TIER_LABEL[t.tier]}
          </span>
          <span className="text-caption text-ink-3">· {t.location}</span>
          {t.isDemo ? <DemoBadge className="ml-auto" /> : null}
        </div>
        <h1 id="featured" className="mt-2 text-display text-ink sm:text-[2.5rem] sm:leading-[2.75rem]">
          {t.shortName}
        </h1>
        <p className="mt-1 text-callout text-ink-2">
          {dateRange(t.beginAt, t.endAt)} ·{" "}
          {t.currentStage?.status === "live"
            ? `${t.currentStage.name} live`
            : t.status === "live" && t.currentStage
              ? `Next up: ${t.currentStage.name}`
              : t.status === "completed"
                ? "Completed"
                : `Starts with ${t.stages[0]?.name}`}
        </p>

        <StageProgress stages={t.stages} className="mt-5 max-w-xl" />

        {contest && cta ? (
          <div className="mt-6 rounded-2xl border border-border bg-[rgb(10_14_22/0.55)] p-4 backdrop-blur-sm sm:max-w-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-headline text-ink">{contest.name}</span>
                  <StatePill kind={cta.state} label={cta.stateLabel} />
                </div>
                <p className="mt-0.5 line-clamp-2 text-footnote text-ink-2">{contest.tagline}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
              {cta.deadline ? (
                <div>
                  <div className="text-caption text-ink-3">{cta.deadline.label}</div>
                  <Countdown to={cta.deadline.at} now={nowIso} className="text-title text-ink" />
                </div>
              ) : null}
              <div>
                <div className="text-caption text-ink-3">Format</div>
                <div className="text-callout font-medium text-ink">5 players · $1M cap · 1.5× captain</div>
              </div>
              <div>
                <div className="text-caption text-ink-3">Entries</div>
                <div className="tabular text-callout font-medium text-ink">{contest.entries.toLocaleString("en")}</div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {cta.primary.href ? (
                <ButtonLink href={cta.primary.href} size="lg" iconRight="chevronRight" className="flex-1 sm:flex-none">
                  {cta.primary.label}
                </ButtonLink>
              ) : null}
              <ButtonLink href={`/t/${t.slug}`} size="lg" variant="secondary" className="flex-1 sm:flex-none">
                Event hub
              </ButtonLink>
            </div>
          </div>
        ) : null}

        {t.contests.length > 1 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {t.contests
              .filter((c) => c.id !== contest?.id)
              .map((c) => {
                const x = contestCta(c, now);
                return (
                  <li key={c.id}>
                    <Link href={`/t/${t.slug}/fantasy`} className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-[rgb(10_14_22/0.5)] px-3.5 text-footnote text-ink-2 hover:text-ink">
                      <span className="font-semibold text-ink">{c.name}</span>
                      <span className={cn(x.state === "open" || x.state === "window" ? "text-accent" : "text-ink-3")}>{x.stateLabel}</span>
                      {x.state === "upcoming" && x.deadline ? (
                        <span className="text-ink-3">
                          · <LocalTime iso={x.deadline!.at} format="date" />
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

function EventTile({ t, now }: { t: TournamentSummary; now: Date }) {
  const accent = TIER_ACCENT[t.tier] ?? "#7d8ba0";
  const c = t.contests[0];
  const open = c && c.openWindow && new Date(c.openWindow.lockAt) > now;
  return (
    <Link href={`/t/${t.slug}`} className="group relative block h-full overflow-hidden rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-border-strong">
      <EventArt seed={t.slug} accent={accent} className="pointer-events-none absolute inset-0 h-full w-full opacity-70" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-eyebrow" style={{ color: accent }}>
            CS2 · {TIER_LABEL[t.tier]}
          </span>
          {t.isDemo ? <DemoBadge /> : null}
        </div>
        <div className="mt-6 text-headline text-ink">{t.shortName}</div>
        <div className="text-footnote text-ink-2">
          {dateRange(t.beginAt, t.endAt)} · {t.location}
        </div>
        <div className="mt-3 text-footnote">
          {open ? (
            <span className="font-medium text-accent">Entries open</span>
          ) : c ? (
            <span className="text-ink-3">
              Entries open <LocalTime iso={c.opensAt} format="date" />
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
