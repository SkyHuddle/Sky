import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, SectionHeader } from "@/components/ui/primitives";
import { Countdown, StatePill } from "@/components/ui/status";
import { contestCta } from "@/lib/contest";
import { ordinal, percentileLabel, pts } from "@/lib/format";
import { pageContext } from "@/server/page";
import { tournamentSummaries } from "@/server/queries/tournament";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your fantasy" };

export default async function FantasyPage() {
  const { db, viewer, now } = await pageContext();
  const ts = await tournamentSummaries(db, viewer?.id ?? null);
  const nowIso = now.toISOString();
  const mine = ts.flatMap((t) => t.contests.filter((c) => c.myEntry).map((c) => ({ t, c })));
  const active = mine.filter((x) => x.c.status !== "completed");
  const done = mine.filter((x) => x.c.status === "completed");
  const open = ts.flatMap((t) => t.contests.filter((c) => !c.myEntry && c.openWindow && new Date(c.openWindow.lockAt) > now).map((c) => ({ t, c })));

  return (
    <div className="mx-auto max-w-3xl space-y-9">
      <div>
        <h1 className="text-display text-ink">Your fantasy</h1>
        <p className="mt-1 text-callout text-ink-2">Every team you&apos;ve entered, live and finished.</p>
      </div>

      {!viewer ? (
        <EmptyState icon="roster" title="Sign in to see your teams" body="Build a team without an account; sign in when you submit it." action={<ButtonLink href="/signin?next=/fantasy">Sign in</ButtonLink>} />
      ) : null}

      {viewer ? (
        <section aria-labelledby="active-h">
          <SectionHeader id="active-h" title="Active" />
          {active.length === 0 ? (
            <EmptyState icon="roster" title="No active teams" body="Enter a contest to start following your players." />
          ) : (
            <ul className="space-y-2">
              {active.map(({ t, c }) => {
                const cta = contestCta(c, now);
                return (
                  <li key={c.id}>
                    <Link href={`/e/${c.myEntry!.id}`} className="block rounded-2xl bg-surface p-4 hover:border-border-strong">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-headline text-ink">{t.shortName}</div>
                          <div className="text-caption text-ink-3">{c.name}</div>
                        </div>
                        <StatePill kind={cta.state} label={cta.stateLabel} />
                      </div>
                      <div className="mt-3 flex items-end justify-between">
                        <div className="tabular text-title text-ink">{c.myEntry!.rank ? `${pts(c.myEntry!.points)} pts` : "Entered"}</div>
                        {c.myEntry!.rank ? (
                          <div className="text-right text-callout">
                            <span className="tabular font-semibold text-ink">{ordinal(c.myEntry!.rank)}</span>
                            <span className="text-ink-3"> / {c.myEntry!.entriesCount}</span>
                            <div className="text-caption text-lavender">{percentileLabel(c.myEntry!.rank, c.myEntry!.entriesCount)}</div>
                          </div>
                        ) : null}
                      </div>
                      {cta.deadline ? (
                        <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-footnote text-ink-2">
                          <Icon name="clock" size={14} /> {cta.deadline.label} <Countdown to={cta.deadline.at} now={nowIso} className="font-semibold text-ink" />
                        </p>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {open.length ? (
        <section aria-labelledby="open-h">
          <SectionHeader id="open-h" title="Open for entry" />
          <ul className="space-y-2">
            {open.map(({ t, c }) => (
              <li key={c.id} className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-surface p-4">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-callout font-semibold text-ink">
                    {t.shortName} · {c.name}
                  </div>
                  <div className="text-caption text-ink-3">
                    Locks in <Countdown to={c.openWindow!.lockAt} now={nowIso} /> · {c.entries} entries
                  </div>
                </div>
                <ButtonLink href={`/c/${c.id}/build`} size="sm">
                  Build team
                </ButtonLink>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {done.length ? (
        <section aria-labelledby="done-h">
          <SectionHeader id="done-h" title="Completed" />
          <ul className="space-y-2">
            {done.map(({ t, c }) => (
              <li key={c.id}>
                <Link href={`/e/${c.myEntry!.id}`} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 hover:border-border-strong">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-callout font-semibold text-ink">{t.name}</div>
                    <div className="text-caption text-ink-3">{c.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="tabular text-callout font-semibold text-ink">{c.myEntry!.rank ? ordinal(c.myEntry!.rank) : "—"}</div>
                    <div className="text-caption text-lavender">{percentileLabel(c.myEntry!.rank, c.myEntry!.entriesCount)}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
