import Link from "next/link";
import { notFound } from "next/navigation";
import { PlayerDetailView } from "@/components/player/PlayerDetailView";
import { Icon } from "@/components/ui/Icon";
import { pageContext } from "@/server/page";
import { playerDetail } from "@/server/queries/contest";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ playerId: string }> }) {
  return { title: decodeURIComponent((await params).playerId).replace("demo-player-", "") };
}

export default async function PlayerPage({ params, searchParams }: { params: Promise<{ playerId: string }>; searchParams: Promise<{ contest?: string }> }) {
  const playerId = decodeURIComponent((await params).playerId);
  const { contest } = await searchParams;
  const { db, now } = await pageContext();
  const d = await playerDetail(db, playerId, contest ?? null, now);
  if (!d) notFound();
  return (
    <div className="mx-auto max-w-2xl lg:max-w-6xl">
      {contest ? (
        <Link href={`/c/${encodeURIComponent(contest)}/build`} className="mb-4 inline-flex items-center gap-1 text-callout text-ink-2 hover:text-ink">
          <Icon name="chevronLeft" size={16} /> Back to your team
        </Link>
      ) : null}
      <PlayerDetailView d={d} />
    </div>
  );
}
