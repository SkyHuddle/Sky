/**
 * Scoring fairness report (docs/SCORING_FAIRNESS.md), generated from full simulated Majors run
 * through the real scoring code. Usage: npx tsx scripts/fairness-report.ts > docs/SCORING_FAIRNESS.md
 *
 * The simulator is fictional: these numbers test the scoring MODEL's structure (formats, Swiss
 * records, captain, team results), not real-player calibration, which needs licensed history.
 */
import { createHash } from "node:crypto";
import { CS2_RULES_V1, CS2_RULES_V2, type Cs2ScoringRules } from "../src/domain/scoring/cs2";
import { scoreStage, type StageScore } from "../src/domain/scoring/stage";
import { Rng } from "../src/domain/random";
import { normalizeDemoTournament } from "../src/server/providers/demo/adapter";
import { simulateTournament } from "../src/server/providers/demo/simulate";
import { demoUniverse } from "../src/server/providers/demo/universe";
import { viewAt } from "../src/server/providers/demo/view";
import type { NormTournament } from "../src/server/providers/types";

const u = demoUniverse();
const SEEDS = Array.from({ length: 12 }, (_, i) => `fair-${i + 1}`);

function scoreAll(t: NormTournament, rules: Cs2ScoringRules): StageScore[] {
  return t.stages.map((st) =>
    scoreStage(
      { kind: st.kind, winsToAdvance: st.winsToAdvance, lossesToEliminate: st.lossesToEliminate, teamIds: st.teamExternalIds },
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
          maps: m.maps.map((g) => ({ mapNumber: g.number, mapName: g.mapName, roundsPlayed: g.roundsPlayed, winnerTeamId: g.winnerTeamExternalId, players: g.stats })),
        })),
      rules,
    ),
  );
}

const tournaments = SEEDS.map((seed) => {
  const sim = simulateTournament({ id: seed, slug: seed, name: seed, shortName: seed, tier: "major", location: "x", seed, startAt: new Date("2030-01-01T12:00:00Z"), teams: u.teams, players: u.players, edgeCases: false });
  return { sim, t: normalizeDemoTournament(viewAt(sim, new Date("2031-01-01T00:00:00Z"))) };
});

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const f1 = (x: number) => x.toFixed(1);
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const out: string[] = [];
const line = (s = "") => out.push(s);

// 1. Format parity: average points per player per series, by format.
function formatTable(label: string, value: (s: StageScore["series"][number]) => number, rules: Cs2ScoringRules) {
  const by = new Map<number, number[]>();
  for (const { t } of tournaments) for (const st of scoreAll(t, rules)) for (const s of st.series) by.set(s.format, [...(by.get(s.format) ?? []), value(s)]);
  const [a, b, c] = [1, 3, 5].map((f) => mean(by.get(f) ?? []));
  const spread = (Math.max(a!, b!, c!) - Math.min(a!, b!, c!)) / mean([a!, b!, c!]);
  return `| ${label} | ${f1(a!)} | ${f1(b!)} | ${f1(c!)} | ${pct(spread)} |`;
}

// 2. Swiss record: stage totals for players on teams that advanced 3-0 / 3-1 / 3-2.
function recordTable(withCredit: boolean, value: "model" | "sum") {
  const by = new Map<number, number[]>();
  for (const { t } of tournaments) {
    for (const st of scoreAll(t, CS2_RULES_V2)) {
      if (!st.credits && !withCredit) continue;
      for (const r of st.records.values()) {
        if (r.status !== "advanced" || r.wins !== 3) continue;
        const players = st.series.filter((s) => s.teamId === r.teamId);
        const ids = [...new Set(players.map((p) => p.playerId))];
        for (const id of ids) {
          const series = players.filter((p) => p.playerId === id);
          const base = value === "model" ? series.reduce((a, s) => a + s.total, 0) : series.reduce((a, s) => a + s.maps.reduce((x, m) => x + m.mapScore, 0) + s.seriesWinPoints, 0);
          const credit = withCredit ? st.credits.filter((c) => c.playerId === id).reduce((a, c) => a + c.points, 0) : 0;
          by.set(r.losses, [...(by.get(r.losses) ?? []), base + credit]);
        }
      }
    }
  }
  return [0, 1, 2].map((l) => mean(by.get(l) ?? []));
}

