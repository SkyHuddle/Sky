"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { percentileLabel, pts } from "@/lib/format";
import type { Board, BoardRow } from "@/server/services/leaderboards";
import { Button } from "../ui/Button";
import { UserAvatar } from "../ui/identity";
import { EmptyState, Movement, Notice, Skeleton } from "../ui/primitives";

type Scope = { key: string; label: string; query: string };

/**
 * Standings with scopes (global / friends / each league). The same entry appears on every board.
 * The viewer's row is highlighted and pinned at the bottom when scrolled out of view.
 */
export function Leaderboard({ contestId, initial, scopes, viewerId }: { contestId: string; initial: Board; scopes: Scope[]; viewerId: string | null }) {
  const [scope, setScope] = useState(scopes[0]!.key);
  const [board, setBoard] = useState<Board>(initial);
  const [rows, setRows] = useState<BoardRow[]>(initial.rows);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meVisible, setMeVisible] = useState(true);

  async function load(nextScope: string, page: number) {
    setLoading(true);
    setError(null);
    const s = scopes.find((x) => x.key === nextScope)!;
    try {
      const res = await fetch(`/api/contests/${encodeURIComponent(contestId)}/leaderboard?${s.query}&page=${page}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Couldn't load standings");
      setBoard(body);
      setRows((prev) => (page === 1 ? body.rows : [...prev, ...body.rows]));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load standings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!board.me) return;
    const el = document.getElementById(`row-${board.me.entryId}`);
    if (!el) {
      setMeVisible(false);
      return;
    }
    const io = new IntersectionObserver(([e]) => setMeVisible(!!e?.isIntersecting), { rootMargin: "-56px 0px -72px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [board.me, rows]);

  // The top three get a podium when the board is big enough for the rest to read as a list.
  const podium = board.total >= 10 && rows.length > 3 && rows[0]?.rank === 1 && rows[2]?.rank === 3;

  return (
    <div>
      {scopes.length > 1 ? (
        <div role="tablist" aria-label="Leaderboard" className="scrollbar-none mb-4 flex gap-1 overflow-x-auto rounded-xl bg-surface p-1">
          {scopes.map((s) => (
            <button
              key={s.key}
              role="tab"
              aria-selected={scope === s.key}
              onClick={(e) => {
                e.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
                setScope(s.key);
                void load(s.key, 1);
              }}
              className={cn(
                "inline-flex h-10 min-w-[88px] flex-auto shrink-0 items-center justify-center rounded-md px-3 text-footnote font-semibold whitespace-nowrap transition-colors",
                scope === s.key ? "bg-raised text-ink" : "text-ink-2 hover:text-ink",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      ) : null}

      {error ? <Notice tone="danger" className="mb-3">{error}</Notice> : null}

      {board.total === 0 && !loading ? (
        <EmptyState icon="list" title="No standings yet" body="Ranks appear once the first stage locks and scoring begins." />
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between px-1 text-caption text-ink-3">
            <span>{board.total.toLocaleString("en")} entries</span>
            <span>Points</span>
          </div>
          {podium ? <Podium rows={rows.slice(0, 3)} viewerId={viewerId} /> : null}
          <ol className={cn("divide-y divide-border overflow-hidden rounded-2xl bg-surface transition-opacity", loading && "opacity-60")} aria-busy={loading}>
            {(podium ? rows.slice(3) : rows).map((r) => (
              <Row key={r.entryId} r={r} me={r.userId === viewerId} total={board.total} />
            ))}
            {loading && rows.length === 0
              ? Array.from({ length: 6 }, (_, i) => (
                  <li key={i} className="flex h-[62px] items-center gap-3 px-4">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="size-8 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                  </li>
                ))
              : null}
          </ol>
          {rows.length < board.total ? (
            <div className="mt-4 text-center">
              <Button variant="secondary" loading={loading} onClick={() => load(scope, board.page + 1)}>
                Show more
              </Button>
            </div>
          ) : null}
        </>
      )}

      {board.me && !meVisible ? (
        <div className="fixed inset-x-0 bottom-[calc(56px+env(safe-area-inset-bottom))] z-30 px-4 pb-2 lg:bottom-4 lg:left-[248px]">
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl bg-surface shadow-[0_12px_32px_rgb(0_0_0/0.45)]">
            <ol>
              <Row r={board.me} me total={board.total} />
            </ol>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const PLACE = ["1st", "2nd", "3rd"];

/** First, second and third as three cards, winner in the middle on wider screens. */
function Podium({ rows, viewerId }: { rows: BoardRow[]; viewerId: string | null }) {
  return (
    <ol className="mb-3 grid grid-cols-3 items-end gap-2" aria-label="Top three">
      {rows.map((r, i) => {
        const me = r.userId === viewerId;
        return (
          <li
            key={r.entryId}
            id={me ? `row-${r.entryId}` : undefined}
            className={cn("motion-safe:animate-rise", i === 0 ? "order-2" : i === 1 ? "order-1" : "order-3")}
            style={{ animationDelay: `${[120, 40, 200][i]}ms` }}
          >
            <Link
              href={`/e/${r.entryId}`}
              className={cn(
                "flex flex-col items-center rounded-2xl bg-surface px-2 text-center transition-colors hover:bg-elevated",
                i === 0 ? "pt-5 pb-4" : "pt-4 pb-3",
                me && "bg-accent-soft shadow-[inset_0_0_0_1px_var(--color-accent)]",
              )}
            >
              <span className={cn("font-display font-bold leading-none", i === 0 ? "text-[1.75rem] text-ink" : "text-[1.375rem] text-ink-2")}>{PLACE[i]}</span>
              <UserAvatar username={r.username} hue={r.avatarHue} size={i === 0 ? 52 : 44} className="mt-2.5" />
              <span className="mt-2 block w-full truncate text-footnote font-medium text-ink">
                {r.username}
                {me ? <span className="text-accent"> · you</span> : null}
              </span>
              <span className="num mt-0.5 block text-callout text-ink">{pts(r.points)}</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

function Row({ r, me, total }: { r: BoardRow; me: boolean; total: number }) {
  return (
    <li id={me ? `row-${r.entryId}` : undefined}>
      <Link href={`/e/${r.entryId}`} className={cn("flex min-h-[62px] items-center gap-3 px-4 py-2 transition-colors", me ? "bg-accent-soft shadow-[inset_3px_0_0_var(--color-accent)]" : "hover:bg-elevated/60")}>
        <span className={cn("font-display w-9 shrink-0 text-center text-[1.25rem] font-bold tabular-nums", r.rank <= 3 ? "text-ink" : "text-ink-2")}>{r.rank.toLocaleString("en")}</span>
        {r.movement !== null && r.movement !== undefined ? <span className="w-7 shrink-0"><Movement value={r.movement} /></span> : null}
        <UserAvatar username={r.username} hue={r.avatarHue} size={32} />
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-callout", me ? "font-semibold text-ink" : "text-ink")}>
            {r.username}
            {me ? <span className="text-accent"> · you</span> : null}
          </span>
          {me ? <span className="block text-caption text-lavender">{percentileLabel(r.rank, total)}</span> : null}
        </span>
        <span className="num text-callout text-ink">{pts(r.points)}</span>
      </Link>
    </li>
  );
}
