import { notFound } from "next/navigation";
import Link from "next/link";
import { ContestCard } from "@/components/tournament/ContestCard";
import { RulesCard } from "@/components/tournament/RulesCard";
import { Icon } from "@/components/ui/Icon";
import { SectionHeader } from "@/components/ui/primitives";
import { pageContext } from "@/server/page";
import { publicLeagues } from "@/server/queries/people";
import { tournamentHub } from "@/server/queries/tournament";

export const dynamic = "force-dynamic";

export default async function TournamentFantasy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { db, viewer, now } = await pageContext();
  const hub = await tournamentHub(db, slug, viewer?.id ?? null);
  if (!hub) notFound();
  const t = hub.summary;
  const leagues = await publicLeagues(db, t.contests.map((c) => c.id));
  const major = t.contests.length > 1;
  return (
    <div className="space-y-9">
      {major ? (
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-headline text-ink">Two contests, two ways to play</h2>
          <div className="mt-3 grid gap-4 text-callout text-ink-2 md:grid-cols-2">
            <p>
              <span className="font-semibold text-ink">Main Event</span> starts at Stage 3, when the top-seeded teams enter. All the stars, one transfer window before the playoffs. The best place to start.
            </p>
            <p>
              <span className="font-semibold text-ink">Full Run</span> starts at Stage 1 with the lower seeds and adds new teams at each window. More decisions for dedicated players.
            </p>
          </div>
          <p className="mt-3 text-footnote text-ink-3">They are separate competitions with separate leaderboards. Points are never compared between them.</p>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {t.contests.map((c) => (
          <ContestCard key={c.id} c={c} now={now} nowIso={now.toISOString()} slug={slug} />
        ))}
      </div>

      {leagues.length ? (
        <section aria-labelledby="leagues-h">
          <SectionHeader id="leagues-h" title="Public leagues" />
          <ul className="grid gap-2 sm:grid-cols-2">
            {leagues.map((l) => (
              <li key={l.id}>
                <Link href={`/leagues/${l.id}`} className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 hover:border-border-strong">
                  <span className="inline-flex size-10 items-center justify-center rounded-xl bg-lavender-soft text-lavender">
                    <Icon name="trophy" size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-callout font-semibold text-ink">{l.name}</div>
                    <div className="text-caption text-ink-3">
                      {t.contests.find((c) => c.id === l.contestId)?.name} · {l.members} members
                    </div>
                  </div>
                  <Icon name="chevronRight" size={18} className="text-ink-3" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {t.contests[0] ? <RulesCard ruleSetId={t.contests[0].ruleSetId} rules={t.contests[0].rules} /> : null}
    </div>
  );
}
