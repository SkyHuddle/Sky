import Link from "next/link";
import { JoinByCode } from "@/components/league/LeagueClient";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, SectionHeader } from "@/components/ui/primitives";
import { StatePill } from "@/components/ui/status";
import { ordinal } from "@/lib/format";
import { pageContext } from "@/server/page";
import { myLeagues, publicLeagues } from "@/server/queries/people";
import { tournamentSummaries } from "@/server/queries/tournament";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leagues" };

export default async function LeaguesPage({ searchParams }: { searchParams: Promise<{ contest?: string }> }) {
  const { contest } = await searchParams;
  const { db, viewer } = await pageContext();
  const mine = viewer ? await myLeagues(db, viewer.id) : [];
  const ts = await tournamentSummaries(db, viewer?.id ?? null);
  const activeContests = ts.flatMap((t) => t.contests.filter((c) => c.status !== "completed").map((c) => ({ ...c, t })));
  const pub = (await publicLeagues(db, activeContests.map((c) => c.id))).filter((l) => !mine.some((m) => m.id === l.id));
  const createHref = `/leagues/new${contest ? `?contest=${encodeURIComponent(contest)}` : ""}`;
  return (
    <div className="mx-auto max-w-3xl space-y-9">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-display text-ink">Leagues</h1>
          <p className="mt-1 text-callout text-ink-2">Compete with friends and communities. One team counts in every league you join.</p>
        </div>
        <ButtonLink href={viewer ? createHref : `/signin?next=${encodeURIComponent(createHref)}`} icon="plus">
          Create league
        </ButtonLink>
      </div>

      <section aria-labelledby="join-h" className="rounded-2xl bg-surface p-4">
        <h2 id="join-h" className="mb-2 text-headline text-ink">
          Have an invite?
        </h2>
        <JoinByCode />
      </section>

      <section aria-labelledby="mine-h">
        <SectionHeader id="mine-h" title="Your leagues" />
        {!viewer ? (
          <EmptyState icon="trophy" title="Sign in to see your leagues" action={<ButtonLink href="/signin?next=/leagues">Sign in</ButtonLink>} />
        ) : mine.length === 0 ? (
          <EmptyState icon="trophy" title="No leagues yet" body="Create one and share the link, or join a public league below." />
        ) : (
          <ul className="space-y-2">
            {mine.map((l) => (
              <li key={l.id}>
                <Link href={`/leagues/${l.id}`} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 hover:border-border-strong">
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-lavender-soft text-lavender">
                    <Icon name="trophy" size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-callout font-semibold text-ink">{l.name}</span>
                      {l.role === "owner" ? <span className="text-caption text-ink-3">Owner</span> : null}
                    </div>
                    <div className="truncate text-caption text-ink-3">
                      {l.tournamentName} · {l.contestName} · {l.members} members
                    </div>
                  </div>
                  <div className="text-right">
                    {l.myRank ? <div className="tabular text-callout font-semibold text-ink">{ordinal(l.myRank)}</div> : <div className="text-caption text-ink-3">No entry</div>}
                    {l.contestStatus === "completed" ? <StatePill kind="completed" /> : null}
                  </div>
                  <Icon name="chevronRight" size={18} className="text-ink-3" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {pub.length ? (
        <section aria-labelledby="pub-h">
          <SectionHeader id="pub-h" title="Public leagues" />
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {pub.map((l) => {
              const c = activeContests.find((x) => x.id === l.contestId);
              return (
                <li key={l.id}>
                  <Link href={`/leagues/${l.id}`} className="block rounded-2xl bg-surface px-4 py-3.5 hover:border-border-strong">
                    <div className="truncate text-callout font-semibold text-ink">{l.name}</div>
                    <div className="truncate text-caption text-ink-3">
                      {c?.t.shortName} · {c?.name} · {l.members} members
                    </div>
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
