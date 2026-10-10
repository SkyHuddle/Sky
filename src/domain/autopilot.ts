import type { ContestRules } from "./types";

/**
 * Autopilot (docs/04 "Autopilot", docs/09 CO-7).
 *
 * At a window's close, for an entry with Autopilot on, each roster player who is no longer
 * eligible (eliminated or removed from their team) is replaced by the most-picked affordable
 * eligible player. It never touches players who are still eligible and never uses discretionary
 * transfers. If the captain was replaced, the captaincy passes to the highest-priced remaining player.
 *
 * Deterministic candidate order: ownership desc, average points desc, price desc, id asc.
 * A candidate is accepted only if the remaining empty slots can still be filled legally.
 * If no legal candidate exists, the slot stays empty and is reported. Never invents a player.
 */

export interface AutopilotCandidate {
  id: string;
  teamId: string;
  price: number;
  ownership: number;
  averagePoints: number;
}

export interface AutopilotInput {
  playerIds: string[];
  captainId: string | null;
  /** Eligible pool for the window being locked. Players not in it are considered ineligible. */
  pool: readonly AutopilotCandidate[];
  rules: ContestRules;
}

export interface AutopilotReplacement {
  outPlayerId: string;
  inPlayerId: string | null;
  reason: "eliminated";
}

export interface AutopilotResult {
  changed: boolean;
  playerIds: string[];
  captainId: string | null;
  replacements: AutopilotReplacement[];
  captainReassignedFrom: string | null;
  unfilledSlots: number;
}

function candidateOrder(a: AutopilotCandidate, b: AutopilotCandidate): number {
  return (
    b.ownership - a.ownership ||
    b.averagePoints - a.averagePoints ||
    b.price - a.price ||
    a.id.localeCompare(b.id)
  );
}

export function runAutopilot(input: AutopilotInput): AutopilotResult {
  const { rules } = input;
  const poolById = new Map(input.pool.map((p) => [p.id, p]));
  const keep = input.playerIds.filter((id) => poolById.has(id));
  const out = input.playerIds.filter((id) => !poolById.has(id));

  if (out.length === 0) {
    return {
      changed: false,
      playerIds: [...input.playerIds],
      captainId: input.captainId,
      replacements: [],
      captainReassignedFrom: null,
      unfilledSlots: 0,
    };
  }

  const roster = [...keep];
  const ordered = [...input.pool].sort(candidateOrder);
  const replacements: AutopilotReplacement[] = [];

  const teamCount = (ids: string[], teamId: string) =>
    ids.reduce((n, id) => n + (poolById.get(id)?.teamId === teamId ? 1 : 0), 0);
  const spent = (ids: string[]) => ids.reduce((s, id) => s + (poolById.get(id)?.price ?? 0), 0);

  // Cheapest legal completion check: can `slots` more players be added within budget and team limits?
  const canComplete = (ids: string[], slots: number): boolean => {
    if (slots === 0) return true;
    let budget = rules.salaryCap - spent(ids);
    const counts = new Map<string, number>();
    for (const id of ids) {
      const t = poolById.get(id)!.teamId;
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    const cheapest = [...input.pool]
      .filter((p) => !ids.includes(p.id))
      .sort((a, b) => a.price - b.price || a.id.localeCompare(b.id));
    let filled = 0;
    for (const p of cheapest) {
      if (filled === slots) break;
      if ((counts.get(p.teamId) ?? 0) >= rules.maxPerTeam) continue;
      if (p.price > budget) break;
      budget -= p.price;
      counts.set(p.teamId, (counts.get(p.teamId) ?? 0) + 1);
      filled++;
    }
    return filled === slots;
  };

  // Replace in the original roster order so the result is stable.
  let unfilled = 0;
  for (const [i, outId] of out.entries()) {
    // Slots still to fill after this one (the later eliminated players).
    const laterSlots = out.length - i - 1;
    const pick = ordered.find((c) => {
      if (roster.includes(c.id)) return false;
      if (teamCount(roster, c.teamId) >= rules.maxPerTeam) return false;
      if (spent(roster) + c.price > rules.salaryCap) return false;
      return canComplete([...roster, c.id], laterSlots);
    });
    if (pick) {
      roster.push(pick.id);
      replacements.push({ outPlayerId: outId, inPlayerId: pick.id, reason: "eliminated" });
    } else {
      unfilled++;
      replacements.push({ outPlayerId: outId, inPlayerId: null, reason: "eliminated" });
    }
  }

  let captainId = input.captainId;
  let captainReassignedFrom: string | null = null;
  if (!captainId || !roster.includes(captainId)) {
    captainReassignedFrom = captainId;
    const best = [...roster].sort(
      (a, b) => (poolById.get(b)!.price - poolById.get(a)!.price) || a.localeCompare(b),
    )[0];
    captainId = best ?? null;
  }

  return {
    changed: true,
    playerIds: roster,
    captainId,
    replacements,
    captainReassignedFrom,
    unfilledSlots: unfilled,
  };
}