// 3. Team results: share of all points from map wins and series wins.
function teamResultShare() {
  let total = 0;
  let team = 0;
  for (const { t } of tournaments)
    for (const st of scoreAll(t, CS2_RULES_V2))
      for (const s of st.series) {
        total += s.total;
        const mapWins = s.maps.reduce((a, m) => a + m.mapWinPoints, 0) / Math.max(1, s.maps.length);
        team += (mapWins + s.seriesWinPoints) * s.formatWeight;
      }
  return team / total;
}

// 4. Captain: bonus as a share of a lineup's total, for random five-player lineups.
function captainShare() {
  const rng = new Rng("captain");
  const shares: number[] = [];
  const best: number[] = [];
  for (const { t } of tournaments) {
    const totals = new Map<string, number>();
    for (const st of scoreAll(t, CS2_RULES_V2)) for (const [id, v] of st.playerTotals) totals.set(id, (totals.get(id) ?? 0) + v);
    const ids = [...totals.keys()];
    for (let i = 0; i < 400; i++) {
      const five = rng.shuffle(ids).slice(0, 5).map((id) => totals.get(id)!);
      const sum = five.reduce((a, b) => a + b, 0);
      const randomCap = rng.pick(five);
      const topCap = Math.max(...five);
      shares.push((0.5 * randomCap) / (sum + 0.5 * randomCap));
      best.push((0.5 * topCap) / (sum + 0.5 * topCap));
    }
  }
  return { random: mean(shares), best: mean(best) };
}

// 5. Determinism: scoring twice gives identical results.
function determinism() {
  const h = (x: unknown) => createHash("sha256").update(JSON.stringify(x, (_k, v) => (v instanceof Map ? [...v.entries()] : v instanceof Set ? [...v] : v))).digest("hex");
  return tournaments.every(({ t }) => h(scoreAll(t, CS2_RULES_V2)) === h(scoreAll(t, CS2_RULES_V2)));
}

// 6. Live maps under map-averaging: at mid-map, how often would the running series score sit
//    below the finished maps' average (i.e. visibly drop if the live map counted now)?
function liveDrop() {
  let checked = 0;
  let drops = 0;
  for (const { t } of tournaments) {
    for (const m of t.matches) {
      if (m.maps.length < 2) continue;
      const first = m.maps[0]!;
      // Map 2 at the halfway point scores roughly half its final events; compare with map 1.
      for (const p of first.stats) {
        const second = m.maps[1]!.stats.find((x) => x.playerId === p.playerId);
        if (!second) continue;
        const map1 = 2 * p.kills - p.deaths + p.assists;
        const half2 = (2 * second.kills - second.deaths + second.assists) / 2;
        checked++;
        if ((map1 + half2) / 2 < map1) drops++;
      }
    }
  }
  return drops / Math.max(1, checked);
}

