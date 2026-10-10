import { describe, expect, it } from "vitest";
import {
  addBlockReason,
  countTransfers,
  summarizeRoster,
  validateRoster,
  validateTransfers,
} from "@/domain/rules";
import { DEFAULT_CS2_CONTEST_RULES, type PoolPlayer } from "@/domain/types";
import { rankEntries, percentileLabel } from "@/domain/standings";
import { runAutopilot, type AutopilotCandidate } from "@/domain/autopilot";

const rules = DEFAULT_CS2_CONTEST_RULES;
const P = (id: string, teamId: string, price: number): PoolPlayer => ({ id, teamId, price });
const pool = new Map(
  [
    P("a1", "A", 260_000),
    P("a2", "A", 200_000),
    P("a3", "A", 150_000),
    P("b1", "B", 240_000),
    P("b2", "B", 180_000),
    P("c1", "C", 220_000),
    P("c2", "C", 120_000),
    P("d1", "D", 100_000),
    P("e1", "E", 300_000),
  ].map((p) => [p.id, p]),
);

describe("roster validation", () => {
  it("accepts a valid roster", () => {
    expect(validateRoster({ playerIds: ["a1", "b2", "c1", "c2", "d1"], captainId: "a1" }, pool, rules)).toEqual([]);
  });

  it("rejects a roster over the salary cap", () => {
    const errs = validateRoster({ playerIds: ["e1", "a1", "b1", "c1", "a2"], captainId: "e1" }, pool, rules);
    expect(errs.map((e) => e.code)).toContain("OVER_CAP");
  });

  it("rejects more than two players from one team", () => {
    const errs = validateRoster({ playerIds: ["a1", "a2", "a3", "d1", "c2"], captainId: "a1" }, pool, rules);
    expect(errs.map((e) => e.code)).toContain("TEAM_LIMIT");
  });

  it("requires exactly five players, a captain on the roster, and eligible players", () => {
    expect(validateRoster({ playerIds: ["a1"], captainId: "a1" }, pool, rules).map((e) => e.code)).toContain("ROSTER_SIZE");
    expect(validateRoster({ playerIds: ["a1", "b2", "c1", "c2", "d1"], captainId: null }, pool, rules).map((e) => e.code)).toContain("CAPTAIN_REQUIRED");
    expect(validateRoster({ playerIds: ["a1", "b2", "c1", "c2", "d1"], captainId: "e1" }, pool, rules).map((e) => e.code)).toContain("CAPTAIN_NOT_IN_ROSTER");
    expect(validateRoster({ playerIds: ["a1", "b2", "c1", "c2", "zz"], captainId: "a1" }, pool, rules).map((e) => e.code)).toContain("INELIGIBLE_PLAYER");
    expect(validateRoster({ playerIds: ["a1", "a1", "c1", "c2", "d1"], captainId: "a1" }, pool, rules).map((e) => e.code)).toContain("DUPLICATE_PLAYER");
  });

  it("explains why a player can't be added", () => {
    expect(addBlockReason(pool.get("a3")!, ["a1", "a2"], pool, rules)?.code).toBe("TEAM_LIMIT");
    expect(addBlockReason(pool.get("e1")!, ["a1", "b1", "c1", "a2"], pool, rules)?.code).toBe("OVER_CAP");
    expect(addBlockReason(pool.get("d1")!, ["a1", "b1", "c1", "a2", "c2"], pool, rules)?.code).toBe("ROSTER_SIZE");
    expect(addBlockReason(pool.get("d1")!, ["a1"], pool, rules)).toBeNull();
  });

  it("summarises budget and average per open slot", () => {
    const s = summarizeRoster(["a1", "b1"], pool, rules);
    expect(s.salaryUsed).toBe(500_000);
    expect(s.salaryRemaining).toBe(500_000);
    expect(s.averagePerOpenSlot).toBeCloseTo(500_000 / 3);
  });
});

