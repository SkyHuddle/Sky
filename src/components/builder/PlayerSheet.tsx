"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RosterError } from "@/domain/rules";
import type { PlayerDetail } from "@/server/queries/contest";
import { PlayerDetailView } from "../player/PlayerDetailView";
import { Button } from "../ui/Button";
import { Notice, Skeleton } from "../ui/primitives";
import { Sheet } from "../ui/Sheet";

const cache = new Map<string, PlayerDetail>();

/** Player details over the builder: the roster and scroll position stay exactly where they were. */
export function PlayerSheet({
  playerId,
  contestId,
  onClose,
  selected,
  captain,
  block,
  canEdit,
  onToggle,
  onCaptain,
}: {
  playerId: string | null;
  contestId: string;
  onClose: () => void;
  selected: boolean;
  captain: boolean;
  block: RosterError | null;
  canEdit: boolean;
  onToggle: (id: string) => void;
  onCaptain: (id: string) => void;
}) {
  const [data, setData] = useState<PlayerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId) return;
    const key = `${contestId}:${playerId}`;
    setError(null);
    if (cache.has(key)) {
      setData(cache.get(key)!);
      return;
    }
    setData(null);
    const ctrl = new AbortController();
    fetch(`/api/players/${encodeURIComponent(playerId)}?contest=${encodeURIComponent(contestId)}`, { signal: ctrl.signal })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body?.error?.message ?? "Couldn't load player");
        cache.set(key, body);
        setData(body);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(navigator.onLine ? e.message : "You're offline. Player details need a connection.");
      });
    return () => ctrl.abort();
  }, [playerId, contestId]);

  return (
    <Sheet
      open={!!playerId}
      onOpenChange={(o) => !o && onClose()}
      title={data?.player.nickname ?? "Player"}
      hideTitle
      footer={
        canEdit && playerId ? (
          <div className="flex gap-2.5">
            {selected ? (
              <Button variant={captain ? "lavender" : "secondary"} size="lg" icon="star" onClick={() => onCaptain(playerId)} className="flex-1" disabled={captain}>
                {captain ? "Captain" : "Make captain"}
              </Button>
            ) : null}
            <Button
              size="lg"
              variant={selected ? "danger" : "primary"}
              icon={selected ? "minus" : "plus"}
              disabled={!selected && !!block}
              onClick={() => {
                onToggle(playerId);
                onClose();
              }}
              className="flex-1"
            >
              {selected ? "Remove" : block ? block.message : "Add to Team"}
            </Button>
          </div>
        ) : null
      }
    >
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {!data && !error ? (
        <div className="space-y-4" aria-busy>
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : null}
      {data ? (
        <>
          <PlayerDetailView d={data} compact />
          <Link href={`/players/${data.player.id}?contest=${contestId}`} className="mt-4 inline-block text-callout font-medium text-accent">
            Full player page
          </Link>
        </>
      ) : null}
    </Sheet>
  );
}