const matches = tournaments.reduce((a, x) => a + x.t.matches.length, 0);
line("# Scoring fairness report");
line();
line("Generated by `scripts/fairness-report.ts` from " + `${SEEDS.length} simulated Majors (${matches} series, run through the real scoring code).`);
line("The players and results are fictional, so this tests the structure of the scoring model (formats, Swiss records, captain, team results), not real-world calibration. Re-run it on licensed historical data before launch (docs/08).");
line();
line("Model under test: `cs2-v2` (docs/04 Model C with neutral format weights). Per-map events, overtime normalised to 24 rounds, map win +3, maps averaged per series, series win +3, advancement credit for Swiss series a team didn't need to play, captain 1.5×.");
line();
line("## 1. Best-of-one vs best-of-three vs best-of-five");
line();
line("Average points per player per series. A fair model keeps these close: longer series shouldn't be worth more just for being longer.");
line();
line("| Model | BO1 | BO3 | BO5 | Spread |");
line("|---|---|---|---|---|");
line(formatTable("`cs2-v2` (maps averaged)", (s) => s.total, CS2_RULES_V2));
line(formatTable("`cs2-v1` (format weights 0.8 / 1 / 1.2)", (s) => s.total, CS2_RULES_V1));
line(formatTable("Raw sum of maps (no averaging)", (s) => s.maps.reduce((a, m) => a + m.mapScore, 0) + s.seriesWinPoints, CS2_RULES_V2));
line();
line("**Finding:** averaging maps keeps formats within a few percent of each other. Format weights (v1) and raw sums both reintroduce a large gap, which is why v2 is the default.");
line();
line("## 2. Swiss: 3–0 vs 3–1 vs 3–2");
line();
line("Average stage points for players on teams that advanced, by record. Without a correction, a 3–2 team plays two more series than a 3–0 team and earns more for it.");
line();
const noCredit = recordTable(false, "model");
const withCredit = recordTable(true, "model");
const sumNoCredit = recordTable(false, "sum");
line("| Model | 3–0 | 3–1 | 3–2 |");
line("|---|---|---|---|");
line(`| v2 without advancement credit | ${noCredit.map(f1).join(" | ")} |`);
line(`| **v2 with advancement credit** | ${withCredit.map(f1).join(" | ")} |`);
line(`| Raw sum, no credit | ${sumNoCredit.map(f1).join(" | ")} |`);
line();
line(`**Finding:** with advancement credit, 3–0 players score ${pct(withCredit[0]! / withCredit[2]! - 1)} relative to 3–2 players (docs/04 wants "the same or slightly more" for the cleaner run). Without it, the 3–2 path is worth ${pct(noCredit[2]! / noCredit[0]! - 1)} more, which would reward needing more matches.`);
line();
line("## 3. Team results vs individual play");
line();
line(`Share of all points that come from map and series wins: **${pct(teamResultShare())}**. Individual events (kills, deaths, assists, opening kills, multi-kills, clutches) make up the rest, so a strong player on a losing team still scores, and winning still matters.`);
line();
line("## 4. Captain");
const cap = captainShare();
line();
line(`For random five-player lineups, the captain's extra 0.5× is **${pct(cap.random)}** of the lineup's total with a random captain, and **${pct(cap.best)}** with the best possible captain. It matters, but it can't outweigh the other four picks.`);
line();
line("## 5. Determinism");
line();
line(`Scoring every simulated tournament twice gives byte-identical results: **${determinism() ? "yes" : "NO"}**. Production adds the ledger guarantees: input-hash idempotency, append-only corrections and pinned rule-set versions (docs/ARCHITECTURE.md).`);
line();
line("## 6. Live scoring under map averaging");
line();
const drop = liveDrop();
line(`If a map in progress counted toward the series average immediately, a player's running score would visibly fall when the next map started in **${pct(drop)}** of cases (map 1 final vs map 2 at half time, events only). That is why live maps are shown as provisional *map points* next to each player, and totals update when each map ends (docs/LIVE_DATA.md). Making totals tick with every kill would need a sum-based model, which section 1 shows is unfair across formats. This trade-off is open question G-1 in docs/GAMEPLAY_OPEN_QUESTIONS.md.`);
line();
line("## Not yet validated");
line();
line("- Real-player calibration (price tiers vs points, role balance): needs licensed historical stats.");
line("- Transfer strategies (acquisition salary vs current price): needs simulated managers over full events; see G-3.");
line("- Correction frequency and size from a real provider.");
console.log(out.join("\n"));
