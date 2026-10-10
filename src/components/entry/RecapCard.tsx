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
    <section aria-labelledby="recap" className="overflow-hidden rounded-2xl bg-surface">
      <div className="relative p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_90%_at_100%_0%,rgb(79_224_196/0.10),transparent_70%)]" aria-hidden />
        <div className="relative flex items-center gap-2">
          <span className="text-eyebrow text-ink-2">Final result</span>
          <span className="text-caption text-ink-3">· {tournamentName}</span>
          <StatePill kind={r.settled ? "settled" : "official"} className="ml-auto" />
        </div>
        {/* The placement is the moment: one big number in the display face. */}
        <h2 id="recap" className="relative mt-3">
          <span className="sr-only">
            {ordinal(r.rank)} of {r.entriesCount.toLocaleString("en")}
          </span>
          <span className="flex items-baseline" aria-hidden>
            <span className="font-display text-[4.5rem] leading-[0.9] font-bold tracking-[-0.01em] text-ink tabular-nums sm:text-[5.5rem]">{r.rank.toLocaleString("en")}</span>
            <span className="font-display text-[1.75rem] leading-none font-bold text-ink sm:text-[2rem]">{ordinal(r.rank).replace(/^[\d,]+/, "")}</span>
            <span className="ml-2 text-headline font-medium text-ink-2"> of {r.entriesCount.toLocaleString("en")}</span>
          </span>
        </h2>
        <FieldPosition rank={r.rank} total={r.entriesCount} />
        <dl className="relative mt-5 grid grid-cols-2 gap-4">
          <div>
            <dt className="text-caption text-ink-3">Fantasy points</dt>
            <dd className="font-display text-[1.75rem] leading-8 font-bold text-ink tabular-nums">{pts(r.points)}</dd>
          </div>
          {r.captain ? (
            <div>
              <dt className="text-caption text-ink-3">Captain bonus</dt>
              <dd className="font-display text-[1.75rem] leading-8 font-bold text-ink tabular-nums">+{pts(r.captain.bonus)}</dd>
              {r.captain.best ? (
                <dd className="truncate text-caption text-ink-3">
                  Best: {r.captain.best.nickname}, {r.captain.best.stageName} ({pts(r.captain.best.points)})
                </dd>
              ) : null}
            </div>
          ) : null}
        </dl>
        {r.awards.length ? (
          <ul className="relative mt-5 flex flex-wrap gap-2">
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

      {r.mvp || r.bestValue ? (
        <dl className="grid grid-cols-2 gap-px border-t border-border bg-border">
          {r.mvp ? <Pick label="Fantasy MVP" name={r.mvp.nickname} team={teams[r.mvp.teamId]} value={pts(r.mvp.points)} unit="pts" /> : null}
          {r.bestValue ? <Pick label="Best value" name={r.bestValue.nickname} team={teams[r.bestValue.teamId]} value={pts(r.bestValue.per100k)} unit="pts per $100K" /> : null}
        </dl>
      ) : null}

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

/** Where the entry finished in the field: a track from last to first with the entry marked. */
function FieldPosition({ rank, total }: { rank: number; total: number }) {
  const at = total > 1 ? 1 - (rank - 1) / (total - 1) : 1;
  return (
    <div className="relative mt-4" aria-hidden>
      <div className="relative h-1.5 rounded-full bg-raised">
        <div className="absolute inset-y-0 left-0 rounded-full bg-accent/40" style={{ width: `${at * 100}%` }} />
        <span className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-accent" style={{ left: `${at * 100}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-caption text-ink-3">
        <span>Last</span>
        <span>1st</span>
      </div>
    </div>
  );
}

function Pick({ label, name, team, value, unit }: { label: string; name: string; team: TeamLite | undefined; value: string; unit: string }) {
  return (
    <div className="min-w-0 bg-surface p-4 sm:p-5">
      <dt className="text-caption text-ink-3">{label}</dt>
      <dd className="mt-2 flex items-center gap-3">
        <PlayerAvatar nickname={name} team={team} size={52} shape="tile" />
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 truncate text-callout font-semibold text-ink">
            {name} <TeamMark team={team} size={14} />
          </span>
          <span className="block font-display text-[1.375rem] leading-6 font-bold text-ink tabular-nums">{value}</span>
          <span className="block truncate text-caption text-ink-3">{unit}</span>
        </span>
      </dd>
    </div>
  );
}
