import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq, inArray } from "drizzle-orm";
import { Leaderboard } from "@/components/board/Leaderboard";
import { Icon } from "@/components/ui/Icon";
import { DemoBadge } from "@/components/ui/identity";
import * as s from "@/server/db/schema";
import { pageContext } from "@/server/page";
import { myLeagues } from "@/server/queries/people";
import { getBoard } from "@/server/services/leaderboards";

export const dynamic = "force-dynamic";
export const metadata = { title: "Standings" };

export default async function LeaderboardPage({ params }: { params: Promise<{ contestId: string }> }) {
  const contestId = decodeURIComponent((await params).contestId);
  const { db, viewer } = await pageContext();
  const [c] = await db.select().from(s.contests).where(eq(s.contests.id, contestId));
  if (!c) notFound();
  const [t] = await db.select().from(s.tournaments).where(eq(s.tournaments.id, c.tournamentId));
  const initial = await getBoard(db, contestId, { kind: "global" }, { viewerId: viewer?.id ?? null, pageSize: 50 });
  const leagues = viewer ? (await myLeagues(db, viewer.id)).filter((l) => l.contestId === contestId) : [];
  const windows = await db.select().from(s.contestWindows).where(eq(s.contestWindows.contestId, contestId)).orderBy(asc(s.contestWindows.position));
  const stageRows = windows.length ? await db.select({ id: s.stages.id, name: s.stages.name }).from(s.stages).where(inArray(s.stages.id, windows.map((w) => w.stageId))) : [];
  const stageNames = new Map(stageRows.map((x) => [x.id, x.name]));
  const scopes = [
    { key: "global", label: "Global", query: "scope=global" },
    ...(viewer ? [{ key: "friends", label: "Friends", query: "scope=friends" }] : []),
    ...leagues.map((l) => ({ key: `league-${l.id}`, label: l.name, query: `scope=league&league=${encodeURIComponent(l.id)}` })),
    // Stage cups: extra standings from the same entry, one per stage that has been scored.
    ...windows
      .filter((w) => w.status === "locked" || w.status === "completed")
      .map((w) => ({ key: `stage-${w.id}`, label: `${stageNames.get(w.stageId) ?? "Stage"} Cup`, query: `scope=stage&window=${encodeURIComponent(w.id)}` })),
  ];
  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/t/${t!.slug}/fantasy`} className="mb-3 inline-flex items-center gap-1 text-callout text-ink-2 hover:text-ink">
        <Icon name="chevronLeft" size={16} /> {t!.shortName}
      </Link>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <h1 className="text-title text-ink">{c.name} standings</h1>
        {t!.isDemo ? <DemoBadge /> : null}
      </div>
      <p className="mb-5 -mt-3 text-callout text-ink-2">One entry, ranked overall, among friends, and stage by stage.</p>
      <Leaderboard contestId={contestId} initial={initial} scopes={scopes} viewerId={viewer?.id ?? null} />
      {viewer ? (
        <Link href={`/leagues/new?contest=${encodeURIComponent(contestId)}`} className="mt-4 flex min-h-[60px] items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-callout text-ink-2 hover:text-ink">
          <Icon name="trophy" size={18} className="text-lavender" />
          <span className="flex-1">Play with friends: create a private league. Your entry joins it as is.</span>
          <Icon name="chevronRight" size={18} className="text-ink-3" />
        </Link>
      ) : null}
    </div>
  );
}
