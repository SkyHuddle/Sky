import type { ContestRules, PoolPlayer, RosterSelection } from "./types";

/**
 * Roster and transfer validation (docs/04 "flagship format", docs/09 CO-2, CO-6).
 * The server runs these as the authority; the client runs the same code for instant feedback.
 */

export type RosterErrorCode =
  | "ROSTER_SIZE"
  | "DUPLICATE_PLAYER"
  | "INELIGIBLE_PLAYER"
  | "OVER_CAP"
  | "TEAM_LIMIT"
  | "CAPTAIN_REQUIRED"
  | "CAPTAIN_NOT_IN_ROSTER"
  | "TRANSFER_LIMIT"
  | "LOCKED";

export interface RosterError {
  code: RosterErrorCode;
  message: string;
  playerId?: string;
  teamId?: string;
}

export interface RosterSummary {
  salaryUsed: number;
  salaryRemaining: number;
  /** Average budget left per open slot, or null when the roster is full. */
  averagePerOpenSlot: number | null;
  openSlots: number;
  teamCounts: Map<string, number>;
}

export function summarizeRoster(
  playerIds: readonly string[],
  pool: ReadonlyMap<string, PoolPlayer>,
  rules: ContestRules,
): RosterSummary {
  let salaryUsed = 0;
  const teamCounts = new Map<string, number>();
  for (const id of playerIds) {
    const p = pool.get(id);
    if (!p) continue;
    salaryUsed += p.price;
    teamCounts.set(p.teamId, (teamCounts.get(p.teamId) ?? 0) + 1);
  }
  const openSlots = Math.max(0, rules.rosterSize - playerIds.length);
  const salaryRemaining = rules.salaryCap - salaryUsed;
  return {
    salaryUsed,
    salaryRemaining,
    openSlots,
    averagePerOpenSlot: openSlots > 0 ? salaryRemaining / openSlots : null,
    teamCounts,
  };
}

/** Why a player can't be added right now, or null if they can. Used to disable rows with an inline reason. */
export function addBlockReason(
  candidate: PoolPlayer,
  playerIds: readonly string[],
  pool: ReadonlyMap<string, PoolPlayer>,
  rules: ContestRules,
): RosterError | null {
  if (playerIds.includes(candidate.id)) return null;
  const s = summarizeRoster(playerIds, pool, rules);
  if (s.openSlots === 0) {
    return { code: "ROSTER_SIZE", message: "Roster is full" };
  }
  if ((s.teamCounts.get(candidate.teamId) ?? 0) >= rules.maxPerTeam) {
    return {
      code: "TEAM_LIMIT",
      message: `${rules.maxPerTeam} from this team already`,
      teamId: candidate.teamId,
    };
  }
  if (candidate.price > s.salaryRemaining) {
    return {
      code: "OVER_CAP",
      message: `${formatShortMoney(candidate.price - s.salaryRemaining)} over budget`,
      playerId: candidate.id,
    };
  }
  return null;
}

/** Full validation of a roster for submission. Returns every problem, not just the first. */
export function validateRoster(
  selection: RosterSelection,
  pool: ReadonlyMap<string, PoolPlayer>,
  rules: ContestRules,
): RosterError[] {
  const errors: RosterError[] = [];
  const { playerIds, captainId } = selection;

  if (new Set(playerIds).size !== playerIds.length) {
    errors.push({ code: "DUPLICATE_PLAYER", message: "A player appears twice" });
  }
  if (playerIds.length !== rules.rosterSize) {
    errors.push({
      code: "ROSTER_SIZE",
      message: `Pick exactly ${rules.rosterSize} players (you have ${playerIds.length})`,
    });
  }
  for (const id of playerIds) {
    if (!pool.has(id)) {
      errors.push({
        code: "INELIGIBLE_PLAYER",
        message: "A selected player isn't eligible for this stage",
        playerId: id,
      });
    }
  }
  const s = summarizeRoster(playerIds, pool, rules);
  if (s.salaryRemaining < 0) {
    errors.push({
      code: "OVER_CAP",
      message: `${formatShortMoney(-s.salaryRemaining)} over the ${formatShortMoney(rules.salaryCap)} cap`,
    });
  }
  for (const [teamId, n] of s.teamCounts) {
    if (n > rules.maxPerTeam) {
      errors.push({
        code: "TEAM_LIMIT",
        message: `Only ${rules.maxPerTeam} players allowed from one team`,
        teamId,
      });
    }
  }
  if (!captainId) {
    errors.push({ code: "CAPTAIN_REQUIRED", message: "Choose a captain" });
  } else if (!playerIds.includes(captainId)) {
    errors.push({
      code: "CAPTAIN_NOT_IN_ROSTER",
      message: "Your captain must be on your roster",
    });
  }
  return errors;
}

export interface TransferCount {
  /** Players removed who were still alive: these cost a transfer. */
  discretionary: string[];
  /** Players removed because their team was eliminated or they left the roster: free. */
  free: string[];
  added: string[];
}

/**
 * Counts transfers between the previous window's roster and a proposed one.
 * Replacing a player who is no longer eligible (eliminated, removed from a team) is free.
 */
export function countTransfers(
  previous: readonly string[],
  next: readonly string[],
  stillEligible: ReadonlySet<string>,
): TransferCount {
  const removed = previous.filter((id) => !next.includes(id));
  const added = next.filter((id) => !previous.includes(id));
  return {
    discretionary: removed.filter((id) => stillEligible.has(id)),
    free: removed.filter((id) => !stillEligible.has(id)),
    added,
  };
}

export function validateTransfers(
  count: TransferCount,
  rules: ContestRules,
): RosterError | null {
  if (count.discretionary.length > rules.transfersPerWindow) {
    return {
      code: "TRANSFER_LIMIT",
      message: `You can make ${rules.transfersPerWindow} transfers this window (you made ${count.discretionary.length}). Replacing eliminated players is free.`,
    };
  }
  return null;
}

export function formatShortMoney(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "−" : "";
  if (abs >= 1_000_000) {
    const m = abs / 1_000_000;
    return `${sign}$${Number.isInteger(m) ? m.toFixed(0) : m.toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    const k = abs / 1_000;
    return `${sign}$${Number.isInteger(k) ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `${sign}$${abs}`;
}
