import Link from "next/link";
import { EventArt, TIER_ACCENT, TIER_LABEL } from "@/components/tournament/EventArt";
import { StageProgress } from "@/components/tournament/StageProgress";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { DemoBadge, PlayerAvatar, TeamMark } from "@/components/ui/identity";
import { EmptyState } from "@/components/ui/primitives";
import { Countdown, CountdownBlocks, LocalTime, StatePill } from "@/components/ui/status";
import { cn } from "@/lib/cn";
import { contestCta, primaryContest } from "@/lib/contest";
import { dateRange, money, ordinal, percentileLabel, pts } from "@/lib/format";
import { pageContext } from "@/server/page";
import { teamsById, type MatchLite, type TeamLite } from "@/server/queries/common";
import { tournamentHub, tournamentSummaries, type ContestView, type TournamentHub, type TournamentSummary } from "@/server/queries/tournament";

/**
 * Home / tournament lobby (DESIGN.md §5.1): find the event and resume your fantasy in seconds.
 * One featured hero with one CTA, then your entry, the event's contests, what's next, other events.
 */
export default async function HomePage() {
  const { db, viewer, now } = await pageContext();
  const [all, teamMap] = await Promise.all([tournamentSummaries(db, viewer?.id ?? null), teamsById(db)]);
  const teams = Object.fromEntries(teamMap);
  const nowIso = now.toISOString();

  const featured =
    all.find((t) => t.tier === "major" && t.status !== "completed") ?? all.find((t) => t.status !== "completed") ?? all[all.length - 1] ?? null;
  if (!featured) {
    return <EmptyState icon="calendar" title="No tournaments yet" body="When the next CS2 event is announced, its fantasy contests will appear here." />;
  }
  const hub = await tournamentHub(db, featured.slug, viewer?.id ?? null);
  const upcoming = all.filter((t) => t !== featured && t.status !== "completed");
  const completed = all.filter((t) => t.status === "completed" && t !== featured);
  const mine = all.flatMap((t) => t.contests.filter((c) => c.myEntry && c.status !== "completed").map((c) => ({ t, c })));
  const contest = primaryContest(featured, now);
  // Players competing right now come first (DESIGN.md §7.1): only when the viewer has an entry here.
  const liveMatches = hub?.matches.filter((m) => m.status === "live") ?? [];
  const liveNow = mine.some(({ t }) => t.id === featured.id) && liveMatches.length ? { count: liveMatches.length, teams: hub!.teams, matches: liveMatches.slice(0, 3) } : null;

  return (
    <div className="space-y-8 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-x-8 lg:gap-y-8 lg:space-y-0">
      <div className="space-y-4 lg:col-span-2">
        {liveNow ? <LiveNowCard live={liveNow} /> : null}
        <TournamentHero t={featured} contest={contest} now={now} nowIso={nowIso} />
      </div>

      <div className="space-y-8">
        <section aria-labelledby="your-fantasy">
          <h2 id="your-fantasy" className="mb-3 text-section text-ink">
            Your fantasy
          </h2>
          {mine.length ? (
            <ul className="space-y-3">
              {mine.map(({ t, c }) => (
                <li key={c.id}>
                  <EntrySummary t={t} c={c} teams={teams} now={now} nowIso={nowIso} />
                </li>
              ))}
            </ul>
          ) : (
            <FirstEntryPrompt c={contest} />
          )}
        </section>

        <section aria-labelledby="contests">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 id="contests" className="text-section text-ink">
              Contests
            </h2>
            <Link href={`/t/${featured.slug}/fantasy`} className="text-callout font-medium text-accent hover:text-accent-strong">
              How it works
            </Link>
          </div>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-surface">
            {featured.contests.map((c) => (
              <li key={c.id}>
                <ContestLine c={c} slug={featured.slug} now={now} nowIso={nowIso} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="space-y-8">
        {hub ? <NextMatches hub={hub} /> : null}

        {upcoming.length ? (
          <section aria-labelledby="upcoming">
            <h2 id="upcoming" className="mb-3 text-section text-ink">
              Upcoming events
            </h2>
            <ul className="space-y-2">
              {upcoming.map((t) => (
                <li key={t.id}>
                  <EventLine t={t} now={now} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {completed.length ? (
          <section aria-labelledby="completed">
            <h2 id="completed" className="mb-3 text-section text-ink">
              Completed
            </h2>
            <ul className="space-y-2">
              {completed.map((t) => {
                const done = t.contests.find((c) => c.myEntry);
                return (
                  <li key={t.id}>
                    <Link href={`/t/${t.slug}`} className="flex min-h-[64px] items-center gap-3 rounded-2xl bg-surface px-4 py-3 transition-colors hover:bg-elevated">
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-elevated text-ink-2">
                        <Icon name="trophy" size={19} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-callout font-semibold text-ink">{t.name}</span>
                        <span className="block text-footnote text-ink-3">{dateRange(t.beginAt, t.endAt)}</span>
                      </span>
                      {done?.myEntry?.rank ? (
                        <span className="text-right">
                          <span className="num block text-callout text-ink">{ordinal(done.myEntry.rank)}</span>
                          <span className="block text-caption text-lavender">{percentileLabel(done.myEntry.rank, done.myEntry.entriesCount)}</span>
                        </span>
                      ) : (
                        <span className="text-footnote text-ink-3">Final</span>
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
    </div>
  );
}

function LiveNowCard({ live }: { live: { count: number; teams: Record<string, TeamLite>; matches: MatchLite[] } }) {
  return (
    <Link href="/live" className="flex min-h-[72px] items-center gap-3 rounded-2xl border border-live/30 bg-surface px-4 py-3 transition-colors hover:bg-elevated">
      <span className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[rgb(255_120_129/0.12)] text-live">
        <Icon name="live" size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-headline text-ink">Matches are live</span>
        <span className="block truncate text-footnote text-ink-2">
          {live.matches.map((m) => `${live.teams[m.teamAId]?.acronym ?? "TBD"} v ${live.teams[m.teamBId]?.acronym ?? "TBD"}`).join(" · ")}
          {live.count > live.matches.length ? ` · +${live.count - live.matches.length}` : ""}
        </span>
      </span>
      <span className="inline-flex items-center gap-0.5 text-callout font-medium text-accent">
        Follow your team <Icon name="chevronRight" size={16} />
      </span>
    </Link>
  );
}

/** Compact cinematic hero: original event art above, readable overlay below, exactly one CTA. */
function TournamentHero({ t, contest, now, nowIso }: { t: TournamentSummary; contest: ContestView | null; now: Date; nowIso: string }) {
  const cta = contest ? contestCta(contest, now) : null;
  const accent = TIER_ACCENT[t.tier] ?? "#a99aff";
  const entered = !!contest?.myEntry;
  const ctaLabel = !cta
    ? null
    : cta.state === "open"
      ? entered
        ? "Edit Team"
        : "Build Team"
      : cta.state === "window"
        ? entered
          ? "Make Transfers"
          : "Join Late"
        : entered
          ? "View My Team"
          : "View Standings";
  const ctaHref = cta?.primary.href || `/t/${t.slug}`;
  return (
    <section aria-labelledby="featured" className="relative overflow-hidden rounded-2xl">
      <EventArt seed={t.slug} title={t.shortName.split(" ")[0]!} accent={accent} className="pointer-events-none absolute inset-0" />
      <div className="relative flex min-h-[236px] flex-col p-5 sm:min-h-[272px] sm:p-7 lg:min-h-[296px] lg:p-8">
        <div className="flex items-center gap-2">
          <span className="text-eyebrow text-ink-2">CS2 · {TIER_LABEL[t.tier]}</span>
          {t.isDemo ? <DemoBadge className="ml-auto" /> : null}
        </div>
        <div className="mt-auto pt-10">
          <Link href={`/t/${t.slug}`} className="group inline-flex items-center gap-1 rounded-md" aria-label={`${t.shortName}: tournament overview`}>
            <h1 id="featured" className="text-display text-ink sm:text-[3rem] sm:leading-[2.875rem] lg:text-[3.5rem] lg:leading-[3.25rem]">
              {t.shortName}
            </h1>
            <Icon name="chevronRight" size={22} className="mt-0.5 text-ink-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-footnote text-ink-2">
            <span>{dateRange(t.beginAt, t.endAt)}</span>
            <span aria-hidden className="text-ink-3">
              ·
            </span>
            <span>{t.location}</span>
            {t.currentStage && !(cta?.deadline && (cta.state === "open" || cta.state === "window")) ? (
              <>
                <span aria-hidden className="text-ink-3">
                  ·
                </span>
                <span>{t.currentStage.status === "live" ? `${t.currentStage.name} in progress` : t.currentStage.name}</span>
              </>
            ) : null}
          </p>
          {cta?.deadline && (cta.state === "open" || cta.state === "window") ? (
            <div className="mt-5">
              <div className="mb-2 text-footnote text-ink-2">
                {contest?.openWindow?.stageName} {cta.state === "window" ? "transfers close" : "locks"} in
              </div>
              <CountdownBlocks to={cta.deadline.at} now={nowIso} />
            </div>
          ) : null}
          {ctaLabel ? (
            <ButtonLink href={ctaHref} size="lg" className="mt-5 w-full sm:w-auto sm:min-w-[220px]">
              {ctaLabel}
            </ButtonLink>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** Your entry: points and rank, where the event is, and the next thing to do. */
function EntrySummary({ t, c, teams, now, nowIso }: { t: TournamentSummary; c: ContestView; teams: Record<string, TeamLite>; now: Date; nowIso: string }) {
  const e = c.myEntry!;
  const cta = contestCta(c, now);
  const scored = e.rank !== null;
  const stages = t.stages.filter((s) => c.windows.some((w) => w.stageId === s.id));
  return (
    <Link href={`/e/${e.id}`} className="block rounded-2xl bg-surface p-4 transition-colors hover:bg-elevated sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-headline text-ink">{c.name}</div>
          <div className="truncate text-footnote text-ink-3">{t.shortName}</div>
        </div>
        <StatePill kind={cta.state} label={cta.stateLabel} />
      </div>
      {e.lineup.length ? (
        <ul className="mt-4 flex gap-2" aria-label="Your lineup">
          {e.lineup.map((p) => (
            <li key={p.nickname} className="min-w-0 flex-1 text-center">
              <PlayerAvatar nickname={p.nickname} team={teams[p.teamId]} size={44} ring={p.captain ? "captain" : null} className="mx-auto" />
              <span className="mt-1 block truncate text-caption text-ink-2">{p.nickname}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-caption text-ink-3">Fantasy points</div>
          <div className="text-score text-ink">{scored ? pts(e.points) : "—"}</div>
        </div>
        <div>
          <div className="text-caption text-ink-3">Rank</div>
          <div className="text-score text-ink">{scored ? ordinal(e.rank!) : "—"}</div>
          {scored ? (
            <div className="text-caption text-ink-3">
              of {e.entriesCount.toLocaleString("en")} · <span className="text-lavender">{percentileLabel(e.rank, e.entriesCount)}</span>
            </div>
          ) : null}
        </div>
      </div>
      <StageProgress stages={stages} className="mt-4" />
      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-footnote">
        {cta.deadline ? (
          <span className="text-ink-2">
            {cta.deadline.label} <Countdown to={cta.deadline.at} now={nowIso} className="num text-ink" />
          </span>
        ) : (
          <span className="text-ink-2">{scored ? "Scores update after each map" : "Scoring starts at lock"}</span>
        )}
        <span className="ml-auto inline-flex items-center gap-0.5 font-medium text-accent">
          View My Team
          <Icon name="chevronRight" size={16} />
        </span>
      </div>
    </Link>
  );
}

/** No entry yet: explain the format from the contest's own rules; the hero carries the CTA. */
function FirstEntryPrompt({ c }: { c: ContestView | null }) {
  if (!c) return <p className="text-callout text-ink-2">No contests are open right now.</p>;
  const r = c.rules;
  const facts: Array<[string, string]> = [
    [`${r.rosterSize}`, "players"],
    [money(r.salaryCap), "salary cap"],
    [`${r.maxPerTeam}`, "per team"],
    [`${r.captainMultiplier}×`, "captain"],
  ];
  return (
    <div className="rounded-2xl bg-surface p-4 sm:p-5">
      <p className="text-headline text-ink">You haven&apos;t picked a team yet</p>
      <p className="mt-1 text-callout text-ink-2">Choose pros from the teams at this event. Your score follows their real results and updates after every map.</p>
      <dl className="mt-4 grid grid-cols-4 gap-2">
        {facts.map(([v, l]) => (
          <div key={l} className="rounded-xl bg-elevated px-1 py-2.5 text-center">
            <dt className="sr-only">{l}</dt>
            <dd className="num text-headline text-ink">{v}</dd>
            <dd className="text-caption text-ink-3">{l}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ContestLine({ c, slug, now, nowIso }: { c: ContestView; slug: string; now: Date; nowIso: string }) {
  const cta = contestCta(c, now);
  const first = c.windows[0]?.stageName;
  const last = c.windows[c.windows.length - 1]?.stageName;
  return (
    <Link
      href={c.myEntry ? `/e/${c.myEntry.id}` : cta.primary.href || `/t/${slug}/fantasy`}
      className="flex min-h-[72px] items-center gap-3 px-4 py-3 transition-colors hover:bg-elevated"
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-headline text-ink">{c.name}</span>
          <span className="rounded-md bg-elevated px-1.5 text-caption text-ink-2">Free</span>
        </span>
        <span className="mt-0.5 block text-footnote text-ink-2">
          {first === last ? first : `${first} → ${last}`} · {c.entries.toLocaleString("en")} managers
        </span>
        <span className="mt-2 flex flex-wrap items-center gap-2">
          <StatePill kind={cta.state} label={cta.stateLabel} />
          {cta.deadline && (cta.state === "open" || cta.state === "window") ? (
            <span className="text-caption text-ink-3">
              {cta.deadline.label} <Countdown to={cta.deadline.at} now={nowIso} className="num text-ink-2" />
            </span>
          ) : null}
        </span>
      </span>
      <Icon name="chevronRight" size={18} className="shrink-0 text-ink-3" />
    </Link>
  );
}

/** Up to three upcoming or in-progress series at the featured event. Not a scores app. */
function NextMatches({ hub }: { hub: TournamentHub }) {
  const list = hub.matches.filter((m) => m.status === "live" || m.status === "scheduled" || m.status === "postponed").slice(0, 3);
  if (!list.length) return null;
  return (
    <section aria-labelledby="next-matches">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="next-matches" className="text-section text-ink">
          Up next
        </h2>
        <Link href={`/t/${hub.summary.slug}/matches`} className="text-callout font-medium text-accent hover:text-accent-strong">
          All matches
        </Link>
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-surface">
        {list.map((m) => (
          <li key={m.id}>
            <MatchLine m={m} teams={hub.teams} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function MatchLine({ m, teams }: { m: MatchLite; teams: Record<string, TeamLite> }) {
  const a = teams[m.teamAId];
  const b = teams[m.teamBId];
  return (
    <div className="flex min-h-[64px] items-center gap-3 px-4 py-3">
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <TeamMark team={a} size={22} />
        <span className="truncate text-callout font-medium text-ink">{a?.acronym ?? "TBD"}</span>
        <span className="text-caption text-ink-3">vs</span>
        <TeamMark team={b} size={22} />
        <span className="truncate text-callout font-medium text-ink">{b?.acronym ?? "TBD"}</span>
      </span>
      <span className="shrink-0 text-right text-footnote">
        {m.status === "live" ? (
          <span className="text-ink-2">
            <span className="num text-ink">
              {m.mapsA}–{m.mapsB}
            </span>{" "}
            · Map {m.maps.length + 1} in progress
          </span>
        ) : m.status === "postponed" ? (
          <span className="text-warning">Postponed</span>
        ) : (
          <span className="text-ink-2">
            BO{m.format} · <LocalTime iso={m.scheduledAt} />
          </span>
        )}
      </span>
    </div>
  );
}

function EventLine({ t, now }: { t: TournamentSummary; now: Date }) {
  const c = t.contests[0];
  const open = c && c.openWindow && new Date(c.openWindow.lockAt) > now;
  const accent = TIER_ACCENT[t.tier] ?? "#788ba0";
  const begin = new Date(t.beginAt);
  return (
    <Link href={`/t/${t.slug}`} className="flex min-h-[72px] items-center gap-3 rounded-2xl bg-surface px-4 py-3 transition-colors hover:bg-elevated">
      <span className="relative inline-flex size-11 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl bg-elevated leading-none">
        <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: accent }} aria-hidden />
        <span className="text-caption text-ink-3">{begin.toLocaleString("en", { month: "short", timeZone: "UTC" })}</span>
        <span className="num text-headline text-ink">{begin.getUTCDate()}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-headline text-ink">{t.shortName}</span>
        <span className="block truncate text-footnote text-ink-3">
          {dateRange(t.beginAt, t.endAt)} · {t.location}
        </span>
      </span>
      <span className={cn("shrink-0 text-right text-footnote", open ? "font-medium text-accent" : "text-ink-3")}>
        {open ? "Open" : c ? (
          <>
            Opens <LocalTime iso={c.opensAt} format="date" />
          </>
        ) : null}
      </span>
    </Link>
  );
}