describe("transfers", () => {
  it("replacing eliminated players is free; other changes count", () => {
    const eligible = new Set(["a1", "b1", "c1", "d1", "e1", "b2"]);
    const count = countTransfers(["a1", "b1", "x1", "x2", "c1"], ["a1", "b2", "d1", "e1", "c1"], eligible);
    expect(count.free.sort()).toEqual(["x1", "x2"]);
    expect(count.discretionary).toEqual(["b1"]);
    expect(validateTransfers(count, rules)).toBeNull();
  });

  it("rejects more than two discretionary transfers", () => {
    const eligible = new Set(["a1", "b1", "c1", "d1", "e1", "a2", "b2", "c2"]);
    const count = countTransfers(["a1", "b1", "c1", "d1", "e1"], ["a2", "b2", "c2", "d1", "e1"], eligible);
    expect(validateTransfers(count, rules)?.code).toBe("TRANSFER_LIMIT");
  });
});

describe("standings", () => {
  it("ranks by points, then captain points, transfers, submission time; shares exact ties", () => {
    const ranked = rankEntries([
      { entryId: "x", total: 100, captainPoints: 30, transfersUsed: 0, submittedAt: 5 },
      { entryId: "y", total: 100, captainPoints: 40, transfersUsed: 2, submittedAt: 9 },
      { entryId: "z", total: 120, captainPoints: 10, transfersUsed: 0, submittedAt: 1 },
      { entryId: "w", total: 100, captainPoints: 30, transfersUsed: 0, submittedAt: 5 },
      { entryId: "v", total: 100.0000001, captainPoints: 30, transfersUsed: 1, submittedAt: 1 },
    ]);
    expect(ranked.map((r) => [r.entryId, r.rank])).toEqual([
      ["z", 1],
      ["y", 2],
      ["w", 3],
      ["x", 3],
      ["v", 5],
    ]);
  });

  it("labels percentiles", () => {
    expect(percentileLabel(1, 1000)).toBe("Top 0.1%");
    expect(percentileLabel(40, 1000)).toBe("Top 4%");
    expect(percentileLabel(500, 1000)).toBe("Top 50%");
  });
});

describe("autopilot", () => {
  const C = (id: string, teamId: string, price: number, ownership: number, averagePoints = 20): AutopilotCandidate => ({ id, teamId, price, ownership, averagePoints });
  const live: AutopilotCandidate[] = [
    C("k1", "K", 250_000, 0.4),
    C("k2", "K", 150_000, 0.2),
    C("l1", "L", 220_000, 0.5),
    C("l2", "L", 120_000, 0.1),
    C("m1", "M", 200_000, 0.6),
    C("m2", "M", 100_000, 0.05),
    C("n1", "N", 180_000, 0.3),
  ];

  it("does nothing when nobody is eliminated", () => {
    const r = runAutopilot({ playerIds: ["k1", "l1", "m1", "n1", "k2"], captainId: "k1", pool: live, rules });
    expect(r.changed).toBe(false);
  });

  it("replaces eliminated players with the most-picked legal players and keeps the rest", () => {
    const r = runAutopilot({ playerIds: ["k1", "gone1", "l1", "gone2", "n1"], captainId: "gone1", pool: live, rules });
    expect(r.playerIds.slice(0, 3)).toEqual(["k1", "l1", "n1"]);
    // m1 (60%) first; then the next most-picked that keeps the roster legal and affordable.
    expect(r.replacements[0]).toEqual({ outPlayerId: "gone1", inPlayerId: "m1", reason: "eliminated" });
    const spent = r.playerIds.reduce((s, id) => s + live.find((c) => c.id === id)!.price, 0);
    expect(spent).toBeLessThanOrEqual(rules.salaryCap);
    const teams = r.playerIds.map((id) => live.find((c) => c.id === id)!.teamId);
    for (const t of new Set(teams)) expect(teams.filter((x) => x === t).length).toBeLessThanOrEqual(2);
    // Captain was eliminated: passes to the highest-priced remaining player.
    expect(r.captainReassignedFrom).toBe("gone1");
    expect(r.captainId).toBe("k1");
    expect(r.unfilledSlots).toBe(0);
  });

  it("leaves a slot empty and reports it when no legal replacement exists", () => {
    const tiny = [C("k1", "K", 900_000, 0.9), C("x9", "X", 200_000, 0.8)];
    const r = runAutopilot({ playerIds: ["k1", "gone"], captainId: "k1", pool: tiny, rules: { ...rules, rosterSize: 2 } });
    expect(r.replacements).toEqual([{ outPlayerId: "gone", inPlayerId: null, reason: "eliminated" }]);
    expect(r.unfilledSlots).toBe(1);
    expect(r.playerIds).toEqual(["k1"]);
  });
});
