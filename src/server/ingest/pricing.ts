import { and, eq, inArray, lt } from "drizzle-orm";
import { scoreMap, type Cs2ScoringRules } from "@/domain/scoring/cs2";
import type { Db } from "../db/connect";
import * as s from "../db/schema";

/**
 * Price generation (docs/09 CO-3): $100k–$300k in $5k steps, fixed for the contest.
 *
 * 1. History: average fantasy map score (this rule set) over every map the player played before
 *    the tournament began. Needs at least 5 maps to count.
 * 2. Prior: where the team enters the tournament (later entry = higher seed = stronger).
 * 3. Blend (history 80%, prior 20%; prior only when history is thin), rank the players in the
 *    pool being priced, and map the percentile onto the price range. Stars land near $290k, so a
 *    five-star roster is impossible under the $1M cap.
 *
 * Each stage window prices its own pool (opts.teamIds) across the full range, using history up to
 * the window opening (opts.before). Pricing every player on one global scale left Stage 1 pools
 * (the 16 lowest seeds) topping out at $185k, so the cap never bound. See docs/10.
 */

export interface PriceRow {
  playerId: string;
  price: number;
  avgPoints: number;
  mapsSampled: number;
}

const MIN_PRICE = 100_000;
const MAX_PRICE = 290_000;
const round5k = (n: number) => Math.round(n / 5000) * 5000;

export async function computePrices(
  db: Db,
  tournamentId: string,
  rules: Cs2ScoringRules,
  opts: { teamIds?: string[]; before?: Date } = {},
): Promise<PriceRow[]> {
  const [t] = await db.select().from(s.tournaments).where(eq(s.tournaments.id, tournamentId));
  if (!t) throw new Error("tournament not found");
  const stageRows = await db.select().from(s.stages).where(eq(s.stages.tournamentId, tournamentId));
  const st = stageRows.length
    ? await db.select().from(s.stageTeams).where(inArray(s.stageTeams.stageId, stageRows.map((x) => x.id)))
    : [];
  const posOf = new Map(stageRows.map((x) => [x.id, x.position]));
  // Team prior: entering at a later stage means a better seed. Within a stage, lower seed number is better.
  const teamPrior = new Map<string, number>();
  for (const row of st.filter((x) => x.entering)) {
    const pos = posOf.get(row.stageId) ?? 1;
    teamPrior.set(row.teamId, pos * 100 - row.seed);
  }
  const teamIds = opts.teamIds ? [...teamPrior.keys()].filter((id) => opts.teamIds!.includes(id)) : [...teamPrior.keys()];
  if (teamIds.length === 0) return [];

  const members = await db
    .select({ playerId: s.playerTeamMemberships.playerId, teamId: s.playerTeamMemberships.teamId })
    .from(s.playerTeamMemberships)
    .innerJoin(s.players, eq(s.players.id, s.playerTeamMemberships.playerId))
    .where(and(inArray(s.playerTeamMemberships.teamId, teamIds), eq(s.players.isStandIn, false)));

  // History before this tournament.
  const hist = await db
    .select({
      playerId: s.playerMapStats.playerId,
      teamId: s.playerMapStats.teamId,
      version: s.playerMapStats.statsVersion,
      mapVersion: s.maps.statsVersion,
      kills: s.playerMapStats.kills,
      deaths: s.playerMapStats.deaths,
      assists: s.playerMapStats.assists,
      openingKills: s.playerMapStats.openingKills,
      k3: s.playerMapStats.k3,
      k4: s.playerMapStats.k4,
      k5: s.playerMapStats.k5,
      c1: s.playerMapStats.c1,
      c2: s.playerMapStats.c2,
      c3: s.playerMapStats.c3,
      c4: s.playerMapStats.c4,
      c5: s.playerMapStats.c5,
      roundsPlayed: s.maps.roundsPlayed,
      winnerTeamId: s.maps.winnerTeamId,
      number: s.maps.number,
      mapName: s.maps.mapName,
    })
    .from(s.playerMapStats)
    .innerJoin(s.maps, eq(s.maps.id, s.playerMapStats.mapId))
    .where(and(inArray(s.playerMapStats.playerId, members.map((m) => m.playerId)), lt(s.maps.finishedAt, opts.before ?? t.beginAt)));

  const sums = new Map<string, { total: number; n: number }>();
  for (const h of hist) {
    if (h.version !== h.mapVersion) continue; // only the current stats version
    const ms = scoreMap(
      {
        playerId: h.playerId,
        teamId: h.teamId,
        kills: h.kills,
        deaths: h.deaths,
        assists: h.assists,
        openingKills: h.openingKills,
        multiKillRounds: { k3: h.k3, k4: h.k4, k5: h.k5 },
        clutchesWon: { v1: h.c1, v2: h.c2, v3: h.c3, v4: h.c4, v5: h.c5 },
      },
      { mapNumber: h.number, mapName: h.mapName, roundsPlayed: h.roundsPlayed, winnerTeamId: h.winnerTeamId },
      rules,
    );
    const cur = sums.get(h.playerId) ?? { total: 0, n: 0 };
    cur.total += ms.mapScore;
    cur.n += 1;
    sums.set(h.playerId, cur);
  }

  const priors = members.map((m) => teamPrior.get(m.teamId) ?? 0);
  const pMin = Math.min(...priors);
  const pMax = Math.max(...priors);
  const avgs = [...sums.values()].filter((x) => x.n >= 5).map((x) => x.total / x.n);
  const aMin = avgs.length ? Math.min(...avgs) : 0;
  const aMax = avgs.length ? Math.max(...avgs) : 1;

  const scored = members.map((m) => {
    const prior = pMax > pMin ? ((teamPrior.get(m.teamId) ?? pMin) - pMin) / (pMax - pMin) : 0.5;
    const h = sums.get(m.playerId);
    const avg = h && h.n > 0 ? h.total / h.n : 0;
    const hasHistory = !!h && h.n >= 5 && aMax > aMin;
    const histNorm = hasHistory ? (avg - aMin) / (aMax - aMin) : 0;
    return {
      playerId: m.playerId,
      score: hasHistory ? 0.8 * histNorm + 0.2 * prior : prior,
      avg,
      n: h?.n ?? 0,
    };
  });
  scored.sort((a, b) => a.score - b.score || a.playerId.localeCompare(b.playerId));
  const n = scored.length;
  return scored.map((x, i) => {
    const pct = n > 1 ? i / (n - 1) : 0.5;
    return {
      playerId: x.playerId,
      price: round5k(MIN_PRICE + (MAX_PRICE - MIN_PRICE) * Math.pow(pct, 1.15)),
      avgPoints: x.avg,
      mapsSampled: x.n,
    };
  });
}
