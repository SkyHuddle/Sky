import { notFound } from "next/navigation";
import { TeamMark } from "@/components/ui/identity";
import { Panels } from "@/components/ui/Panels";
import { EmptyState } from "@/components/ui/primitives";
import { StatePill } from "@/components/ui/status";
import { cn } from "@/lib/cn";
import { pageContext } from "@/server/page";
import { tournamentHub } from "@/server/queries/tournament";

export const dynamic = "force-dynamic";

export default async function TournamentStandings({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { db, viewer } = await pageContext();
  const hub = await tournamentHub(db, slug, viewer?.id ?? null);
  if (!hub) notFound();
  const swiss = hub.summary.stages.filter((s) => s.kind === "swiss" && (hub.standings[s.id]?.length ?? 0) > 0);
  if (swiss.length === 0) return <EmptyState icon="list" title="No standings yet" body="Stage standings appear when teams are set." />;
  const current = swiss.find((s) => s.status === "live") ?? [...swiss].reverse().find((s) => s.status === "completed") ?? swiss[0]!;
  return (
    <Panels
      label="Stages"
      initial={current.id}
      panels={swiss.map((s) => ({
        id: s.id,
        label: s.name,
        content: (
          <section key={s.id} aria-labelledby={`sd-${s.id}`} className="overflow-hidden rounded-2xl bg-surface">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 id={`sd-${s.id}`} className="text-headline text-ink">
                {s.name}
              </h2>
              <span className="text-caption text-ink-3">{s.status === "completed" ? "Final" : s.status === "live" ? "Live" : "Upcoming"}</span>
            </div>
            <table className="w-full text-callout">
              <thead className="sr-only">
                <tr>
                  <th>Team</th>
                  <th>Record</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {hub.standings[s.id]!.map((r) => (
                  <tr key={r.teamId} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2.5">
                        <TeamMark team={hub.teams[r.teamId]} size={24} />
                        <span className={cn("truncate", r.status === "eliminated" ? "text-ink-3" : "text-ink")}>{hub.teams[r.teamId]?.name}</span>
                      </div>
                    </td>
                    <td className="tabular px-2 py-2 text-right font-semibold text-ink">
                      {r.wins}–{r.losses}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {r.status === "advanced" ? <StatePill kind="open" label="Through" /> : r.status === "eliminated" ? <StatePill kind="eliminated" label="Out" /> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ),
      }))}
    />
  );
}
