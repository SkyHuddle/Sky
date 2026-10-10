import { LiveGameDay } from "@/components/live/LiveGameDay";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/primitives";
import { pageContext } from "@/server/page";
import { liveEntryFor, liveView, toLivePayload } from "@/server/queries/live";

export const dynamic = "force-dynamic";
export const metadata = { title: "Live" };

/** Live GameDay: the viewer's own fantasy players, live. */
export default async function LivePage({ searchParams }: { searchParams: Promise<{ entry?: string }> }) {
  const { db, viewer, now } = await pageContext();
  const { entry } = await searchParams;
  if (!viewer && !entry) {
    return (
      <EmptyState
        icon="live"
        title="Follow your team live"
        body="Sign in to see your players' matches, live map points and how your rank moves, all in one place."
        action={<ButtonLink href="/signin?next=/live">Sign In</ButtonLink>}
      />
    );
  }
  const entryId = entry ?? (viewer ? await liveEntryFor(db, viewer.id) : null);
  const view = entryId ? await liveView(db, entryId, viewer?.id ?? null, now) : null;
  if (!view) {
    return (
      <EmptyState
        icon="live"
        title="Build a team to follow it live"
        body="Once your lineup locks, this is where you watch your players score, map by map."
        action={<ButtonLink href="/">Find a Tournament</ButtonLink>}
      />
    );
  }
  return <LiveGameDay initial={toLivePayload(view)} nowIso={now.toISOString()} />;
}
