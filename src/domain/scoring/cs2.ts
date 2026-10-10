import type { SeriesFormat } from "../types";

/**
 * CS2 scoring, "Model C" from docs/04-gameplay-and-scoring.md:
 *   1. Score each map from published events.
 *   2. Overtime cap: maps over 24 rounds scale event points by 24 / rounds (never scale up).
 *   3. +mapWin if the player's team won the map.
 *   4. Average the map scores in the series.
 *   5. +seriesWin for a series win.
 *   6. Multiply by the format weight (BO1 / BO3 / BO5).
 *   7. Advancement credit for unplayed Swiss/group series (computed per stage, see advancement.ts).
 *   8. Captain multiplier is applied at entry level, not here.
 *
 * Deterministic and side-effect free. All numbers are kept at full precision; rounding is display-only.
 */

export interface Cs2ScoringRules {
  id: string;
  kill: number;
  death: number;
  assist: number;
  openingKill: number;
  multiKill: { k3: number; k4: number; k5: number };
  /** Points for a clutch won against N opponents, index 1..5. */
  clutch: { v1: number; v2: number; v3: number; v4: number; v5: number };
  mapWin: number;
  seriesWin: number;
  overtimeCapRounds: number;
  formatWeight: Record<SeriesFormat, number>;
  advancementCredit: number;
}

/** The recommended rule set (docs/04 "CS2 event points"). Version id is pinned on every contest. */
export const CS2_RULES_V1: Cs2ScoringRules = {
  id: "cs2-v1",
  kill: 2,
  death: -1,
  assist: 1,
  openingKill: 1,
  multiKill: { k3: 1, k4: 2, k5: 4 },
  clutch: { v1: 2, v2: 3, v3: 4, v4: 5, v5: 6 },
  mapWin: 3,
  seriesWin: 3,
  overtimeCapRounds: 24,
  formatWeight: { 1: 0.8, 3: 1.0, 5: 1.2 },
  advancementCredit: 25,
};

/**
 * Calibrated rule set (the one contests use). Back-testing on simulated Majors showed that
 * averaging per map already equalises BO1/BO3/BO5 (average series score 25.0 / 24.9 / 25.2),
 * so v1's format weights (0.8 / 1.0 / 1.2) created a ~20% gap between formats on their own,
 * failing docs/04's calibration target (< 10%). v2 sets neutral weights. See docs/10.
 */
export const CS2_RULES_V2: Cs2ScoringRules = {
  ...CS2_RULES_V1,
  id: "cs2-v2",
  formatWeight: { 1: 1.0, 3: 1.0, 5: 1.0 },
};

/**
 * Fallback rule set (docs/09 SC-10) for feeds that don't provide opening kills,
 * multi-kill rounds or clutches. Only K/D/A and map/series results count.
 */
export const CS2_RULES_BASIC_V2: Cs2ScoringRules = {
  ...CS2_RULES_V2,
  id: "cs2-basic-v2",
  openingKill: 0,
  multiKill: { k3: 0, k4: 0, k5: 0 },
  clutch: { v1: 0, v2: 0, v3: 0, v4: 0, v5: 0 },
};

export const CS2_RULE_SETS: Record<string, Cs2ScoringRules> = {
  [CS2_RULES_V1.id]: CS2_RULES_V1,
  [CS2_RULES_V2.id]: CS2_RULES_V2,
  [CS2_RULES_BASIC_V2.id]: CS2_RULES_BASIC_V2,
};

/** The rule set new contests pin by default. */
export const CS2_DEFAULT_RULES = CS2_RULES_V2;

/** Normalised per-player, per-map statistics (provider-independent). */
export interface Cs2PlayerMapStats {
  playerId: string;
  teamId: string;
  kills: number;
  deaths: number;
  assists: number;
  openingKills: number;
  /** Rounds in which the player got exactly 3, 4 or 5 kills. */
  multiKillRounds: { k3: number; k4: number; k5: number };
  /** Clutches won, by number of opponents. */
  clutchesWon: { v1: number; v2: number; v3: number; v4: number; v5: number };
}

export interface Cs2MapResult {
  mapNumber: number;
  mapName: string;
  roundsPlayed: number;
  winnerTeamId: string;
  players: Cs2PlayerMapStats[];
}

export interface Cs2SeriesResult {
  matchId: string;
  format: SeriesFormat;
  winnerTeamId: string;
  maps: Cs2MapResult[];
}

export type Cs2Component =
  | "kill"
  | "death"
  | "assist"
  | "openingKill"
  | "multiKill3"
  | "multiKill4"
  | "multiKill5"
  | "clutch1"
  | "clutch2"
  | "clutch3"
  | "clutch4"
  | "clutch5";

export interface ComponentLine {
  component: Cs2Component;
  quantity: number;
  points: number;
}

