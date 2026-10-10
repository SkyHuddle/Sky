import Link from "next/link";
import { cn } from "@/lib/cn";
import { contestCta } from "@/lib/contest";
import { ordinal, percentileLabel, pts } from "@/lib/format";
import type { ContestView } from "@/server/queries/tournament";
import { ButtonLink } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Countdown, StatePill } from "../ui/status";

/** A fantasy contest on an event: what it covers, its state, and the one thing to do. */
export function ContestCard({ c, now, nowIso, slug }: { c: ContestView; now: Date; nowIso: string; slug: string }) {
  const cta = contestCta(c, now);
  return (
    <article className="flex flex-col rounded-2xl bg-surface p-5">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-title text-ink">{c.name}</h3>
          <StatePill kind={cta.state} label={cta.stateLabel} />
        </div>
        <p className="mt-1 text-callout text-ink-2">{c.tagline}</p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-elevated p-3 text-footnote sm:grid-cols-3">
        <div>
          <dt className="text-caption text-ink-3">Scores from</dt>
          <dd className="font-medium text-ink">{c.windows[0]?.stageName} → {c.windows[c.windows.length - 1]?.stageName}</dd>
        </div>
        <div>
          <dt className="text-caption text-ink-3">Transfer windows</dt>
          <dd className="font-medium text-ink">{c.windows.length - 1}</dd>
        </div>
        <div>
          <dt className="text-caption text-ink-3">Entries</dt>
          <dd className="tabular font-medium text-ink">{c.entries.toLocaleString("en")}</dd>
        </div>
      </dl>

      <ol className="mt-4 flex flex-wrap gap-1.5" aria-label="Lineup windows">
        {c.windows.map((w) => (
          <li key={w.id} className={cn("inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-caption font-medium", w.status === "open" ? "bg-accent-soft text-accent" : w.status === "upcoming" ? "bg-elevated/60 text-ink-3" : "bg-elevated text-ink-2")}>
            {w.status === "open" ? <Icon name="check" size={12} strokeWidth={2.4} /> : w.status === "upcoming" ? null : <Icon name="lock" size={12} />}
            {w.stageName}
          </li>
        ))}
      </ol>

      {c.myEntry ? (
        <Link href={`/e/${c.myEntry.id}`} className="mt-4 flex items-center justify-between rounded-xl bg-lavender-soft px-3 py-2.5 text-callout hover:brightness-110">
          <span className="font-semibold text-lavender">Your team</span>
          <span className="tabular text-ink">
            {c.myEntry.rank ? `${ordinal(c.myEntry.rank)} · ${pts(c.myEntry.points)} pts · ${percentileLabel(c.myEntry.rank, c.myEntry.entriesCount)}` : "Entered · scoring starts at lock"}
          </span>
        </Link>
      ) : null}

      <div className="mt-auto pt-5">
        {cta.deadline ? (
          <div className="text-footnote text-ink-2">
            {cta.deadline.label} <Countdown to={cta.deadline.at} now={nowIso} className="font-semibold text-ink" />
          </div>
        ) : (
          <div className="text-footnote text-ink-2">{cta.headline}</div>
        )}
        <div className="mt-3 flex gap-2.5">
          {cta.primary.href ? (
            <ButtonLink href={cta.primary.href} className="flex-1">
              {cta.primary.label}
            </ButtonLink>
          ) : null}
          <ButtonLink href={`/c/${c.id}/leaderboard`} variant="secondary" className={cta.primary.href ? "" : "flex-1"}>
            Standings
          </ButtonLink>
        </div>
      </div>
      <span className="sr-only">{slug}</span>
    </article>
  );
}
