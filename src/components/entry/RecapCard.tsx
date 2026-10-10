import Link from "next/link";
import { ordinal, pts } from "@/lib/format";
import type { TeamLite } from "@/server/queries/common";
import type { Recap } from "@/server/queries/recap";
import { Icon } from "../ui/Icon";
import { PlayerAvatar, TeamMark } from "../ui/identity";
import { StatePill } from "../ui/status";
import { ShareButton } from "./ShareButton";

/** The end-of-tournament recap: placement first, then the picks that made it. */
export function RecapCard({ r, teams, entryId, tournamentName, isOwner }: { r: Recap; teams: Record<string, TeamLite>; entryId: string; tournamentName: string; isOwner: boolean }) {
  return (
    <section aria-labelledby="recap" className="overflow-hidden rounded-[20px] border border-border bg-surface">
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <span className="text-eyebrow text-ink-2">Final result</span>
          <StatePill kind={r.settled ? "settled" : "official"} className="ml-auto" />
        </div>
        <h2 id="recap" className="mt-2 text-title text-ink">
          {ordinal(r.rank)} of {r.entriesCount.toLocaleString("en")}
        </h2>
        <p className="text-callout text-ink-2">
          {pts(r.points)} fantasy points · <span className="text-lavender">{r.percentile}</span> · {tournamentName}
        </p>
        {r.awards.length ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {r.awards.map((a) => (
              <li key={a.id} className="inline-flex h-9 items-center gap-2 rounded-full bg-lavender-soft px-3 text-footnote">
                <Icon name="crown" size={14} className="text-lavender" />
                <span className="font-semibold text-ink">{a.label}</span>
                <span className="text-ink-2">{a.detail}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <dl className="grid grid-cols-1 divide-y divide-border border-t border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {r.mvp ? (
          <Fact label="Fantasy MVP" name={r.mvp.nickname} team={teams[r.mvp.teamId]} value={`${pts(r.mvp.points)} pts`} />
        ) : null}
        {r.captain ? (
          <div className="px-5 py-4">
            <dt className="text-caption text-ink-3">Captain bonus</dt>
            <dd className="num mt-1 text-headline text-ink">+{pts(r.captain.bonus)}</dd>
            {r.captain.best ? (
              <dd className="text-footnote text-ink-2">
                Best: {r.captain.best.nickname} in {r.captain.best.stageName} ({pts(r.captain.best.points)})
              </dd>
            ) : null}
          </div>
        ) : null}
        {r.bestValue ? (
          <Fact label="Best value pick" name={r.bestValue.nickname} team={teams[r.bestValue.teamId]} value={`${pts(r.bestValue.per100k)} pts per $100K`} />
        ) : null}
      </dl>

      {r.leagues.length ? (
        <ul className="divide-y divide-border border-t border-border">
          {r.leagues.map((l) => (
            <li key={l.id}>
              <Link href={`/leagues/${l.id}`} className="flex min-h-[56px] items-center gap-3 px-5 py-3 hover:bg-elevated/60">
                <Icon name="trophy" size={18} className="text-lavender" />
                <span className="min-w-0 flex-1 truncate text-callout text-ink">{l.name}</span>
                <span className="num text-callout text-ink">{l.rank ? `${ordinal(l.rank)} of ${l.size}` : "—"}</span>
                <Icon name="chevronRight" size={16} className="text-ink-3" />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-4">
        {isOwner ? <ShareButton entryId={entryId} text={`I finished ${ordinal(r.rank)} of ${r.entriesCount} at ${tournamentName}.`} /> : null}
        <Link href="/" className="inline-flex h-11 items-center gap-1 text-callout font-medium text-accent">
          Next tournament <Icon name="chevronRight" size={16} />
        </Link>
      </div>
    </section>
  );
}

function Fact({ label, name, team, value }: { label: string; name: string; team: TeamLite | undefined; value: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <PlayerAvatar nickname={name} team={team} size={44} shape="tile" />
      <div className="min-w-0">
        <dt className="text-caption text-ink-3">{label}</dt>
        <dd className="flex items-center gap-1.5 truncate text-callout font-semibold text-ink">
          {name} <TeamMark team={team} size={14} />
        </dd>
        <dd className="num text-footnote text-ink-2">{value}</dd>
      </div>
    </div>
  );
}
