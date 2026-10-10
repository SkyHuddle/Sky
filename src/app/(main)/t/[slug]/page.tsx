import { notFound } from "next/navigation";
import { ContestCard } from "@/components/tournament/ContestCard";
import { MatchRow } from "@/components/tournament/MatchRow";
import { SectionHeader, TextLink } from "@/components/ui/primitives";
import { LocalTime } from "@/components/ui/status";
import { cn } from "@/lib/cn";
import { pageContext } from "@/server/page";
import { tournamentHub } from "@/server/queries/tournament";

export const dynamic = "force-dynamic";

const FORMAT_NOTE: Record<string, string> = {
  swiss: "16-team Swiss · 3 wins advance, 3 losses out",
  single_elimination: "Single elimination · BO3 (Grand Final BO5)",
};

export default async function TournamentOverview({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { db, viewer, now } = await pageContext();
  const hub = await tournamentHub(db, slug, viewer?.id ?? null);
  if (!hub) notFound();
  const t = hub.summary;
  const recent = hub.matches.filter((m) => m.status === "completed").slice(-4).reverse();
  const next = hub.matches.filter((m) => m.status === "scheduled" || m.status === "live" || m.status === "postponed").slice(0, 4);
  return (
    <div className="space-y-9">
      <section aria-labelledby="contests-h">
        <SectionHeader id="contests-h" title="Fantasy contests" action={<TextLink href={`/t/${slug}/fantasy`}>Rules and leagues</TextLink>} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {t.contests.map((c) => (
            <ContestCard key={c.id} c={c} now={now} nowIso={now.toISOString()} slug={slug} />
          ))}
        </div>
      </section>

      <section aria-labelledby="format-h">
        <SectionHeader id="format-h" title="Format" />
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {t.stages.map((s) => (
            <li key={s.id} className={cn("rounded-2xl border bg-surface p-4", s.status === "live" ? "border-accent/40" : "border-border")}>
              <div className="flex items-center justify-between">
                <span className="text-headline text-ink">{s.name}</span>
                <span className="text-caption text-ink-3">{s.status === "live" ? "Live" : s.status === "completed" ? "Complete" : "Upcoming"}</span>
              </div>
              <p className="mt-1 text-footnote text-ink-2">{FORMAT_NOTE[s.kind]}</p>
              <p className="mt-2 text-caption text-ink-3">
                <LocalTime iso={s.beginAt} format="date" /> · {s.teamCount ? `${s.teamCount} teams known` : "Teams TBD"}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {next.length || recent.length ? (
        <section aria-labelledby="matches-h" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {next.length ? (
            <div>
              <SectionHeader id="matches-h" title="Up next" action={<TextLink href={`/t/${slug}/matches`}>All matches</TextLink>} />
              <div className="space-y-2">
                {next.map((m) => (
                  <MatchRow key={m.id} m={m} teams={hub.teams} compact />
                ))}
              </div>
            </div>
          ) : null}
          {recent.length ? (
            <div>
              <SectionHeader title="Latest results" />
              <div className="space-y-2">
                {recent.map((m) => (
                  <MatchRow key={m.id} m={m} teams={hub.teams} compact />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
