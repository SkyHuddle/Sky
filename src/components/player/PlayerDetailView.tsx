"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { moneyFull, pts } from "@/lib/format";
import type { PlayerDetail } from "@/server/queries/contest";
import { PortraitSvg } from "../ui/art";
import { Icon } from "../ui/Icon";
import { Flag, TeamMark, rgba } from "../ui/identity";
import { LocalTime } from "../ui/status";

type Tab = "overview" | "stats" | "matches";

/**
 * Player research (DESIGN.md §5.4): who the player is and whether they're worth the salary.
 * Editorial hero, the two numbers that decide a pick, then Overview · Stats · Matches.
 * Everything is derived from completed maps; nothing is projected.
 */
export function PlayerDetailView({ d, compact }: { d: PlayerDetail; compact?: boolean }) {
  const [tab, setTab] = useState<Tab>("overview");
  return (
    <div className={cn(!compact && "lg:grid lg:grid-cols-[400px_minmax(0,1fr)] lg:items-start lg:gap-10")}>
      <div className={cn(!compact && "lg:sticky lg:top-8")}>
        <Hero d={d} compact={compact} />
        <KeyNumbers d={d} />
      </div>
      <div className={cn(!compact && "lg:pt-0")}>
        <div role="tablist" aria-label="Player research" className="mt-5 flex border-b border-border lg:mt-0">
          {(
            [
              ["overview", "Overview"],
              ["stats", "Stats"],
              ["matches", "Matches"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={cn(
                "relative h-11 flex-1 text-callout font-semibold transition-colors sm:flex-none sm:px-5",
                tab === k ? "text-ink after:absolute after:inset-x-4 after:-bottom-px after:h-0.5 after:rounded-full after:bg-ink" : "text-ink-3 hover:text-ink-2",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="pt-5" role="tabpanel">
          {tab === "overview" ? <Overview d={d} /> : null}
          {tab === "stats" ? <Stats d={d} /> : null}
          {tab === "matches" ? <Matches d={d} /> : null}
        </div>
        <p className="mt-6 flex items-start gap-2 text-caption text-ink-3">
          <Icon name="info" size={14} className="mt-px shrink-0" />
          From completed maps, scored with this contest&apos;s rules. No projections are shown until a model has been validated.
        </p>
      </div>
    </div>
  );
}

function Hero({ d, compact }: { d: PlayerDetail; compact?: boolean }) {
  const color = d.team?.color ?? "#788ba0";
  const next = d.upcoming[0];
  return (
    <div className={cn("relative overflow-hidden rounded-[20px] border border-border bg-elevated", compact ? "h-[248px]" : "h-[280px] lg:h-[400px]")}>
      {/* the one spotlight: a team-tinted halo behind the portrait only */}
      <div className="absolute inset-0" style={{ background: `radial-gradient(48% 62% at 72% 46%, ${rgba(color, 0.28)} 0%, transparent 70%)` }} aria-hidden />
      <PortraitSvg seed={d.player.nickname} color={color} team={d.team ?? undefined} className="pointer-events-none absolute right-[-4%] bottom-0 h-[92%] w-auto" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-[linear-gradient(0deg,var(--color-elevated)_8%,transparent)]" aria-hidden />
      <div className="absolute inset-x-5 bottom-5">
        <div className="flex items-center gap-2">
          <h2 className="truncate text-display text-ink">{d.player.nickname}</h2>
          <Flag code={d.player.nationality} className="text-[1.125rem]" />
        </div>
        <p className="truncate text-footnote text-ink-2">
          {d.player.firstName} {d.player.lastName}
          {d.player.isStandIn ? <span className="text-warning"> · Stand-in</span> : null}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-callout">
          <span className="inline-flex items-center gap-1.5 font-medium text-ink">
            <TeamMark team={d.team} size={20} />
            {d.team?.name}
          </span>
          <span className="text-ink-3">{d.player.role}</span>
        </div>
        <p className="mt-2 text-footnote text-ink-2">
          {next ? (
            <>
              Next: vs {d.teams[next.opponentId]?.name ?? "TBD"} · <LocalTime iso={next.at} />
            </>
          ) : (
            "No match scheduled"
          )}
        </p>
      </div>
    </div>
  );
}

/** The two numbers that decide a pick: full salary and fantasy average. */
function KeyNumbers({ d }: { d: PlayerDetail }) {
  return (
    <dl className="mt-3 grid grid-cols-2 divide-x divide-border rounded-2xl border border-border bg-surface">
      <div className="px-4 py-3">
        <dt className="text-caption text-ink-3">Salary</dt>
        <dd className="num text-[1.375rem] leading-7 text-ink">{d.price !== null ? moneyFull(d.price) : "—"}</dd>
      </div>
      <div className="px-4 py-3">
        <dt className="text-caption text-ink-3">Fantasy avg</dt>
        <dd className="num text-[1.375rem] leading-7 text-ink">
          {d.recent.length ? pts(d.avgPoints) : "—"}
          <span className="ml-1 text-footnote font-normal text-ink-3">per map</span>
        </dd>
      </div>
    </dl>
  );
}

function Overview({ d }: { d: PlayerDetail }) {
  const n = d.recent.length;
  const kd = n ? d.recent.reduce((a, m) => a + m.kills, 0) / Math.max(1, d.recent.reduce((a, m) => a + m.deaths, 0)) : null;
  const best = n ? Math.max(...d.recent.map((m) => m.mapScore)) : null;
  const tiles: Array<[string, string, string]> = [
    ["25+ point maps", d.consistency !== null ? `${Math.round(d.consistency * 100)}%` : "—", `last ${n} maps`],
    ["Kill–death ratio", kd !== null ? kd.toFixed(2) : "—", `last ${n} maps`],
    ["Best map", best !== null ? pts(best) : "—", "fantasy points"],
    ["This contest", d.contestPoints !== null ? pts(d.contestPoints) : "—", d.contestPoints !== null ? "points so far" : "scoring not started"],
  ];
  return (
    <div className="space-y-6">
      <FormChart d={d} />
      <dl className="grid grid-cols-2 gap-2">
        {tiles.map(([label, value, hint]) => (
          <div key={label} className="rounded-2xl bg-surface px-4 py-3">
            <dt className="text-footnote text-ink-2">{label}</dt>
            <dd className="num mt-0.5 text-[1.25rem] leading-7 text-ink">{value}</dd>
            <dd className="text-caption text-ink-3">{hint}</dd>
          </div>
        ))}
      </dl>
      <Upcoming d={d} title="Next opponents" />
    </div>
  );
}

/** Last five maps: fantasy points per map with the opponent below. Honest about the sample. */
function FormChart({ d }: { d: PlayerDetail }) {
  const maps = d.recent.slice(0, 5).reverse();
  if (maps.length === 0) return <p className="rounded-2xl bg-surface px-4 py-6 text-center text-callout text-ink-2">No completed maps yet.</p>;
  const max = Math.max(40, ...maps.map((m) => m.mapScore));
  const H = 112;
  const avg = maps.reduce((a, m) => a + m.mapScore, 0) / maps.length;
  return (
    <figure className="rounded-2xl bg-surface p-4">
      <figcaption className="flex items-baseline justify-between">
        <span className="text-headline text-ink">Recent form</span>
        <span className="text-footnote text-ink-3">
          Last {maps.length} map{maps.length > 1 ? "s" : ""} · avg <span className="num text-ink-2">{pts(avg)}</span>
        </span>
      </figcaption>
      <div className="mt-4 flex items-end gap-3" style={{ height: H + 22 }} role="img" aria-label={`Fantasy points per map, oldest to newest: ${maps.map((m) => pts(m.mapScore)).join(", ")}`}>
        {maps.map((m) => {
          const h = Math.max(4, (Math.max(0, m.mapScore) / max) * H);
          return (
            <div key={m.mapId} className="flex flex-1 flex-col items-center justify-end gap-1.5">
              <span className="num text-footnote text-ink">{pts(m.mapScore, 0)}</span>
              <span className={cn("w-full max-w-[44px] rounded-[8px]", m.mapScore >= 25 ? "bg-accent" : "bg-border-strong")} style={{ height: h }} title={`${m.mapName} vs ${d.teams[m.opponentId]?.name ?? ""}`} />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-3">
        {maps.map((m) => (
          <span key={m.mapId} className="flex flex-1 flex-col items-center gap-1" title={d.teams[m.opponentId]?.name}>
            <TeamMark team={d.teams[m.opponentId]} size={20} />
            <span className="max-w-full truncate text-caption text-ink-3">{m.mapName}</span>
          </span>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-caption text-ink-3">
        <span className="inline-block size-2 rounded-sm bg-accent" aria-hidden /> 25+ points
      </p>
    </figure>
  );
}

function Stats({ d }: { d: PlayerDetail }) {
  if (d.recent.length === 0) return <p className="text-callout text-ink-2">No completed maps yet.</p>;
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-[320px] text-footnote">
        <caption className="sr-only">Recent maps</caption>
        <thead className="bg-surface text-left text-caption text-ink-3">
          <tr>
            <th className="px-4 py-2.5 font-medium">Map</th>
            <th className="px-2 py-2.5 font-medium">Result</th>
            <th className="px-2 py-2.5 text-right font-medium">K–D–A</th>
            <th className="px-4 py-2.5 text-right font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {d.recent.map((m) => (
            <tr key={m.mapId} className="border-t border-border">
              <td className="px-4 py-2.5">
                <div className="font-medium text-ink">{m.mapName}</div>
                <div className="text-caption text-ink-3">vs {d.teams[m.opponentId]?.acronym}</div>
              </td>
              <td className="tabular px-2 py-2.5">
                <span className={m.won ? "text-positive" : "text-negative"}>{m.won ? "W" : "L"}</span>{" "}
                <span className="text-ink-2">
                  {m.roundsFor}–{m.roundsAgainst}
                </span>
              </td>
              <td className="tabular px-2 py-2.5 text-right text-ink-2">
                {m.kills}–{m.deaths}–{m.assists}
              </td>
              <td className="num px-4 py-2.5 text-right text-ink">{pts(m.mapScore)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Matches({ d }: { d: PlayerDetail }) {
  const results = new Map<string, { opp: string; won: number; lost: number; event: string }>();
  for (const m of d.recent) {
    const r = results.get(m.matchId) ?? { opp: m.opponentId, won: 0, lost: 0, event: m.tournamentName };
    if (m.won) r.won += 1;
    else r.lost += 1;
    results.set(m.matchId, r);
  }
  return (
    <div className="space-y-6">
      <Upcoming d={d} title="Upcoming" />
      <section>
        <h3 className="mb-2 text-headline text-ink">Recent results</h3>
        {results.size === 0 ? (
          <p className="text-callout text-ink-2">No completed series yet.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-surface">
            {[...results.entries()].map(([id, r]) => (
              <li key={id} className="flex min-h-[56px] items-center gap-3 px-4 py-2.5">
                <TeamMark team={d.teams[r.opp]} size={24} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-callout text-ink">vs {d.teams[r.opp]?.name}</span>
                  <span className="block truncate text-caption text-ink-3">{r.event.replace(" (Demo)", "")}</span>
                </span>
                <span className={cn("num text-callout", r.won > r.lost ? "text-positive" : "text-negative")}>
                  {r.won > r.lost ? "W" : "L"} {r.won}–{r.lost}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Upcoming({ d, title }: { d: PlayerDetail; title: string }) {
  return (
    <section>
      <h3 className="mb-2 text-headline text-ink">{title}</h3>
      {d.upcoming.length === 0 ? (
        <p className="text-callout text-ink-2">No scheduled matches yet. Fixtures appear once pairings are set.</p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-surface">
          {d.upcoming.map((u) => (
            <li key={u.matchId} className="flex min-h-[56px] items-center gap-3 px-4 py-2.5">
              <TeamMark team={d.teams[u.opponentId]} size={24} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-callout text-ink">vs {d.teams[u.opponentId]?.name}</span>
                <span className="block text-caption text-ink-3">
                  {u.stageName} · BO{u.format}
                </span>
              </span>
              <LocalTime iso={u.at} className="text-footnote text-ink-2" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
