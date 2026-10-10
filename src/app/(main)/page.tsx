import Link from "next/link";
import {
  EventArt,
  TIER_ACCENT,
  TIER_LABEL,
} from "@/components/tournament/EventArt";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { DemoBadge, TeamMark } from "@/components/ui/identity";
import {
  EmptyState,
  SectionHeader,
  TextLink,
} from "@/components/ui/primitives";
import { Countdown, LocalTime, StatePill } from "@/components/ui/status";
import { cn } from "@/lib/cn";
import { contestCta, primaryContest } from "@/lib/contest";
import { dateRange, ordinal, percentileLabel, pts } from "@/lib/format";
import { pageContext } from "@/server/page";
import type { MatchLite, TeamLite } from "@/server/queries/common";
import {
  tournamentHub,
  tournamentSummaries,
  type TournamentHub,
  type TournamentSummary,
} from "@/server/queries/tournament";

export default async function HomePage() {
  const { db, viewer, now } = await pageContext();
  const all = await tournamentSummaries(db, viewer?.id ?? null);
  const nowIso = now.toISOString();

  const featured =
    all.find((t) => t.tier === "major" && t.status !== "completed") ??
    all.find((t) => t.status !== "completed") ??
    all[all.length - 1] ??
    null;
  const upcoming = all.filter(
    (t) => t !== featured && t.status !== "completed",
  );
  const completed = all.filter(
    (t) => t.status === "completed" && t !== featured,
  );
  const hub = featured
    ? await tournamentHub(db, featured.slug, viewer?.id ?? null)
    : null;
  const mine = all.flatMap((t) =>
    t.contests
      .filter((c) => c.myEntry && c.status !== "completed")
      .map((c) => ({ t, c })),
  );

  const heroContest = featured ? primaryContest(featured, now) : null;
  const heroBuilds =
    !!heroContest && contestCta(heroContest, now).state === "open";

  if (!featured) {
    return (
      <EmptyState
        icon="calendar"
        title="No tournaments yet"
        body="When the next CS2 event is announced, its fantasy contests will appear here."
      />
    );
  }

  return (
    <div className="space-y-9">
      <FeaturedEvent t={featured} hub={hub} now={now} nowIso={nowIso} />

      {/* With no entries yet, the hero's call to action already says what to do. */}
      {mine.length || !heroBuilds ? (
        <section aria-labelledby="your-fantasy">
          <SectionHeader
            id="your-fantasy"
            title="Your fantasy"
            action={
              mine.length ? (
                <Link
                  href="/fantasy"
                  className="text-callout font-medium text-accent"
                >
                  All entries
                </Link>
              ) : null
            }
          />
          {mine.length === 0 ? (
            <div className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-border-strong p-5 sm:flex-row sm:items-center">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                <Icon name="roster" size={22} />
              </span>
              <div className="flex-1">
                <p className="text-headline text-ink">
                  You haven&apos;t entered a contest yet
                </p>
                <p className="mt-0.5 text-callout text-ink-2">
                  Pick five players under a $1M cap. Takes about two minutes,
                  and you can edit until lock.
                </p>
              </div>
              {primaryContest(featured, now) ? (
                <ButtonLink
                  href={`/c/${primaryContest(featured, now)!.id}/build`}
                  iconRight="chevronRight"
                >
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
                    <Link
                      href={`/e/${e.id}`}
                      className="group block rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-[#131b28]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-caption text-ink-3">
                            {t.shortName}
                          </div>
                          <div className="truncate text-headline text-ink">
                            {c.name}
                          </div>
                        </div>
                        <StatePill kind={cta.state} label={cta.stateLabel} />
                      </div>
                      <div className="mt-4 flex items-end justify-between gap-4">
                        <div>
                          <div className="tabular text-[1.75rem] leading-none font-semibold tracking-tight text-ink">
                            {scored ? pts(e.points) : "—"}
                          </div>
                          <div className="mt-1 text-caption text-ink-3">
                            {scored ? "points" : "no points yet"}
                          </div>
                        </div>
                        <div className="text-right">
                          {scored ? (
                            <>
                              <div className="tabular flex items-center justify-end gap-1.5 text-headline text-ink">
                                {ordinal(e.rank!)}
                                <span className="text-callout font-normal text-ink-3">
                                  / {e.entriesCount}
                                </span>
                              </div>
                              <div className="text-caption text-lavender">
                                {percentileLabel(e.rank, e.entriesCount)}
                              </div>
                            </>
                          ) : (
                            <div className="text-callout text-ink-2">
                              Scoring starts at lock
                            </div>
                          )}
                        </div>
                      </div>
                      {cta.deadline ? (
                        <div className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-footnote text-ink-2">
                          <Icon name="clock" size={15} />
                          {cta.deadline.label}{" "}
                          <Countdown
                            to={cta.deadline.at}
                            now={nowIso}
                            className="font-semibold text-ink"
                          />
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
      ) : null}

      {hub ? <MatchStrip hub={hub} nowIso={nowIso} /> : null}

      {upcoming.length ? (
        <section aria-labelledby="upcoming">
          <SectionHeader id="upcoming" title="Upcoming tournaments" />
          <ul className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
            {upcoming.map((t) => (
              <li
                key={t.id}
                className="w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-auto"
              >
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
                  <Link
                    href={`/t/${t.slug}`}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 hover:border-border-strong"
                  >
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-elevated text-ink-2">
                      <Icon name="trophy" size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-callout font-semibold text-ink">
                        {t.name}
                      </div>
                      <div className="text-caption text-ink-3">
                        {dateRange(t.beginAt, t.endAt)}
                      </div>
                    </div>
                    {myDone?.myEntry?.rank ? (
                      <div className="text-right">
                        <div className="tabular text-callout font-semibold text-ink">
                          {ordinal(myDone.myEntry.rank)}
                        </div>
                        <div className="text-caption text-lavender">
                          {percentileLabel(
                            myDone.myEntry.rank,
                            myDone.myEntry.entriesCount,
                          )}
                        </div>
                      </div>
                    ) : (
                      <StatePill kind="completed" />
                    )}
                    <Icon
                      name="chevronRight"
                      size={18}
                      className="text-ink-3"
                    />
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

function FeaturedEvent({
  t,
  hub,
  now,
  nowIso,
}: {
  t: TournamentSummary;
  hub: TournamentHub | null;
  now: Date;
  nowIso: string;
}) {
  const contest = primaryContest(t, now);
  const cta = contest ? contestCta(contest, now) : null;
  const accent = TIER_ACCENT[t.tier] ?? "#a78bfa";
  const words = t.shortName.split(" ");
  const titleTail = words.pop();
  const stage = t.currentStage ?? t.stages[0];
  const seeded = hub
    ? (hub.standings[stage?.id ?? ""] ?? [])
        .map((r) => hub.teams[r.teamId])
        .filter((x): x is TeamLite => !!x)
    : [];
  const shownTeams = seeded.slice(0, 6);
  const others = t.contests.filter((c) => c.id !== contest?.id);

  return (
    <section aria-labelledby="featured" className="space-y-3">
      <div className="relative overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#0c111b] shadow-[0_30px_80px_-40px_rgb(59_108_240/0.45)]">
        <EventArt
          seed={t.slug}
          accent={accent}
          className="pointer-events-none absolute inset-0"
        />
        <div className="relative flex min-h-[340px] flex-col p-5 sm:min-h-[380px] sm:p-8">
          <div className="flex items-center gap-2">
            <span className="text-eyebrow" style={{ color: accent }}>
              Counter-Strike 2 · {TIER_LABEL[t.tier]}
            </span>
            {t.currentStage?.status === "live" ? (
              <StatePill
                kind="live"
                label={`${t.currentStage.name} live`}
                className="ml-auto"
              />
            ) : null}
            {t.isDemo ? (
              <DemoBadge
                className={cn(t.currentStage?.status !== "live" && "ml-auto")}
              />
            ) : null}
          </div>

          <h1 id="featured" className="text-hero mt-auto pt-14 text-ink">
            {words.length ? (
              <span className="block">{words.join(" ")}</span>
            ) : null}{" "}
            <span className="block">{titleTail}</span>
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.75rem] font-semibold tracking-[0.14em] text-ink-2 uppercase">
            <Icon name="calendar" size={13} />
            <span>{dateRange(t.beginAt, t.endAt)}</span>
            <span aria-hidden className="text-ink-3">
              ·
            </span>
            <span>{t.location}</span>
          </p>
          {shownTeams.length ? (
            <ul
              className="mt-5 flex items-center gap-2"
              aria-label={`${seeded.length} teams in ${stage?.name}`}
            >
              {shownTeams.map((team) => (
                <li
                  key={team.id}
                  title={team.name}
                  className="inline-flex size-11 items-center justify-center rounded-[13px] border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm"
                >
                  <TeamMark team={team} size={28} />
                </li>
              ))}
              {seeded.length > shownTeams.length ? (
                <li>
                  <Link
                    href={`/t/${t.slug}/standings`}
                    className="inline-flex h-11 items-center rounded-[13px] border border-white/[0.08] bg-white/[0.04] px-3 text-footnote font-semibold text-ink-2 hover:text-ink"
                    aria-label={`All ${seeded.length} teams`}
                  >
                    +{seeded.length - shownTeams.length}
                  </Link>
                </li>
              ) : null}
            </ul>
          ) : null}

          {cta?.primary.href ? (
            <ButtonLink
              href={cta.primary.href}
              size="lg"
              iconRight="arrowRight"
              className="mt-6 w-full sm:w-auto sm:self-start sm:px-8"
            >
              {cta.primary.label}
            </ButtonLink>
          ) : null}
        </div>
      </div>

      {contest && cta ? (
        <Link
          href={cta.primary.href || `/t/${t.slug}/fantasy`}
          className="group relative block overflow-hidden rounded-[22px] border border-lavender/25 bg-[linear-gradient(135deg,rgb(167_139_250/0.16),rgb(17_24_36/0.9)_55%)] p-4 transition-colors hover:border-lavender/45 sm:p-5"
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="display text-[1.375rem] leading-none text-ink">
                  {contest.name}
                </span>
                <span className="text-footnote text-ink-2">
                  ·{" "}
                  {contest.openWindow?.stageName ??
                    contest.windows[0]?.stageName}
                </span>
              </div>
              <p className="mt-1 line-clamp-1 text-footnote text-ink-2">
                {contest.tagline}
              </p>
            </div>
            <Icon
              name="chevronRight"
              size={22}
              className="mt-0.5 shrink-0 text-ink-2 transition-transform group-hover:translate-x-0.5"
            />
          </div>
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <StatePill kind={cta.state} label={cta.stateLabel} />
              {cta.deadline ? (
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-caption text-ink-3">
                    {cta.deadline.label}
                  </span>
                  <Countdown
                    to={cta.deadline.at}
                    now={nowIso}
                    className="num text-[1.5rem] leading-none text-ink"
                  />
                </div>
              ) : null}
            </div>
            <div className="text-right">
              <div className="num text-[1.5rem] leading-none text-ink">
                {contest.entries.toLocaleString("en")}
              </div>
              <div className="mt-1 text-caption text-ink-3">managers</div>
            </div>
          </div>
        </Link>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <ButtonLink
          href={`/t/${t.slug}`}
          variant="secondary"
          size="sm"
          icon="trophy"
        >
          Event hub
        </ButtonLink>
        {others.map((c) => {
          const x = contestCta(c, now);
          return (
            <Link
              key={c.id}
              href={`/t/${t.slug}/fantasy`}
              className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-border bg-surface px-3 text-footnote text-ink-2 hover:text-ink"
            >
              <span className="font-semibold text-ink">{c.name}</span>
              <span
                className={cn(
                  x.state === "open" || x.state === "window"
                    ? "text-accent"
                    : "text-ink-3",
                )}
              >
                {x.stateLabel}
              </span>
              {x.state === "upcoming" && x.deadline ? (
                <span className="text-ink-3">
                  · <LocalTime iso={x.deadline.at} format="date" />
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/** Live series first, then the next few scheduled ones, then the latest results. */
function MatchStrip({ hub, nowIso }: { hub: TournamentHub; nowIso: string }) {
  const live = hub.matches.filter((m) => m.status === "live");
  const next = hub.matches.filter(
    (m) => m.status === "scheduled" || m.status === "postponed",
  );
  const done = hub.matches
    .filter((m) => m.status === "completed")
    .slice(-6)
    .reverse();
  const list = live.length
    ? [...live, ...next].slice(0, 6)
    : next.length
      ? next.slice(0, 6)
      : done;
  if (!list.length) return null;
  const title = live.length
    ? "Live now"
    : next.length
      ? "Up next"
      : "Latest results";
  return (
    <section aria-labelledby="matches-strip">
      <SectionHeader
        id="matches-strip"
        title={title}
        action={
          <TextLink href={`/t/${hub.summary.slug}/matches`}>
            All matches
          </TextLink>
        }
      />
      <ul className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
        {list.map((m) => (
          <li
            key={m.id}
            className="w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-auto"
          >
            <MatchTile m={m} teams={hub.teams} nowIso={nowIso} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function MatchTile({
  m,
  teams,
  nowIso,
}: {
  m: MatchLite;
  teams: Record<string, TeamLite>;
  nowIso: string;
}) {
  const a = teams[m.teamAId];
  const b = teams[m.teamBId];
  const started =
    m.status === "live" || m.status === "completed" || m.status === "forfeit";
  const currentMap = m.maps[m.maps.length - 1];
  const side = (t: TeamLite | undefined, won: boolean) => (
    <div className="flex w-[4.5rem] flex-col items-center gap-1.5">
      <TeamMark team={t} size={38} />
      <span
        className={cn(
          "max-w-full truncate text-footnote font-semibold",
          won || !started ? "text-ink" : "text-ink-3",
        )}
      >
        {t?.acronym ?? "TBD"}
      </span>
    </div>
  );
  return (
    <div className="h-full rounded-[20px] border border-border bg-surface p-4">
      <div className="flex items-center justify-between text-caption text-ink-3">
        <span>
          BO{m.format} · {m.slot === "swiss" ? `Round ${m.round}` : m.slot}
        </span>
        {m.status === "live" ? (
          <StatePill kind="live" />
        ) : m.status === "postponed" ? (
          <StatePill kind="postponed" />
        ) : m.status === "completed" ? (
          <span>Final</span>
        ) : (
          <LocalTime iso={m.scheduledAt} />
        )}
      </div>
      <div className="mt-3 flex items-center justify-between">
        {side(a, m.winnerTeamId === m.teamAId)}
        <div className="text-center">
          {started ? (
            <div className="num flex items-center gap-2 text-[2rem] leading-none text-ink">
              <span
                className={cn(
                  m.winnerTeamId &&
                    m.winnerTeamId !== m.teamAId &&
                    "text-ink-3",
                )}
              >
                {m.mapsA}
              </span>
              <span className="text-ink-3">:</span>
              <span
                className={cn(
                  m.winnerTeamId &&
                    m.winnerTeamId !== m.teamBId &&
                    "text-ink-3",
                )}
              >
                {m.mapsB}
              </span>
            </div>
          ) : (
            <Countdown
              to={m.scheduledAt}
              now={nowIso}
              className="num text-[1.25rem] leading-none text-ink"
            />
          )}
          <div className="mt-1.5 text-caption text-ink-3">
            {m.status === "live" && currentMap
              ? `Map ${currentMap.number} · ${currentMap.mapName}`
              : started
                ? currentMap
                  ? `${m.maps.length} maps`
                  : "Forfeit"
                : "until start"}
          </div>
        </div>
        {side(b, m.winnerTeamId === m.teamBId)}
      </div>
    </div>
  );
}

function EventTile({ t, now }: { t: TournamentSummary; now: Date }) {
  const accent = TIER_ACCENT[t.tier] ?? "#7d8ba0";
  const c = t.contests[0];
  const open = c && c.openWindow && new Date(c.openWindow.lockAt) > now;
  return (
    <Link
      href={`/t/${t.slug}`}
      className="group relative block h-full overflow-hidden rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-border-strong"
    >
      <EventArt
        seed={t.slug}
        accent={accent}
        className="pointer-events-none absolute inset-0 opacity-80"
      />
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
