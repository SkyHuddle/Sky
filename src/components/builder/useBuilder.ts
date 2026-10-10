"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addBlockReason, countTransfers, summarizeRoster, validateRoster, validateTransfers, type RosterError } from "@/domain/rules";
import type { PoolPlayer } from "@/domain/types";
import type { BuilderData, PoolPlayerView } from "@/server/queries/contest";

/**
 * Builder state. Uses the same rule functions as the server (src/domain/rules) for instant,
 * identical feedback; the server remains the authority on submit.
 *
 * The draft is kept on the device (localStorage) per contest window, so leaving for a player page,
 * signing up, or losing connection never discards a roster.
 */

export type SortKey = "price_desc" | "price_asc" | "avg" | "form" | "value";

export interface Filters {
  q: string;
  teams: string[];
  roles: string[];
  sort: SortKey;
  affordable: boolean;
}

const DEFAULT_FILTERS: Filters = { q: "", teams: [], roles: [], sort: "price_desc", affordable: false };

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function sessionStore(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function draftKey(contestId: string, windowId: string | undefined) {
  return `lockin:draft:${contestId}:${windowId ?? "none"}`;
}

export function useBuilder(data: BuilderData) {
  const key = draftKey(data.contest.id, data.window?.id);
  const initial = data.saved ?? data.previous ?? null;
  const [playerIds, setPlayerIds] = useState<string[]>(initial?.playerIds ?? []);
  const [captainId, setCaptainId] = useState<string | null>(initial?.captainId ?? null);
  const [autopilot, setAutopilot] = useState<boolean>(data.autopilot ?? true);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [restored, setRestored] = useState(false);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const hydrated = useRef(false);

  // Restore a local draft (newer than the saved roster) and the last filters.
  useEffect(() => {
    const raw = storage()?.getItem(key);
    if (raw) {
      try {
        const d = JSON.parse(raw) as { playerIds: string[]; captainId: string | null; autopilot?: boolean; savedSource?: string };
        const savedSig = JSON.stringify([data.saved?.playerIds ?? [], data.saved?.captainId ?? null]);
        const draftSig = JSON.stringify([d.playerIds, d.captainId]);
        if (draftSig !== savedSig && Array.isArray(d.playerIds)) {
          setPlayerIds(d.playerIds.slice(0, data.rules.rosterSize));
          setCaptainId(d.captainId);
          if (typeof d.autopilot === "boolean") setAutopilot(d.autopilot);
          setRestored(d.playerIds.length > 0);
        }
      } catch {
        /* corrupt draft: ignore */
      }
    }
    const f = sessionStore()?.getItem(`lockin:filters:${data.contest.id}`);
    if (f) {
      try {
        setFilters({ ...DEFAULT_FILTERS, ...(JSON.parse(f) as Partial<Filters>) });
      } catch {
        /* ignore */
      }
    }
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!hydrated.current) return;
    storage()?.setItem(key, JSON.stringify({ playerIds, captainId, autopilot, at: Date.now() }));
  }, [key, playerIds, captainId, autopilot]);

  useEffect(() => {
    if (!hydrated.current) return;
    sessionStore()?.setItem(`lockin:filters:${data.contest.id}`, JSON.stringify(filters));
  }, [filters, data.contest.id]);

  const byId = useMemo(() => new Map(data.pool.map((p) => [p.id, p])), [data.pool]);
  const pool = useMemo(() => new Map<string, PoolPlayer>(data.pool.map((p) => [p.id, { id: p.id, teamId: p.teamId, price: p.price }])), [data.pool]);
  // Players carried over from the previous window who are no longer eligible.
  const ineligible = useMemo(() => new Map(data.ineligiblePrevious.map((p) => [p.id, p])), [data.ineligiblePrevious]);

  // Ineligible players still occupy a slot and salary until replaced.
  const withIneligible = useMemo(() => {
    const m = new Map(pool);
    for (const p of data.ineligiblePrevious) m.set(p.id, { id: p.id, teamId: p.teamId, price: p.price });
    return m;
  }, [pool, data.ineligiblePrevious]);

  const summary = useMemo(() => summarizeRoster(playerIds, withIneligible, data.rules), [playerIds, withIneligible, data.rules]);

  const errors: RosterError[] = useMemo(() => validateRoster({ playerIds, captainId }, pool, data.rules), [playerIds, captainId, pool, data.rules]);

  const transfers = useMemo(() => {
    if (!data.previous || !data.entryId) return null;
    const count = countTransfers(data.previous.playerIds, playerIds, new Set(pool.keys()));
    return { ...count, error: validateTransfers(count, data.rules), allowed: data.rules.transfersPerWindow };
  }, [data.previous, data.entryId, playerIds, pool, data.rules]);

  const cheapest = useMemo(() => Math.min(...data.pool.map((p) => p.price)), [data.pool]);

  /**
   * Why a player can't be added: the shared rule check, plus a guard against dead ends: a pick that
   * leaves too little money to fill the remaining slots even with the cheapest players.
   */
  const blockReason = useCallback(
    (p: PoolPlayerView): RosterError | null => {
      const hard = addBlockReason({ id: p.id, teamId: p.teamId, price: p.price }, playerIds, withIneligible, data.rules);
      if (hard || playerIds.includes(p.id)) return hard;
      const slotsAfter = data.rules.rosterSize - playerIds.length - 1;
      const leftAfter = summary.salaryRemaining - p.price;
      if (slotsAfter > 0 && leftAfter < slotsAfter * cheapest) {
        return { code: "OVER_CAP", message: `Leaves too little for ${slotsAfter} more player${slotsAfter > 1 ? "s" : ""}`, playerId: p.id };
      }
      return null;
    },
    [playerIds, withIneligible, data.rules, summary.salaryRemaining, cheapest],
  );

  const add = useCallback(
    (id: string) => {
      setPlayerIds((ids) => {
        if (ids.includes(id) || ids.length >= data.rules.rosterSize) return ids;
        return [...ids, id];
      });
      setLastAdded(id);
    },
    [data.rules.rosterSize],
  );

  const remove = useCallback((id: string) => {
    setPlayerIds((ids) => ids.filter((x) => x !== id));
    setCaptainId((c) => (c === id ? null : c));
  }, []);

  const toggle = useCallback((id: string) => (playerIds.includes(id) ? remove(id) : add(id)), [playerIds, add, remove]);

  const clear = useCallback(() => {
    setPlayerIds([]);
    setCaptainId(null);
  }, []);

  const resetToSaved = useCallback(() => {
    setPlayerIds(initial?.playerIds ?? []);
    setCaptainId(initial?.captainId ?? null);
    setRestored(false);
  }, [initial]);

  /** "Suggest a team": most-valuable legal lineup by recent form, filled around current picks. */
  const suggest = useCallback(() => {
    const keep = playerIds.filter((id) => pool.has(id));
    const picks = [...keep];
    const ordered = [...data.pool].sort((a, b) => b.avgPoints - a.avgPoints || b.price - a.price);
    const m = new Map(pool);
    for (const p of ordered) {
      if (picks.length >= data.rules.rosterSize) break;
      if (picks.includes(p.id)) continue;
      const s = summarizeRoster(picks, m, data.rules);
      const slotsAfter = data.rules.rosterSize - picks.length - 1;
      const cheapest = Math.min(...data.pool.map((x) => x.price));
      if (s.salaryRemaining - p.price < slotsAfter * cheapest) continue;
      if (!addBlockReason({ id: p.id, teamId: p.teamId, price: p.price }, picks, m, data.rules)) picks.push(p.id);
    }
    setPlayerIds(picks);
    if (!captainId || !picks.includes(captainId)) {
      const best = [...picks].sort((a, b) => (byId.get(b)?.avgPoints ?? 0) - (byId.get(a)?.avgPoints ?? 0))[0];
      setCaptainId(best ?? null);
    }
  }, [playerIds, pool, data.pool, data.rules, captainId, byId]);

  const visible = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const list = data.pool.filter((p) => {
      if (q) {
        const team = data.teams[p.teamId];
        const hay = `${p.nickname} ${p.firstName} ${p.lastName} ${team?.name ?? ""} ${team?.acronym ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.teams.length && !filters.teams.includes(p.teamId)) return false;
      if (filters.roles.length && !filters.roles.includes(p.role)) return false;
      if (filters.affordable && !playerIds.includes(p.id) && p.price > summary.salaryRemaining) return false;
      return true;
    });
    const value = (p: PoolPlayerView) => (p.avgPoints / p.price) * 10_000;
    const formAvg = (p: PoolPlayerView) => (p.form.length ? p.form.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, p.form.length) : 0);
    const sorters: Record<SortKey, (a: PoolPlayerView, b: PoolPlayerView) => number> = {
      price_desc: (a, b) => b.price - a.price || a.nickname.localeCompare(b.nickname),
      price_asc: (a, b) => a.price - b.price || a.nickname.localeCompare(b.nickname),
      avg: (a, b) => b.avgPoints - a.avgPoints,
      form: (a, b) => formAvg(b) - formAvg(a),
      value: (a, b) => value(b) - value(a),
    };
    return list.sort(sorters[filters.sort]);
  }, [data.pool, data.teams, filters, playerIds, summary.salaryRemaining]);

  return {
    playerIds,
    captainId,
    setCaptainId,
    autopilot,
    setAutopilot,
    filters,
    setFilters,
    summary,
    errors,
    transfers,
    blockReason,
    add,
    remove,
    toggle,
    clear,
    suggest,
    resetToSaved,
    restored,
    lastAdded,
    visible,
    byId,
    ineligible,
    draftKey: key,
  };
}

export type BuilderState = ReturnType<typeof useBuilder>;
