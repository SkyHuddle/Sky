import { describe, expect, it } from "vitest";
import {
  CS2_RULES_BASIC_V2,
  CS2_RULES_V1,
  scoreMap,
  scoreSeries,
  type Cs2MapResult,
  type Cs2PlayerMapStats,
} from "@/domain/scoring/cs2";
import { advancementCredits, swissMaxPath } from "@/domain/scoring/advancement";
import { scoreEntry } from "@/domain/entryScoring";

/** Builds a stat line with zero defaults. */
function line(p: Partial<Cs2PlayerMapStats> & { playerId: string; teamId: string }): Cs2PlayerMapStats {
  return {
    kills: 0,
    deaths: 0,
    assists: 0,
    openingKills: 0,
    multiKillRounds: { k3: 0, k4: 0, k5: 0 },
    clutchesWon: { v1: 0, v2: 0, v3: 0, v4: 0, v5: 0 },
    ...p,
  };
}

function map(n: number, rounds: number, winner: string, players: Cs2PlayerMapStats[]): Cs2MapResult {
  return { mapNumber: n, mapName: `Map ${n}`, roundsPlayed: rounds, winnerTeamId: winner, players };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

describe("CS2 scoring: worked examples from docs/04", () => {
  it("Example 1: star rifler, BO3 won 2-1 (38.3, captain 57.4)", () => {
    const P = "star";
    const series = {
      matchId: "ex1",
      format: 3 as const,
      winnerTeamId: "A",
      maps: [
        map(1, 22, "A", [line({ playerId: P, teamId: "A", kills: 22, deaths: 14, assists: 4, openingKills: 4, multiKillRounds: { k3: 1, k4: 1, k5: 0 }, clutchesWon: { v1: 0, v2: 1, v3: 0, v4: 0, v5: 0 } })]),
        map(2, 23, "B", [line({ playerId: P, teamId: "A", kills: 15, deaths: 17, assists: 3, openingKills: 2, multiKillRounds: { k3: 1, k4: 0, k5: 0 } })]),
        map(3, 30, "A", [line({ playerId: P, teamId: "A", kills: 27, deaths: 20, assists: 5, openingKills: 3, multiKillRounds: { k3: 2, k4: 0, k5: 0 }, clutchesWon: { v1: 1, v2: 0, v3: 0, v4: 0, v5: 0 } })]),
      ],
    };
    const [s] = scoreSeries(series, CS2_RULES_V1);
    expect(s!.maps.map((m) => m.eventPoints)).toEqual([44, 19, 46]);
    expect(s!.maps.map((m) => r1(m.mapScore))).toEqual([47.0, 19.0, 39.8]);
    expect(s!.maps[2]!.overtimeFactor).toBeCloseTo(0.8, 10);
    expect(s!.mapAverage).toBeCloseTo(35.2667, 3);
    expect(r1(s!.total)).toBe(38.3);
    expect(r1(s!.total * 1.5)).toBe(57.4);
  });

  it("Example 2: BO1 stomp 13-3 (39.2)", () => {
    const [s] = scoreSeries(
      {
        matchId: "ex2",
        format: 1,
        winnerTeamId: "A",
        maps: [map(1, 16, "A", [line({ playerId: "p", teamId: "A", kills: 18, deaths: 5, assists: 2, openingKills: 5, multiKillRounds: { k3: 1, k4: 0, k5: 1 } })])],
      },
      CS2_RULES_V1,
    );
    expect(s!.maps[0]!.eventPoints).toBe(43);
    expect(s!.maps[0]!.overtimeFactor).toBe(1); // short maps are never scaled up
    expect(r1(s!.total)).toBe(39.2);
  });

  it("Example 3: support, BO3 lost 0-2 (17.0)", () => {
    const [s] = scoreSeries(
      {
        matchId: "ex3",
        format: 3,
        winnerTeamId: "B",
        maps: [
          map(1, 21, "B", [line({ playerId: "sup", teamId: "A", kills: 12, deaths: 16, assists: 6, openingKills: 1 })]),
          map(2, 24, "B", [line({ playerId: "sup", teamId: "A", kills: 14, deaths: 17, assists: 5, openingKills: 1, clutchesWon: { v1: 1, v2: 0, v3: 0, v4: 0, v5: 0 } })]),
        ],
      },
      CS2_RULES_V1,
    );
    expect(s!.seriesWinPoints).toBe(0);
    expect(r1(s!.total)).toBe(17.0);
  });

  it("Example 4: BO5 final won 3-1 (44.7)", () => {
    // Map event totals 30, 22, 35, 41 — expressed as kills so event points match exactly.
    const totals = [30, 22, 35, 41];
    const winners = ["A", "B", "A", "A"];
    const [s] = scoreSeries(
      {
        matchId: "ex4",
        format: 5,
        winnerTeamId: "A",
        maps: totals.map((t, i) => map(i + 1, 22, winners[i]!, [line({ playerId: "p", teamId: "A", kills: t / 2 })])),
      },
      CS2_RULES_V1,
    );
    expect(s!.mapAverage).toBe(34.25);
    expect(r1(s!.total)).toBe(44.7);
  });

  it("Example 5: Swiss 3-0 beats 3-2 once advancement credit applies", () => {
    expect(swissMaxPath(3, 3)).toBe(5);
    const credits = advancementCredits(
      [
        { teamId: "T30", seriesPlayed: 3, forfeitWins: 0, advanced: true, finalSeriesPlayerIds: ["a"] },
        { teamId: "T32", seriesPlayed: 5, forfeitWins: 0, advanced: true, finalSeriesPlayerIds: ["b"] },
        { teamId: "T03", seriesPlayed: 3, forfeitWins: 0, advanced: false, finalSeriesPlayerIds: ["c"] },
      ],
      5,
      CS2_RULES_V1.advancementCredit,
    );
    expect(credits).toEqual([{ teamId: "T30", playerId: "a", unplayedSeries: 2, points: 50 }]);
    const threeZero = 34 + 33 + 38 + 50;
    const threeTwo = 34 + 33 + 38 + 16 + 18;
    expect(threeZero).toBe(155);
    expect(threeTwo).toBe(139);
    expect(threeZero).toBeGreaterThan(threeTwo);
  });
});

describe("CS2 scoring: rules behaviour", () => {
  it("never scales short maps up; caps overtime down", () => {
    const base = line({ playerId: "p", teamId: "A", kills: 20 });
    expect(scoreMap(base, map(1, 13, "A", []), CS2_RULES_V1).overtimeFactor).toBe(1);
    expect(scoreMap(base, map(1, 24, "A", []), CS2_RULES_V1).overtimeFactor).toBe(1);
    expect(scoreMap(base, map(1, 36, "A", []), CS2_RULES_V1).overtimeFactor).toBeCloseTo(24 / 36, 10);
  });

  it("map-win points are not scaled by the overtime cap", () => {
    const m = scoreMap(line({ playerId: "p", teamId: "A", kills: 15 }), map(1, 30, "A", []), CS2_RULES_V1);
    expect(m.cappedEventPoints).toBeCloseTo(24, 10);
    expect(m.mapScore).toBeCloseTo(27, 10);
  });

  it("a 2-1 series is not worth more than a 2-0 with the same per-map play", () => {
    const perMap = { kills: 18, deaths: 14, assists: 3 };
    const twoZero = scoreSeries(
      { matchId: "a", format: 3, winnerTeamId: "A", maps: [1, 2].map((n) => map(n, 22, "A", [line({ playerId: "p", teamId: "A", ...perMap })])) },
      CS2_RULES_V1,
    )[0]!;
    const twoOne = scoreSeries(
      { matchId: "b", format: 3, winnerTeamId: "A", maps: [1, 2, 3].map((n) => map(n, 22, n === 2 ? "B" : "A", [line({ playerId: "p", teamId: "A", ...perMap })])) },
      CS2_RULES_V1,
    )[0]!;
    expect(twoOne.total).toBeLessThanOrEqual(twoZero.total);
  });

  it("the basic rule set ignores opening kills, multi-kills and clutches", () => {
    const l = line({ playerId: "p", teamId: "A", kills: 10, deaths: 5, assists: 2, openingKills: 4, multiKillRounds: { k3: 2, k4: 1, k5: 1 }, clutchesWon: { v1: 1, v2: 1, v3: 1, v4: 0, v5: 0 } });
    expect(scoreMap(l, map(1, 20, "B", []), CS2_RULES_BASIC_V2).eventPoints).toBe(20 - 5 + 2);
  });

  it("a player who missed a map is averaged over the maps they played", () => {
    const s = scoreSeries(
      {
        matchId: "sub",
        format: 3,
        winnerTeamId: "A",
        maps: [
          map(1, 22, "A", [line({ playerId: "regular", teamId: "A", kills: 20 })]),
          map(2, 22, "A", [line({ playerId: "sub", teamId: "A", kills: 10 })]),
        ],
      },
      CS2_RULES_V1,
    );
    expect(s.find((x) => x.playerId === "regular")!.mapAverage).toBe(43);
    expect(s.find((x) => x.playerId === "sub")!.mapAverage).toBe(23);
  });

  it("is deterministic: same input, same output", () => {
    const series = {
      matchId: "d",
      format: 3 as const,
      winnerTeamId: "A",
      maps: [map(1, 27, "A", [line({ playerId: "p", teamId: "A", kills: 25, deaths: 18, assists: 4 })])],
    };
    expect(scoreSeries(series, CS2_RULES_V1)).toEqual(scoreSeries(series, CS2_RULES_V1));
  });
});

describe("entry scoring", () => {
  it("applies the captain multiplier only to the captain, per window", () => {
    const stagePoints = new Map([
      ["s3", new Map([["a", 40], ["b", 20]])],
      ["po", new Map([["a", 30], ["b", 50]])],
    ]);
    const score = scoreEntry(
      [
        { windowId: "w1", stageId: "s3", playerIds: ["a", "b"], captainId: "a" },
        { windowId: "w2", stageId: "po", playerIds: ["a", "b"], captainId: "b" },
      ],
      stagePoints,
      1.5,
    );
    expect(score.byWindow.get("w1")).toBe(40 * 1.5 + 20);
    expect(score.byWindow.get("w2")).toBe(30 + 50 * 1.5);
    expect(score.total).toBe(80 + 105);
    expect(score.captainPoints).toBe(60 + 75);
  });

  it("an eliminated player scores 0 in later windows they stay rostered for", () => {
    const score = scoreEntry(
      [{ windowId: "w2", stageId: "po", playerIds: ["gone"], captainId: "gone" }],
      new Map([["po", new Map()]]),
      1.5,
    );
    expect(score.total).toBe(0);
  });
});
