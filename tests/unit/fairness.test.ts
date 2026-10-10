import { describe, expect, it } from "vitest";
import { normalizeDemoTournament } from "@/server/providers/demo/adapter";
import { simulateTournament } from "@/server/providers/demo/simulate";
import { demoUniverse } from "@/server/providers/demo/universe";
import { viewAt } from "@/server/providers/demo/view";
import { CS2_RULES_V1, CS2_RULES_V2, type Cs2ScoringRules } from "@/domain/scoring/cs2";
import { scoreStage, type StageScore } from "@/domain/scoring/stage";
import type { NormTournament } from "@/server/providers/types";

/**
 * Fairness checks from docs/04 "Calibration plan", run on several full simulated tournaments.
 * These are statistical properties of the scoring model, not exact values.
 */

const u = demoUniverse();
const SEEDS = ["fair-1", "fair-2", "fair-3", "fair-4", "fair-5", "fair-6"];

function scoreAll(t: NormTournament, rules: Cs2ScoringRules = CS2_RULES_V2): StageScore[] {
  return t.stages.map((st) =>
    scoreStage(
      {
        kind: st.kind,
        winsToAdvance: st.winsToAdvance,
        lossesToEliminate: st.lossesToEliminate,
        teamIds: st.teamExternalIds,
      },
      t.matches
        .filter((m) => m.stageExternalId === st.externalId)
        .map((m) => ({
          matchId: m.externalId,
          status: m.status,
          format: m.format,
          teamA: m.teamAExternalId,
          teamB: m.teamBExternalId,
          winner: m.winnerTeamExternalId,
          scheduledAt: m.scheduledAt.getTime(),
          maps: m.maps.map((g) => ({
            mapNumber: g.number,
            mapName: g.mapName,
            roundsPlayed: g.roundsPlayed,
            winnerTeamId: g.winnerTeamExternalId,
            players: g.stats,
          })),
        })),
      rules,
    ),
  );
}

const tournaments = SEEDS.map((seed) => {
  const sim = simulateTournament({
    id: seed,
    slug: seed,
    name: seed,
    shortName: seed,
    tier: "major",
    location: "x",
    seed,
    startAt: new Date("2030-01-01T12:00:00Z"),
    teams: u.teams,
    players: u.players,
    edgeCases: false,
  });
  const t = normalizeDemoTournament(viewAt(sim, new Date("2031-01-01T00:00:00Z")));
  return { t, stages: scoreAll(t) };
});

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

function formatAverages(rules: Cs2ScoringRules): number[] {
  const byFormat = new Map<number, number[]>();
  for (const { t } of tournaments)
    for (const st of scoreAll(t, rules))
      for (const s of st.series) byFormat.set(s.format, [...(byFormat.get(s.format) ?? []), s.total]);
  return [1, 3, 5].map((f) => mean(byFormat.get(f) ?? [0]));
}

describe("scoring fairness on simulated Majors", () => {
  it("documents why v1 was replaced: its format weights alone create a >10% gap", () => {
    const [bo1, bo3, bo5] = formatAverages(CS2_RULES_V1);
    console.info("v1 avg series score BO1/BO3/BO5:", [bo1, bo3, bo5].map((a) => a!.toFixed(2)).join(" / "));
    expect(Math.abs(bo1! - bo3!) / bo3!).toBeGreaterThan(0.1);
  });

  it("average series score differs by under 10% between BO1, BO3 and BO5 after weights", () => {
    const avgs = formatAverages(CS2_RULES_V2);
    const ref = avgs[1]!;
    // Report for calibration notes.
    console.info("v2 avg series score BO1/BO3/BO5:", avgs.map((a) => a.toFixed(2)).join(" / "));
    for (const a of [avgs[0]!, avgs[2]!]) expect(Math.abs(a - ref) / ref).toBeLessThan(0.1);
  });

  it("players on 3-0 teams average at least as much stage score as players on 3-2 teams", () => {
    const by30: number[] = [];
    const by32: number[] = [];
    for (const { t, stages } of tournaments) {
      t.stages.forEach((st, i) => {
        const sc = stages[i]!;
        if (st.kind !== "swiss") return;
        for (const r of sc.records.values()) {
          if (r.status !== "advanced") continue;
          const players = t.players.filter((p) => p.teamExternalId === r.teamId && !p.isStandIn);
          const pts = mean(players.map((p) => sc.playerTotals.get(p.externalId) ?? 0));
          if (r.losses === 0) by30.push(pts);
          if (r.losses === 2) by32.push(pts);
        }
      });
    }
    console.info("avg stage points 3-0 vs 3-2:", mean(by30).toFixed(1), "vs", mean(by32).toFixed(1));
    expect(mean(by30)).toBeGreaterThanOrEqual(mean(by32));
  });

  it("individual performance dominates: team results are under 30% of points", () => {
    let teamPts = 0;
    let all = 0;
    for (const { stages } of tournaments)
      for (const st of stages)
        for (const s of st.series) {
          const mapWin = s.maps.reduce((a, m) => a + m.mapWinPoints, 0) / s.maps.length;
          teamPts += (mapWin + s.seriesWinPoints) * s.formatWeight;
          all += s.total;
        }
    const share = teamPts / all;
    console.info("team-result share of points:", (share * 100).toFixed(1) + "%");
    expect(share).toBeLessThan(0.3);
  });

  it("a deep run is worth more than an early exit: champions out-score Stage 1 exits", () => {
    for (const { t, stages } of tournaments) {
      const total = new Map<string, number>();
      for (const st of stages) for (const [p, v] of st.playerTotals) total.set(p, (total.get(p) ?? 0) + v);
      const final = t.matches.find((m) => m.slot === "final")!;
      const champs = t.players.filter((p) => p.teamExternalId === final.winnerTeamExternalId && !p.isStandIn);
      const s1 = stages[0]!;
      const exits = [...s1.records.values()].filter((r) => r.status === "eliminated").map((r) => r.teamId);
      const exitPlayers = t.players.filter((p) => exits.includes(p.teamExternalId));
      expect(mean(champs.map((p) => total.get(p.externalId) ?? 0))).toBeGreaterThan(
        mean(exitPlayers.map((p) => total.get(p.externalId) ?? 0)),
      );
    }
  });
});
