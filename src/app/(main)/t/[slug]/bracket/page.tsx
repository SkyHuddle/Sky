import { notFound } from "next/navigation";
import { MatchRow } from "@/components/tournament/MatchRow";
import { EmptyState } from "@/components/ui/primitives";
import { pageContext } from "@/server/page";
import { tournamentHub } from "@/server/queries/tournament";

export const dynamic = "force-dynamic";

/** Playoff bracket: columns scroll horizontally on phones instead of shrinking into illegibility. */
export default async function TournamentBracket({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { db, viewer } = await pageContext();
  const hub = await tournamentHub(db, slug, viewer?.id ?? null);
  if (!hub) notFound();
  // Each bracket round is its own stage (Quarterfinals, Semifinals, Grand Final).
  const rounds = hub.summary.stages.filter((s) => s.kind === "single_elimination");
  const ms = hub.matches.filter((m) => rounds.some((r) => r.id === m.stageId));
  if (rounds.length === 0 || ms.length === 0) {
    return <EmptyState icon="grid" title="Playoff bracket isn't set yet" body="The bracket appears once the last Swiss stage finishes and the eight playoff teams are seeded." />;
  }
  const cols = rounds.map((r) => ({ id: r.id, title: r.name }));
  return (
    <div className="scrollbar-none -mx-4 overflow-x-auto px-4 pb-2">
      <div className="grid min-w-[760px] gap-5" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}>
        {cols.map((c) => {
          const list = ms.filter((m) => m.stageId === c.id);
          return (
            <section key={c.id} aria-label={c.title} className="flex flex-col">
              <h2 className="mb-3 text-eyebrow text-ink-3">{c.title}</h2>
              <div className="flex flex-1 flex-col justify-around gap-3">
                {list.length ? list.map((m) => <MatchRow key={m.id} m={m} teams={hub.teams} />) : <div className="rounded-xl bg-surface p-6 text-center text-footnote text-ink-3">To be decided</div>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
