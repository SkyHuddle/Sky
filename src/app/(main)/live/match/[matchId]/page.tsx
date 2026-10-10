import { notFound } from "next/navigation";
import { MatchCenterView } from "@/components/live/MatchCenterView";
import { pageContext } from "@/server/page";
import { matchCenter } from "@/server/queries/match";

export const dynamic = "force-dynamic";
export const metadata = { title: "Match" };

export default async function MatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { db, viewer, now } = await pageContext();
  const m = await matchCenter(db, decodeURIComponent((await params).matchId), viewer?.id ?? null, now);
  if (!m) notFound();
  return <MatchCenterView initial={m} />;
}
