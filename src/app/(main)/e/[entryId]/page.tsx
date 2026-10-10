import { notFound } from "next/navigation";
import { EntryView } from "@/components/entry/EntryView";
import { pageContext } from "@/server/page";
import { entryDashboard } from "@/server/queries/contest";
import { entryRecap } from "@/server/queries/recap";
import { getBoard } from "@/server/services/leaderboards";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ entryId: string }> }) {
  const { entryId } = await params;
  const image = `/api/og/entry/${encodeURIComponent(entryId)}`;
  return { title: "Fantasy team", openGraph: { images: [{ url: image, width: 1200, height: 630 }] }, twitter: { card: "summary_large_image", images: [image] } };
}

export default async function EntryPage({ params }: { params: Promise<{ entryId: string }> }) {
  const { entryId } = await params;
  const { db, viewer, now, pipeline } = await pageContext();
  const d = await entryDashboard(db, entryId, viewer?.id ?? null, now);
  if (!d) notFound();
  const board = await getBoard(db, d.contest.id, { kind: "global" }, { viewerId: d.entry.userId, pageSize: 5 });
  const recap = await entryRecap(db, d);
  return <EntryView d={d} board={board} recap={recap} nowIso={now.toISOString()} healthOk={pipeline.ok} />;
}
