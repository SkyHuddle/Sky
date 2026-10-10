import { describe, expect, it } from "vitest";
import { simulateTournament } from "@/server/providers/demo/simulate";
import { demoUniverse } from "@/server/providers/demo/universe";
import { viewAt } from "@/server/providers/demo/view";

const u = demoUniverse();
const sim = simulateTournament({
  id: "t-test",
  slug: "test",
  name: "Test Major (Demo)",
  shortName: "Test",
  tier: "major",
  location: "Online",
  seed: "unit-test",
  startAt: new Date("2030-01-01T12:00:00Z"),
  teams: u.teams,
  players: u.players,
  edgeCases: true,
});

describe("demo universe and simulator", () => {
  it("has 32 fictional teams with 5 players each", () => {
    expect(u.teams).toHaveLength(32);
    expect(u.players).toHaveLength(160);
    expect(new Set(u.players.map((p) => p.nickname)).size).toBe(160);
  });

  it("follows the Major format: 33 Swiss series per stage, then QF (4), SF (2) and a BO5 Grand Final", () => {
    const t = sim.tournament;
    for (const s of t.stages.filter((x) => x.kind === "swiss")) {
      expect(t.matches.filter((m) => m.stage_id === s.id)).toHaveLength(33);
      expect(s.team_ids).toHaveLength(16);
    }
    const rounds = t.stages.filter((s) => s.kind === "single_elimination");
    expect(rounds.map((r) => r.name)).toEqual(["Quarterfinals", "Semifinals", "Grand Final"]);
    expect(rounds.map((r) => t.matches.filter((m) => m.stage_id === r.id).length)).toEqual([4, 2, 1]);
    expect(rounds.map((r) => r.team_ids.length)).toEqual([8, 4, 2]);
    expect(t.matches.find((m) => m.bracket_slot === "final")!.number_of_games).toBe(5);
  });

  it("produces internally consistent stats on every map", () => {
    for (const m of sim.tournament.matches) {
      for (const g of m.games) {
        const [ta, tb] = m.opponents;
        const sum = (team: string, k: "kills" | "deaths") =>
          g.players.filter((p) => p.team_id === team).reduce((s, p) => s + p[k], 0);
        expect(sum(ta, "kills")).toBe(sum(tb, "deaths"));
        expect(sum(tb, "kills")).toBe(sum(ta, "deaths"));
        const rounds = Object.values(g.rounds).reduce((a, b) => a + b, 0);
        const max = Math.max(...Object.values(g.rounds));
        expect(max >= 13).toBe(true);
        expect(rounds).toBeGreaterThanOrEqual(13);
        const firstKills = g.players.reduce((s, p) => s + p.first_kills, 0);
        expect(firstKills).toBe(rounds);
      }
    }
  });

  it("is deterministic", () => {
    const again = simulateTournament({
      id: "t-test",
      slug: "test",
      name: "Test Major (Demo)",
      shortName: "Test",
      tier: "major",
      location: "Online",
      seed: "unit-test",
      startAt: new Date("2030-01-01T12:00:00Z"),
      teams: u.teams,
      players: u.players,
      edgeCases: true,
    });
    expect(again.tournament.matches.map((m) => m.winner_id)).toEqual(sim.tournament.matches.map((m) => m.winner_id));
  });

  it("includes the documented edge cases: postponement, stand-in, correction", () => {
    expect(sim.tournament.matches.filter((m) => m.original_scheduled_at)).toHaveLength(1);
    expect(sim.tournament.players.filter((p) => p.is_stand_in)).toHaveLength(1);
    expect(sim.corrections).toHaveLength(1);
  });

  it("hides the future: nothing is finished before the event starts", () => {
    const before = viewAt(sim, new Date("2029-12-25T00:00:00Z"));
    expect(before.matches.every((m) => m.games.length === 0)).toBe(true);
    expect(before.stages[1]!.team_ids).toHaveLength(8); // only the entering teams are known
    const after = viewAt(sim, new Date("2030-02-01T00:00:00Z"));
    expect(after.matches.every((m) => m.status === "finished")).toBe(true);
    expect(after.matches).toHaveLength(106);
  });
});