export interface MapBreakdown {
  mapNumber: number;
  mapName: string;
  roundsPlayed: number;
  won: boolean;
  lines: ComponentLine[];
  eventPoints: number;
  overtimeFactor: number;
  cappedEventPoints: number;
  mapWinPoints: number;
  mapScore: number;
}

export interface SeriesBreakdown {
  rulesId: string;
  matchId: string;
  playerId: string;
  teamId: string;
  format: SeriesFormat;
  maps: MapBreakdown[];
  mapAverage: number;
  seriesWinPoints: number;
  formatWeight: number;
  total: number;
}

export function scoreMap(
  stats: Cs2PlayerMapStats,
  map: Pick<Cs2MapResult, "mapNumber" | "mapName" | "roundsPlayed" | "winnerTeamId">,
  rules: Cs2ScoringRules,
): MapBreakdown {
  const raw: Array<[Cs2Component, number, number]> = [
    ["kill", stats.kills, rules.kill],
    ["death", stats.deaths, rules.death],
    ["assist", stats.assists, rules.assist],
    ["openingKill", stats.openingKills, rules.openingKill],
    ["multiKill3", stats.multiKillRounds.k3, rules.multiKill.k3],
    ["multiKill4", stats.multiKillRounds.k4, rules.multiKill.k4],
    ["multiKill5", stats.multiKillRounds.k5, rules.multiKill.k5],
    ["clutch1", stats.clutchesWon.v1, rules.clutch.v1],
    ["clutch2", stats.clutchesWon.v2, rules.clutch.v2],
    ["clutch3", stats.clutchesWon.v3, rules.clutch.v3],
    ["clutch4", stats.clutchesWon.v4, rules.clutch.v4],
    ["clutch5", stats.clutchesWon.v5, rules.clutch.v5],
  ];
  const lines: ComponentLine[] = raw
    .filter(([, qty, weight]) => qty !== 0 && weight !== 0)
    .map(([component, quantity, weight]) => ({ component, quantity, points: quantity * weight }));
  const eventPoints = lines.reduce((s, l) => s + l.points, 0);
  const overtimeFactor =
    map.roundsPlayed > rules.overtimeCapRounds ? rules.overtimeCapRounds / map.roundsPlayed : 1;
  const cappedEventPoints = eventPoints * overtimeFactor;
  const won = map.winnerTeamId === stats.teamId;
  const mapWinPoints = won ? rules.mapWin : 0;
  return {
    mapNumber: map.mapNumber,
    mapName: map.mapName,
    roundsPlayed: map.roundsPlayed,
    won,
    lines,
    eventPoints,
    overtimeFactor,
    cappedEventPoints,
    mapWinPoints,
    mapScore: cappedEventPoints + mapWinPoints,
  };
}

/**
 * Scores every player who appears in at least one map of the series.
 * A player who appears in some maps but not others (e.g. a mid-series substitution)
 * is averaged over the maps they played.
 */
export function scoreSeries(series: Cs2SeriesResult, rules: Cs2ScoringRules): SeriesBreakdown[] {
  const byPlayer = new Map<string, { teamId: string; maps: MapBreakdown[] }>();
  const orderedMaps = [...series.maps].sort((a, b) => a.mapNumber - b.mapNumber);
  for (const map of orderedMaps) {
    for (const p of map.players) {
      const entry = byPlayer.get(p.playerId) ?? { teamId: p.teamId, maps: [] };
      entry.maps.push(scoreMap(p, map, rules));
      byPlayer.set(p.playerId, entry);
    }
  }
  const weight = rules.formatWeight[series.format];
  const out: SeriesBreakdown[] = [];
  for (const [playerId, { teamId, maps }] of byPlayer) {
    const mapAverage = maps.reduce((s, m) => s + m.mapScore, 0) / maps.length;
    const seriesWinPoints = series.winnerTeamId === teamId ? rules.seriesWin : 0;
    out.push({
      rulesId: rules.id,
      matchId: series.matchId,
      playerId,
      teamId,
      format: series.format,
      maps,
      mapAverage,
      seriesWinPoints,
      formatWeight: weight,
      total: (mapAverage + seriesWinPoints) * weight,
    });
  }
  return out.sort((a, b) => a.playerId.localeCompare(b.playerId));
}

export const COMPONENT_LABELS: Record<Cs2Component, string> = {
  kill: "Kills",
  death: "Deaths",
  assist: "Assists",
  openingKill: "Opening kills",
  multiKill3: "3-kill rounds",
  multiKill4: "4-kill rounds",
  multiKill5: "Aces",
  clutch1: "1v1 clutches",
  clutch2: "1v2 clutches",
  clutch3: "1v3 clutches",
  clutch4: "1v4 clutches",
  clutch5: "1v5 clutches",
};
