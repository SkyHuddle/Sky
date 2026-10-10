"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { percentileLabel, pts } from "@/lib/format";
import type { Board, BoardRow } from "@/server/services/leaderboards";
import { Button } from "../ui/Button";
import { PlayerAvatar } from "../ui/identity";
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

  return (
    <div>
      {scopes.length > 1 ? (
        <div role="tablist" aria-label="Leaderboard" className="scrollbar-none -mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4">
          {scopes.map((s) => (
            <button
              key={s.key}
              role="tab"
              aria-selected={scope === s.key}
              onClick={() => {
                setScope(s.key);
                void load(s.key, 1);
              }}
              className={cn("inline-flex h-9 shrink-0 items-center rounded-full px-3.5 text-footnote font-semibold transition-colors", scope === s.key ? "bg-ink text-bg" : "bg-surface text-ink-2 ring-1 ring-border hover:text-ink")}
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
          <ol className={cn("divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface transition-opacity", loading && "opacity-60")} aria-busy={loading}>
            {rows.map((r) => (
              <Row key={r.entryId} r={r} me={r.userId === viewerId} total={board.total} />
            ))}
            {loading && rows.length === 0
              ? Array.from({ length: 6 }, (_, i) => (
                  <li key={i} className="flex h-14 items-center gap-3 px-4">
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
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-lavender/40 bg-[#1a1830] shadow-[0_12px_40px_rgb(0_0_0/0.5)]">
            <ol>
              <Row r={board.me} me total={board.total} />
            </ol>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Row({ r, me, total }: { r: BoardRow; me: boolean; total: number }) {
  return (
    <li id={me ? `row-${r.entryId}` : undefined}>
      <Link href={`/e/${r.entryId}`} className={cn("flex h-14 items-center gap-3 px-4 transition-colors", me ? "bg-lavender-soft" : "hover:bg-[#131b28]")}>
        <span className={cn("tabular w-10 text-right text-callout", r.rank <= 3 ? "font-bold text-ink" : "text-ink-2")}>{r.rank}</span>
        <span className="w-8">
          <Movement value={r.movement} />
        </span>
        <PlayerAvatar nickname={r.username} team={{ id: "u", name: "", acronym: "", color: `hsl(${r.avatarHue} 70% 62%)`, country: "" }} size={32} />
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-callout", me ? "font-semibold text-ink" : "text-ink")}>
            {r.username}
            {me ? <span className="text-lavender"> · you</span> : null}
          </span>
          {me ? <span className="block text-caption text-lavender">{percentileLabel(r.rank, total)}</span> : null}
        </span>
        <span className="tabular text-[0.9375rem] font-semibold text-ink">{pts(r.points)}</span>
      </Link>
    </li>
  );
}
