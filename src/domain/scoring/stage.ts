import type { MatchStatus, SeriesFormat } from "../types";
import { advancementCredits, swissMaxPath, type AdvancementCreditLine } from "./advancement";
import { scoreSeries, type Cs2MapResult, type Cs2ScoringRules, type SeriesBreakdown } from "./cs2";

/**
 * Scores a whole stage: every completed series, plus advancement credit once a Swiss stage
 * is fully decided. Forfeits and cancellations score nothing for anyone; a forfeit win
 * counts as a win but not as a played series (so it earns advancement credit).
 */

export interface StageSeriesInput {
  matchId: string;
  status: MatchStatus;
  format: SeriesFormat;
  teamA: string;
  teamB: string;
  winner: string | null;
  scheduledAt: number;
  maps: Cs2MapResult[];
}

export interface StageDefinition {
  kind: "swiss" | "single_elimination";
  winsToAdvance: number | null;
  lossesToEliminate: number | null;
  teamIds: string[];
}

export interface TeamStageRecord {
  teamId: string;
  wins: number;
  losses: number;
  seriesPlayed: number;
  forfeitWins: number;
  status: "alive" | "advanced" | "eliminated";
}

export interface StageScore {
  series: SeriesBreakdown[];
  credits: AdvancementCreditLine[];
  /** playerId -> stage points (series totals + credits). */
  playerTotals: Map<string, number>;
  records: Map<string, TeamStageRecord>;
  complete: boolean;
}

export function scoreStage(
  stage: StageDefinition,
  seriesList: readonly StageSeriesInput[],
  rules: Cs2ScoringRules,
): StageScore {
  const records = new Map<string, TeamStageRecord>(
    stage.teamIds.map((t) => [t, { teamId: t, wins: 0, losses: 0, seriesPlayed: 0, forfeitWins: 0, status: "alive" }]),
  );
  const ordered = [...seriesList].sort((a, b) => a.scheduledAt - b.scheduledAt || a.matchId.localeCompare(b.matchId));
  const breakdowns: SeriesBreakdown[] = [];
  const lastSeriesPlayers = new Map<string, string[]>();

  for (const s of ordered) {
    const finished = s.status === "completed" || s.status === "forfeit";
    if (!finished || !s.winner) continue;
    const loser = s.winner === s.teamA ? s.teamB : s.teamA;
    const rw = records.get(s.winner);
    const rl = records.get(loser);
    if (rw) rw.wins++;
    if (rl) rl.losses++;
    if (s.status === "forfeit") {
      if (rw) rw.forfeitWins++;
      continue;
    }
    if (rw) rw.seriesPlayed++;
    if (rl) rl.seriesPlayed++;
    const scored = scoreSeries({ matchId: s.matchId, format: s.format, winnerTeamId: s.winner, maps: s.maps }, rules);
    breakdowns.push(...scored);
    for (const team of [s.teamA, s.teamB]) {
      lastSeriesPlayers.set(team, scored.filter((b) => b.teamId === team).map((b) => b.playerId));
    }
  }

  // Team status.
  if (stage.kind === "swiss" && stage.winsToAdvance && stage.lossesToEliminate) {
    for (const r of records.values()) {
      if (r.wins >= stage.winsToAdvance) r.status = "advanced";
      else if (r.losses >= stage.lossesToEliminate) r.status = "eliminated";
    }
  } else {
    for (const r of records.values()) if (r.losses > 0) r.status = "eliminated";
  }
  const complete =
    stage.kind === "swiss"
      ? [...records.values()].every((r) => r.status !== "alive")
      : [...records.values()].filter((r) => r.status === "alive").length <= 1;

  let credits: AdvancementCreditLine[] = [];
  if (complete && stage.kind === "swiss" && stage.winsToAdvance && stage.lossesToEliminate) {
    credits = advancementCredits(
      [...records.values()].map((r) => ({
        teamId: r.teamId,
        seriesPlayed: r.seriesPlayed,
        forfeitWins: r.forfeitWins,
        advanced: r.status === "advanced",
        finalSeriesPlayerIds: lastSeriesPlayers.get(r.teamId) ?? [],
      })),
      swissMaxPath(stage.winsToAdvance, stage.lossesToEliminate),
      rules.advancementCredit,
    );
  }

  const playerTotals = new Map<string, number>();
  for (const b of breakdowns) playerTotals.set(b.playerId, (playerTotals.get(b.playerId) ?? 0) + b.total);
  for (const c of credits) playerTotals.set(c.playerId, (playerTotals.get(c.playerId) ?? 0) + c.points);

  return { series: breakdowns, credits, playerTotals, records, complete };
}
