import { redirect } from "next/navigation";
import { CreateLeagueForm } from "@/components/league/LeagueClient";
import { pageContext } from "@/server/page";
import { tournamentSummaries } from "@/server/queries/tournament";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create a league" };

export default async function NewLeaguePage({ searchParams }: { searchParams: Promise<{ contest?: string }> }) {
  const { contest } = await searchParams;
  const { db, viewer } = await pageContext();
  if (!viewer) redirect(`/signin?next=${encodeURIComponent(`/leagues/new${contest ? `?contest=${contest}` : ""}`)}`);
  const ts = await tournamentSummaries(db, viewer.id);
  const contests = ts.flatMap((t) => t.contests.filter((c) => c.status !== "completed").map((c) => ({ id: c.id, label: `${t.shortName} · ${c.name}` })));
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-display text-ink">Create a league</h1>
      <p className="mt-1 mb-7 text-callout text-ink-2">Pick a contest, name it, share the link. That&apos;s it.</p>
      <CreateLeagueForm contests={contests} defaultContest={contest} />
    </div>
  );
}
