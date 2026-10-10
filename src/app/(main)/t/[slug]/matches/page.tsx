import { notFound } from "next/navigation";
import { MatchRow } from "@/components/tournament/MatchRow";
import { EmptyState } from "@/components/ui/primitives";
import { pageContext } from "@/server/page";
import { tournamentHub } from "@/server/queries/tournament";

export const dynamic = "force-dynamic";

export default async function TournamentMatches({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { db, viewer } = await pageContext();
  const hub = await tournamentHub(db, slug, viewer?.id ?? null);
  if (!hub) notFound();
  if (hub.matches.length === 0) {
    return <EmptyState icon="calendar" title="No fixtures yet" body="Matches appear as soon as pairings are set, about a day before each round." />;
  }
  return (
    <div className="space-y-9">
      {hub.summary.stages.map((s) => {
        const ms = hub.matches.filter((m) => m.stageId === s.id);
        if (!ms.length) return null;
        const rounds = [...new Set(ms.map((m) => m.round))];
        return (
          <section key={s.id} aria-labelledby={`st-${s.id}`}>
            <h2 id={`st-${s.id}`} className="mb-3 text-headline text-ink">
              {s.name}
            </h2>
            <div className="space-y-5">
              {rounds.map((r) => (
                <div key={r}>
                  <h3 className="mb-2 text-eyebrow text-ink-3">{s.kind === "swiss" ? `Round ${r}` : ["Quarter-finals", "Semi-finals", "Grand final"][r - 1]}</h3>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {ms
                      .filter((m) => m.round === r)
                      .map((m) => (
                        <MatchRow key={m.id} m={m} teams={hub.teams} />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
