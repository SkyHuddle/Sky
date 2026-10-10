/**
 * Shared domain types. Pure TypeScript: no framework, database or I/O imports.
 * Every gameplay rule lives in src/domain so it can be unit tested and reused by
 * the server (authoritative) and the client (instant feedback).
 */

export type GameId = "cs2";

export type SeriesFormat = 1 | 3 | 5;

export type MatchStatus =
  | "scheduled"
  | "live"
  | "completed"
  | "postponed"
  | "forfeit"
  | "cancelled";

/** Score states, in order of increasing finality (docs/04 universal rules). */
export type ScoreState = "provisional" | "official" | "settled";

export interface ContestRules {
  rosterSize: number;
  salaryCap: number;
  maxPerTeam: number;
  captainMultiplier: number;
  /** Discretionary transfers allowed at each window after the first. Eliminated players are always free to replace. */
  transfersPerWindow: number;
}

/** Per-window overrides (docs/GAMEPLAY.md): e.g. 1 strategic transfer in playoff windows, 3 per team in the final. */
export interface WindowRuleOverrides {
  transfersAllowed?: number | null;
  maxPerTeam?: number | null;
}

/** The rules that apply in one window: contest defaults with that window's overrides. */
export function windowRules(rules: ContestRules, w: WindowRuleOverrides | null | undefined): ContestRules {
  return {
    ...rules,
    transfersPerWindow: w?.transfersAllowed ?? rules.transfersPerWindow,
    maxPerTeam: w?.maxPerTeam ?? rules.maxPerTeam,
  };
}

export const DEFAULT_CS2_CONTEST_RULES: ContestRules = {
  rosterSize: 5,
  salaryCap: 1_000_000,
  maxPerTeam: 2,
  captainMultiplier: 1.5,
  transfersPerWindow: 2,
};

/** A player as seen by roster validation: only the fields the rules need. */
export interface PoolPlayer {
  id: string;
  teamId: string;
  price: number;
}

export interface RosterSelection {
  playerIds: string[];
  captainId: string | null;
}
