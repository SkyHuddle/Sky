import Link from "next/link";
import { notFound } from "next/navigation";
import { Leaderboard } from "@/components/board/Leaderboard";
import { InviteLink, JoinButton, LeaveLeague, RemoveMember } from "@/components/league/LeagueClient";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PlayerAvatar } from "@/components/ui/identity";
import { Notice, SectionHeader } from "@/components/ui/primitives";
import { pageContext } from "@/server/page";
import { leagueDetail } from "@/server/queries/people";

export const dynamic = "force-dynamic";
export const metadata = { title: "League" };

export default async function LeaguePage({ params, searchParams }: { params: Promise<{ leagueId: string }>; searchParams: Promise<{ created?: string; joined?: string }> }) {
  const leagueId = decodeURIComponent((await params).leagueId);
  const flags = await searchParams;
  const { db, viewer } = await pageContext();
  const d = await leagueDetail(db, leagueId, viewer?.id ?? null);
  if (!d) notFound();
  const myEntry = d.members.find((m) => m.userId === viewer?.id)?.hasEntry;
  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <Link href="/leagues" className="mb-3 inline-flex items-center gap-1 text-callout text-ink-2 hover:text-ink">
          <Icon name="chevronLeft" size={16} /> Leagues
        </Link>
        <div className="flex items-start gap-4">
          <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-lavender-soft text-lavender">
            <Icon name="trophy" size={26} />
          </span>
          <div className="min-w-0">
            <h1 className="text-display text-ink">{d.league.name}</h1>
            <p className="mt-0.5 text-callout text-ink-2">
              <Link href={`/t/${d.tournament.slug}`} className="hover:text-ink">
                {d.tournament.name}
              </Link>{" "}
              · {d.contest.name} · {d.league.members} members · {d.league.privacy === "public" ? "Public" : "Invite only"}
            </p>
            {d.league.description ? <p className="mt-2 text-callout text-ink-2">{d.league.description}</p> : null}
          </div>
        </div>
      </div>

      {flags.created ? <Notice tone="success">League created. Share the invite link below; anyone who joins brings their existing team.</Notice> : null}
      {flags.joined ? <Notice tone="success">You&apos;re in. {myEntry ? "Your team is on this league's board." : "Build your team to appear on the board."}</Notice> : null}

      {d.isMember ? (
        <section aria-labelledby="invite-h" className="rounded-2xl border border-border bg-surface p-4">
          <h2 id="invite-h" className="mb-2 text-headline text-ink">
            Invite friends
          </h2>
          <InviteLink code={d.league.inviteCode} />
          {!myEntry && d.contest.status !== "completed" ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-accent-soft px-3.5 py-3">
              <span className="text-callout text-ink">You don&apos;t have a team in {d.contest.name} yet.</span>
              <ButtonLink href={`/c/${d.contest.id}/build`} size="sm">
                Build team
              </ButtonLink>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="rounded-2xl border border-border bg-surface p-4">
          <p className="mb-3 text-callout text-ink-2">This is a public league. Join to put your {d.contest.name} team on its board.</p>
          <JoinButton leagueId={d.league.id} signedIn={!!viewer} next={`/leagues/${d.league.id}`} />
        </section>
      )}

      <section aria-labelledby="standings-h">
        <SectionHeader id="standings-h" title="Standings" />
        <Leaderboard
          contestId={d.contest.id}
          initial={d.board}
          scopes={[{ key: "league", label: d.league.name, query: `scope=league&league=${encodeURIComponent(d.league.id)}` }]}
          viewerId={viewer?.id ?? null}
        />
      </section>

      <section aria-labelledby="members-h">
        <SectionHeader id="members-h" title={`Members (${d.members.length})`} />
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {d.members.slice(0, 60).map((m) => (
            <li key={m.userId} className="flex items-center gap-3 px-4 py-2.5">
              <PlayerAvatar nickname={m.username} team={{ id: "u", name: "", acronym: "", color: `hsl(${m.avatarHue} 70% 62%)`, country: "" }} size={30} />
              <Link href={`/u/${m.username}`} className="min-w-0 flex-1 truncate text-callout text-ink hover:underline">
                {m.username}
              </Link>
              {m.role === "owner" ? <span className="text-caption text-lavender">Owner</span> : null}
              {!m.hasEntry ? <span className="text-caption text-ink-3">No team yet</span> : null}
              {d.isOwner && m.role !== "owner" ? <RemoveMember leagueId={d.league.id} userId={m.userId} username={m.username} /> : null}
            </li>
          ))}
        </ul>
        {d.members.length > 60 ? <p className="mt-2 text-caption text-ink-3">and {d.members.length - 60} more</p> : null}
      </section>

      {d.isMember && !d.isOwner ? (
        <div className="text-center">
          <LeaveLeague leagueId={d.league.id} />
        </div>
      ) : null}
    </div>
  );
}
