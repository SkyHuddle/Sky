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
  const po = hub.summary.stages.find((s) => s.kind === "single_elimination");
  const ms = po ? hub.matches.filter((m) => m.stageId === po.id) : [];
  if (!po || ms.length === 0) {
    return <EmptyState icon="grid" title="Playoff bracket isn't set yet" body="The bracket appears once the last Swiss stage finishes and the eight playoff teams are seeded." />;
  }
  const cols = [
    { round: 1, title: "Quarter-finals" },
    { round: 2, title: "Semi-finals" },
    { round: 3, title: "Grand final" },
  ];
  return (
    <div className="scrollbar-none -mx-4 overflow-x-auto px-4 pb-2">
      <div className="grid min-w-[760px] grid-cols-3 gap-5">
        {cols.map((c) => {
          const list = ms.filter((m) => m.round === c.round);
          return (
            <section key={c.round} aria-label={c.title} className="flex flex-col">
              <h2 className="mb-3 text-eyebrow text-ink-3">{c.title}</h2>
              <div className="flex flex-1 flex-col justify-around gap-3">
                {list.length ? list.map((m) => <MatchRow key={m.id} m={m} teams={hub.teams} />) : <div className="rounded-xl border border-dashed border-border-strong p-6 text-center text-footnote text-ink-3">To be decided</div>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
