import { notFound } from "next/navigation";
import { MatchRow } from "@/components/tournament/MatchRow";
import { Panels } from "@/components/ui/Panels";
import { EmptyState } from "@/components/ui/primitives";
import { pageContext } from "@/server/page";
import { tournamentHub } from "@/server/queries/tournament";

export const dynamic = "force-dynamic";

/** Playoff bracket: one round at a time on phones (round switcher), the full bracket from `lg`. */
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
  // Open on the round being played (or the last finished one).
  const current = rounds.find((r) => r.status === "live") ?? [...rounds].reverse().find((r) => r.status === "completed") ?? rounds[0]!;
  return (
    <Panels
      label="Bracket rounds"
      initial={current.id}
      gridClass={cols.length === 3 ? "lg:grid-cols-3" : cols.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-4"}
      panels={cols.map((c) => {
        const list = ms.filter((m) => m.stageId === c.id);
        return {
          id: c.id,
          label: c.title,
          content: (
            <section aria-label={c.title} className="flex h-full flex-col">
              <h2 className="mb-3 hidden text-eyebrow text-ink-3 lg:block">{c.title}</h2>
              <div className="flex flex-1 flex-col justify-around gap-3">
                {list.length ? list.map((m) => <MatchRow key={m.id} m={m} teams={hub.teams} />) : <div className="rounded-xl bg-surface p-6 text-center text-footnote text-ink-3">To be decided</div>}
              </div>
            </section>
          ),
        };
      })}
    />
  );
}
