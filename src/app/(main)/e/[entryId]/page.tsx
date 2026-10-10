import { notFound } from "next/navigation";
import { EntryView } from "@/components/entry/EntryView";
import { pageContext } from "@/server/page";
import { entryDashboard } from "@/server/queries/contest";
import { getBoard } from "@/server/services/leaderboards";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fantasy team" };

export default async function EntryPage({ params }: { params: Promise<{ entryId: string }> }) {
  const { entryId } = await params;
  const { db, viewer, now, pipeline } = await pageContext();
  const d = await entryDashboard(db, entryId, viewer?.id ?? null, now);
  if (!d) notFound();
  const board = await getBoard(db, d.contest.id, { kind: "global" }, { viewerId: d.entry.userId, pageSize: 5 });
  return <EntryView d={d} board={board} nowIso={now.toISOString()} healthOk={pipeline.ok} />;
}
