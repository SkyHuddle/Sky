import { redirect } from "next/navigation";
import { JoinButton } from "@/components/league/LeagueClient";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/primitives";
import { isAppError } from "@/server/errors";
import { pageContext } from "@/server/page";
import { isMember } from "@/server/services/leagues";
import { getInvite } from "@/server/services/leagues";

export const dynamic = "force-dynamic";
export const metadata = { title: "League invite" };

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const code = decodeURIComponent((await params).code);
  const { db, viewer, now } = await pageContext();
  let invite: Awaited<ReturnType<typeof getInvite>>;
  try {
    invite = await getInvite(db, code, now);
  } catch (e) {
    return <EmptyState icon="link" title="Invite not found" body={isAppError(e) ? e.message : "This link isn't valid."} />;
  }
  if (viewer && (await isMember(db, invite.league.id, viewer.id))) redirect(`/leagues/${invite.league.id}`);
  return (
    <div className="mx-auto max-w-md pt-4">
      <div className="rounded-2xl bg-surface p-6 text-center">
        <span className="mx-auto inline-flex size-16 items-center justify-center rounded-2xl bg-lavender-soft text-lavender">
          <Icon name="trophy" size={30} />
        </span>
        <p className="mt-4 text-callout text-ink-2">{invite.owner.username} invited you to</p>
        <h1 className="mt-1 text-display text-ink">{invite.league.name}</h1>
        <p className="mt-2 text-callout text-ink-2">
          {invite.tournament.name} · {invite.contest.name}
        </p>
        <p className="tabular mt-1 text-footnote text-ink-3">{invite.league.members} members</p>
        {invite.league.description ? <p className="mt-4 rounded-xl bg-elevated px-4 py-3 text-callout text-ink-2">{invite.league.description}</p> : null}
        <ul className="mt-5 space-y-1.5 text-left text-footnote text-ink-2">
          <li className="flex gap-2"><Icon name="check" size={16} className="text-accent" /> Five players, $1M cap, captain scores 1.5×</li>
          <li className="flex gap-2"><Icon name="check" size={16} className="text-accent" /> Your team counts here and on the global board</li>
          <li className="flex gap-2"><Icon name="check" size={16} className="text-accent" /> Free to play</li>
        </ul>
        <div className="mt-6">
          {invite.expired ? (
            <p className="rounded-xl bg-warning-soft px-4 py-3 text-callout text-warning">This invite has expired. Ask {invite.owner.username} for a new link.</p>
          ) : invite.contest.status === "completed" ? (
            <p className="rounded-xl bg-elevated px-4 py-3 text-callout text-ink-2">This contest has finished.</p>
          ) : (
            <JoinButton code={code} signedIn={!!viewer} next={`/join/${encodeURIComponent(code)}`} />
          )}
        </div>
      </div>
    </div>
  );
}
