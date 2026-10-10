import Link from "next/link";
import { notFound } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Icon } from "@/components/ui/Icon";
import { UserAvatar } from "@/components/ui/identity";
import { EmptyState, SectionHeader } from "@/components/ui/primitives";
import { LocalTime, StatePill } from "@/components/ui/status";
import { cn } from "@/lib/cn";
import { ordinal, percentileLabel, pts } from "@/lib/format";
import { pageContext } from "@/server/page";
import { profileByUsername, type ProfileEntry } from "@/server/queries/people";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  return { title: decodeURIComponent((await params).username) };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const username = decodeURIComponent((await params).username);
  const { db, viewer } = await pageContext();
  const p = await profileByUsername(db, username);
  if (!p) notFound();
  const own = viewer?.id === p.user.id;
  const st = p.stats;
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section className="relative overflow-hidden rounded-2xl bg-surface p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: `radial-gradient(90% 120% at 0% 0%, hsl(${p.user.avatarHue} 70% 50% / 0.18), transparent 60%)` }} aria-hidden />
        <div className="relative flex items-center gap-4">
          <UserAvatar username={p.user.username} hue={p.user.avatarHue} size={76} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[1.75rem] leading-8 font-bold tracking-[-0.02em] text-ink">{p.user.username}</h1>
            <p className="text-callout text-ink-2">
              Counter-Strike 2 · Member since <LocalTime iso={p.user.createdAt} format="date" />
            </p>
            {st.bestRank ? (
              <p className="mt-1 inline-flex items-center gap-1.5 text-footnote font-semibold text-lavender">
                <Icon name="crown" size={14} /> Best: {percentileLabel(st.bestRank.rank, st.bestRank.entries)} at {st.bestRank.tournamentName.replace(" (Demo)", "")}
              </p>
            ) : null}
          </div>
        </div>
        <dl className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Fact label="Events entered" value={String(st.eventsEntered)} />
          <Fact label="Best finish" value={st.bestRank ? ordinal(st.bestRank.rank) : "—"} sub={st.bestRank ? `of ${st.bestRank.entries.toLocaleString("en")}` : undefined} />
          <Fact label="Avg percentile" value={st.averagePercentile !== null ? `Top ${Math.ceil(st.averagePercentile * 100)}%` : "—"} />
          <Fact label="Titles" value={String(st.contestWins + st.leagueWins)} sub={`${st.contestWins} contest${st.contestWins === 1 ? "" : "s"} · ${st.leagueWins} league${st.leagueWins === 1 ? "" : "s"}`} />
        </dl>
      </section>

      {p.active.length ? (
        <section aria-labelledby="active-h">
          <SectionHeader id="active-h" title="Current contests" />
          <EntryList list={p.active} />
        </section>
      ) : null}

      <section aria-labelledby="history-h">
        <SectionHeader id="history-h" title="Tournament history" />
        {p.history.length ? (
          <EntryList list={p.history} />
        ) : (
          <EmptyState icon="trophy" title="No completed tournaments yet" body={own ? "Finish a tournament and your result is recorded here permanently." : "No completed tournaments yet."} />
        )}
      </section>

      <section aria-labelledby="ach-h" className="rounded-2xl bg-surface p-5">
        <h2 id="ach-h" className="text-headline text-ink">
          Fantasy career
        </h2>
        <p className="mt-1 text-callout text-ink-2">
          Season rankings and achievements are coming. For now this page shows recorded results only.
        </p>
        <p className="mt-3 text-footnote text-ink-3">Career points from settled contests: <span className="tabular font-semibold text-ink">{pts(st.careerPoints)}</span></p>
      </section>

      {own ? (
        <section aria-label="Account" className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3">
          <span className="text-callout text-ink-2">Signed in as {p.user.username}</span>
          <SignOutButton />
        </section>
      ) : null}
    </div>
  );
}

function Fact({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-elevated px-3.5 py-3">
      <dt className="text-caption text-ink-3">{label}</dt>
      <dd className="mt-1 font-display text-[1.75rem] leading-8 font-bold text-ink tabular-nums">{value}</dd>
      {sub ? <dd className="text-[0.75rem] text-ink-3">{sub}</dd> : null}
    </div>
  );
}

function EntryList({ list }: { list: ProfileEntry[] }) {
  return (
    <ul className="space-y-2">
      {list.map((e) => (
        <li key={e.entryId}>
          <Link href={`/e/${e.entryId}`} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 transition-colors hover:bg-elevated">
            <span className={cn("inline-flex size-11 shrink-0 items-center justify-center rounded-xl", e.rank === 1 ? "bg-lavender text-[#1b1035]" : "bg-elevated text-ink-2")}>
              <Icon name={e.rank === 1 ? "crown" : "trophy"} size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-callout font-semibold text-ink">{e.tournamentName}</div>
              <div className="text-caption text-ink-3">
                {e.contestName} · {e.settled ? "Final" : e.status === "open" ? "Entered" : "In progress"}
              </div>
            </div>
            <div className="text-right">
              {e.rank ? (
                <>
                  <div className="tabular text-callout font-semibold text-ink">
                    {ordinal(e.rank)} <span className="font-normal text-ink-3">/ {e.entries}</span>
                  </div>
                  <div className="tabular text-caption text-lavender">
                    {percentileLabel(e.rank, e.entries)} · {pts(e.points)} pts
                  </div>
                </>
              ) : (
                <StatePill kind="open" label="Entered" />
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
