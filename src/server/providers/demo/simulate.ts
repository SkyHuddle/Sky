import { Rng } from "@/domain/random";
import { isDeciderMatch, MAJOR_SWISS, swissPairings, type SwissRecord } from "@/domain/swiss";
import type { DemoPlayerSeed, DemoRole, DemoTeamSeed } from "./universe";
import type {
  DemoApiGame,
  DemoApiMatch,
  DemoApiPlayer,
  DemoApiPlayerGameStats,
  DemoApiStage,
  DemoApiTeam,
  DemoApiTournament,
} from "./payload";

/**
 * Simulates a full CS2 Major-format tournament (three 16-team Swiss stages, then Quarterfinals,
 * Semifinals and a Grand Final)
 * round by round, so every stat is internally consistent: team kills equal opponent deaths,
 * opening kills are first kills, multi-kills and clutches come from actual simulated rounds.
 *
 * The output is the COMPLETE timeline. `viewAt()` in view.ts hides everything that hasn't
 * happened yet relative to a given clock, which is what the provider adapter sees.
 */

const MAPS = ["Mirage", "Inferno", "Nuke", "Ancient", "Anubis", "Dust2", "Train"];
const HOUR = 3_600_000;
const MAP_DURATION = 55 * 60_000;

export interface SimulationOptions {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  tier: "major" | "tier1" | "other";
  location: string;
  seed: string;
  startAt: Date;
  teams: DemoTeamSeed[]; // 32, ordered by seed
  players: DemoPlayerSeed[];
  /** Demo edge cases (docs/09 SC-6): one postponed match, one temporary stand-in, one stats correction. */
  edgeCases: boolean;
}

export interface SimulatedCorrection {
  gameId: string;
  matchId: string;
  releasedAt: string;
  statsVersion: number;
  players: DemoApiPlayerGameStats[];
}

export interface SimulatedTournament {
  tournament: DemoApiTournament;
  corrections: SimulatedCorrection[];
  /** gameId -> scoreboard after each round, for replaying maps in progress. */
  rounds: Map<string, RoundSnapshot[]>;
}

interface SimPlayer {
  id: string;
  teamId: string;
  role: DemoRole;
  skill: number;
}

const KILL_ROLE: Record<DemoRole, number> = { AWPer: 1.2, Entry: 1.05, Rifler: 1.0, Support: 0.85, IGL: 0.8 };
const DEATH_ROLE: Record<DemoRole, number> = { AWPer: 0.85, Entry: 1.25, Rifler: 1.0, Support: 1.0, IGL: 1.05 };
const WINNER_DEATHS = [0.18, 0.27, 0.25, 0.18, 0.12];

function emptyStats(p: SimPlayer): DemoApiPlayerGameStats {
  return {
    player_id: p.id,
    team_id: p.teamId,
    kills: 0,
    deaths: 0,
    assists: 0,
    first_kills: 0,
    multikills: { "3k": 0, "4k": 0, "5k": 0 },
    clutches_won: { "1v1": 0, "1v2": 0, "1v3": 0, "1v4": 0, "1v5": 0 },
  };
}

/** Simulates one round; mutates stats. Returns the winning side ("a" | "b"). */
function simulateRound(
  rng: Rng,
  a: SimPlayer[],
  b: SimPlayer[],
  pA: number,
  stats: Map<string, DemoApiPlayerGameStats>,
): "a" | "b" {
  const winner: "a" | "b" = rng.chance(pA) ? "a" : "b";
  const W = winner === "a" ? a : b;
  const L = winner === "a" ? b : a;
  const wDeaths = rng.weighted([0, 1, 2, 3, 4], (n) => WINNER_DEATHS[n]!);
  const lDeaths = rng.chance(0.85) ? 5 : 4;

  const seq: Array<"W" | "L"> = rng.shuffle([
    ...Array<"W">(wDeaths).fill("W"),
    ...Array<"L">(lDeaths).fill("L"),
  ]);
  if (lDeaths === 5 && seq[seq.length - 1] !== "L") {
    const lastL = seq.lastIndexOf("L");
    [seq[lastL], seq[seq.length - 1]] = [seq[seq.length - 1]!, seq[lastL]!];
  }

  const aliveW = new Set(W.map((p) => p.id));
  const aliveL = new Set(L.map((p) => p.id));
  const roundKills = new Map<string, number>();
  let clutcher: string | null = null;
  let clutchVs = 0;

  seq.forEach((side, i) => {
    const victims = side === "W" ? W.filter((p) => aliveW.has(p.id)) : L.filter((p) => aliveL.has(p.id));
    const killers = side === "W" ? L.filter((p) => aliveL.has(p.id)) : W.filter((p) => aliveW.has(p.id));
    const first = i === 0;
    const victim = rng.weighted(victims, (p) => DEATH_ROLE[p.role] * (1.6 - p.skill) * (first && p.role === "Entry" ? 1.8 : 1));
    const killer = rng.weighted(killers, (p) => KILL_ROLE[p.role] * p.skill ** 3 * (first && p.role === "Entry" ? 1.8 : 1));
    (side === "W" ? aliveW : aliveL).delete(victim.id);

    const ks = stats.get(killer.id)!;
    const vs = stats.get(victim.id)!;
    ks.kills++;
    vs.deaths++;
    if (first) ks.first_kills++;
    roundKills.set(killer.id, (roundKills.get(killer.id) ?? 0) + 1);

    if (rng.chance(0.28)) {
      const mates = (side === "W" ? L : W).filter(
        (p) => p.id !== killer.id && (side === "W" ? aliveL : aliveW).has(p.id),
      );
      if (mates.length > 0) stats.get(rng.pick(mates).id)!.assists++;
    }

    if (!clutcher && aliveW.size === 1 && aliveL.size >= 1) {
      clutcher = [...aliveW][0]!;
      clutchVs = aliveL.size;
    }
  });

  for (const [pid, n] of roundKills) {
    const s = stats.get(pid)!;
    if (n === 3) s.multikills["3k"]++;
    if (n === 4) s.multikills["4k"]++;
    if (n >= 5) s.multikills["5k"]++;
  }
  if (clutcher && clutchVs >= 1) {
    const key = `1v${Math.min(5, clutchVs)}` as keyof DemoApiPlayerGameStats["clutches_won"];
    stats.get(clutcher)!.clutches_won[key]++;
  }
  return winner;
}

function simulateMap(
  rng: Rng,
  a: SimPlayer[],
  b: SimPlayer[],
  teamA: string,
  teamB: string,
): { roundsA: number; roundsB: number; winner: string; stats: DemoApiPlayerGameStats[]; rounds: RoundSnapshot[] } {
  const stats = new Map<string, DemoApiPlayerGameStats>();
  const rounds: RoundSnapshot[] = [];
  for (const p of [...a, ...b]) stats.set(p.id, emptyStats(p));
  const strength = (ps: SimPlayer[]) => ps.reduce((s, p) => s + p.skill, 0) / ps.length;
  const formA = (rng.next() - 0.5) * 0.12;
  const formB = (rng.next() - 0.5) * 0.12;
  const diff = strength(a) + formA - (strength(b) + formB);
  const pA = 1 / (1 + Math.exp(-diff * 3.2));

  let ra = 0;
  let rb = 0;
  const play = () => {
    if (simulateRound(rng, a, b, pA, stats) === "a") ra++;
    else rb++;
    rounds.push({ roundsA: ra, roundsB: rb, packed: pack([...stats.values()]) });
  };
  // Regulation: first to 13 of 24 rounds.
  while (ra < 13 && rb < 13 && !(ra === 12 && rb === 12)) play();
  // Overtime: MR3 periods. First to 4 rounds within a period wins; 3-3 starts another period.
  while (ra === rb) {
    const startA = ra;
    const startB = rb;
    while (ra - startA < 4 && rb - startB < 4 && !(ra - startA === 3 && rb - startB === 3)) play();
  }
  return { roundsA: ra, roundsB: rb, winner: ra > rb ? teamA : teamB, stats: [...stats.values()], rounds };
}

/**
 * The scoreboard after each round of a map, packed compactly (12 numbers per player), so the
 * replay can show a map in progress exactly as it unfolded. Player order matches the final stats.
 */
export interface RoundSnapshot {
  roundsA: number;
  roundsB: number;
  packed: Int16Array;
}

const FIELDS = 12;
function pack(list: DemoApiPlayerGameStats[]): Int16Array {
  const out = new Int16Array(list.length * FIELDS);
  list.forEach((p, i) => {
    out.set(
      [p.kills, p.deaths, p.assists, p.first_kills, p.multikills["3k"], p.multikills["4k"], p.multikills["5k"], p.clutches_won["1v1"], p.clutches_won["1v2"], p.clutches_won["1v3"], p.clutches_won["1v4"], p.clutches_won["1v5"]],
      i * FIELDS,
    );
  });
  return out;
}

/** Rebuilds the scoreboard at a round snapshot, using the final stat lines for ids and order. */
export function unpackSnapshot(finalStats: DemoApiPlayerGameStats[], snap: RoundSnapshot): DemoApiPlayerGameStats[] {
  return finalStats.map((p, i) => {
    const v = (k: number) => snap.packed[i * FIELDS + k]!;
    return {
      player_id: p.player_id,
      team_id: p.team_id,
      kills: v(0),
      deaths: v(1),
      assists: v(2),
      first_kills: v(3),
      multikills: { "3k": v(4), "4k": v(5), "5k": v(6) },
      clutches_won: { "1v1": v(7), "1v2": v(8), "1v3": v(9), "1v4": v(10), "1v5": v(11) },
    };
  });
}

export function simulateTournament(opts: SimulationOptions): SimulatedTournament {
  const rng = new Rng(opts.seed);
  const teamById = new Map(opts.teams.map((t) => [t.id, t]));
  const seedOf = new Map(opts.teams.map((t, i) => [t.id, i + 1]));
  const rosterOf = (teamId: string): SimPlayer[] =>
    opts.players
      .filter((p) => p.teamId === teamId && !p.isStandIn)
      .map((p) => ({ id: p.id, teamId, role: p.role, skill: p.skill }));

  const t0 = opts.startAt.getTime();
  const day = 24 * HOUR;
  const matches: DemoApiMatch[] = [];
  const corrections: SimulatedCorrection[] = [];
  const extraPlayers: DemoApiPlayer[] = [];
  const roundLog = new Map<string, RoundSnapshot[]>();
  let matchSeq = 0;

  const playSeries = (
    stageId: string,
    round: number,
    slot: string,
    format: 1 | 3 | 5,
    teamA: string,
    teamB: string,
    scheduledAt: number,
    lineupOverride?: Map<string, SimPlayer[]>,
  ): DemoApiMatch => {
    matchSeq++;
    const id = `${opts.id}-m${String(matchSeq).padStart(3, "0")}`;
    const need = Math.ceil(format / 2);
    const mapPool = rng.shuffle(MAPS);
    const games: DemoApiGame[] = [];
    let wa = 0;
    let wb = 0;
    let at = scheduledAt;
    const pa = lineupOverride?.get(teamA) ?? rosterOf(teamA);
    const pb = lineupOverride?.get(teamB) ?? rosterOf(teamB);
    while (wa < need && wb < need) {
      const sim = simulateMap(rng, pa, pb, teamA, teamB);
      at += MAP_DURATION + rng.int(-8, 15) * 60_000;
      if (sim.winner === teamA) wa++;
      else wb++;
      roundLog.set(`${id}-g${games.length + 1}`, sim.rounds);
      games.push({
        id: `${id}-g${games.length + 1}`,
        position: games.length + 1,
        map: mapPool[games.length]!,
        rounds: { [teamA]: sim.roundsA, [teamB]: sim.roundsB },
        winner_id: sim.winner,
        finished_at: new Date(at).toISOString(),
        stats_version: 1,
        players: sim.stats,
      });
    }
    const m: DemoApiMatch = {
      id,
      stage_id: stageId,
      round,
      bracket_slot: slot,
      number_of_games: format,
      scheduled_at: new Date(scheduledAt).toISOString(),
      original_scheduled_at: null,
      status: "finished",
      opponents: [teamA, teamB],
      winner_id: wa > wb ? teamA : teamB,
      games,
    };
    matches.push(m);
    return m;
  };

  const ids = opts.teams.map((t) => t.id);
  const stageDefs = [
    { key: "s1", name: "Stage 1", short: "Stage 1", dayOffset: 0, entering: ids.slice(16, 32), allBo3: false },
    { key: "s2", name: "Stage 2", short: "Stage 2", dayOffset: 4, entering: ids.slice(8, 16), allBo3: false },
    { key: "s3", name: "Stage 3", short: "Stage 3", dayOffset: 8, entering: ids.slice(0, 8), allBo3: true },
  ];
  const stages: DemoApiStage[] = [];
  let advancers: string[] = [];
  let standInUsed = false;
  let postponedMarked = false;

  for (const [si, def] of stageDefs.entries()) {
    const stageId = `${opts.id}-${def.key}`;
    const begin = t0 + def.dayOffset * day;
    // Seeding inside the stage: entering teams (by global seed), then advancers in finishing order.
    const participants = [...def.entering, ...advancers];
    const records: SwissRecord[] = participants.map((teamId, i) => ({
      teamId,
      seed: i + 1,
      wins: 0,
      losses: 0,
      opponents: [],
    }));
    const recOf = new Map(records.map((r) => [r.teamId, r]));
    const finishOrder: string[] = [];
    let round = 0;
    let lastEnd = begin;
    while (records.some((r) => r.wins < 3 && r.losses < 3)) {
      round++;
      const pairs = swissPairings(records, MAJOR_SWISS);
      const roundStart = begin + (round - 1) * 7 * HOUR;
      pairs.forEach(([ta, tb], pi) => {
        const ra = recOf.get(ta)!;
        const rb = recOf.get(tb)!;
        const format: 1 | 3 = def.allBo3 || isDeciderMatch(ra, rb, MAJOR_SWISS) ? 3 : 1;
        const start = roundStart + Math.floor(pi / 2) * (format === 3 ? 3 : 1) * HOUR;

        // Edge case: a temporary stand-in for one Stage 2 round-2 series (the regular player doesn't play).
        let override: Map<string, SimPlayer[]> | undefined;
        if (opts.edgeCases && !standInUsed && def.key === "s2" && round === 2) {
          standInUsed = true;
          const regular = rosterOf(ta);
          const replaced = regular.find((p) => p.role === "Support") ?? regular[4]!;
          const standIn: SimPlayer = { id: `${replaced.id}-standin`, teamId: ta, role: "Support", skill: replaced.skill - 0.05 };
          override = new Map([[ta, regular.map((p) => (p.id === replaced.id ? standIn : p))]]);
          extraPlayers.push({
            id: standIn.id,
            name: `${replaced.id.replace("demo-player-", "")}_sub`,
            first_name: "Stand-in",
            last_name: "Player",
            nationality: teamById.get(ta)!.country,
            role: "Support",
            current_team_id: ta,
            is_stand_in: true,
          });
        }
        const m = playSeries(stageId, round, "swiss", format, ta, tb, start, override);

        // Edge case: one Stage 1 round-1 match is postponed by 3 hours.
        if (opts.edgeCases && !postponedMarked && def.key === "s1" && round === 1 && pi === 5) {
          postponedMarked = true;
          const shift = 3 * HOUR;
          m.original_scheduled_at = m.scheduled_at;
          m.scheduled_at = new Date(new Date(m.scheduled_at).getTime() + shift).toISOString();
          for (const g of m.games) g.finished_at = new Date(new Date(g.finished_at).getTime() + shift).toISOString();
        }
        // Edge case: a stats correction (one assist) on the first map of the first Stage 1 match.
        if (opts.edgeCases && def.key === "s1" && round === 1 && pi === 0) {
          const g = m.games[0]!;
          const corrected = g.players.map((p, idx) => (idx === 0 ? { ...p, assists: p.assists + 1 } : { ...p }));
          corrections.push({
            gameId: g.id,
            matchId: m.id,
            releasedAt: new Date(new Date(g.finished_at).getTime() + 2 * HOUR).toISOString(),
            statsVersion: 2,
            players: corrected,
          });
        }

        lastEnd = Math.max(lastEnd, new Date(m.games[m.games.length - 1]!.finished_at).getTime());
        const winner = m.winner_id!;
        const loser = winner === ta ? tb : ta;
        recOf.get(winner)!.wins++;
        recOf.get(loser)!.losses++;
        ra.opponents.push(tb);
        rb.opponents.push(ta);
      });
      for (const r of records) {
        if ((r.wins === 3 || r.losses === 3) && !finishOrder.includes(r.teamId)) finishOrder.push(r.teamId);
      }
    }
    advancers = records
      .filter((r) => r.wins === 3)
      .sort((x, y) => x.losses - y.losses || finishOrder.indexOf(x.teamId) - finishOrder.indexOf(y.teamId))
      .map((r) => r.teamId);
    stages.push({
      id: stageId,
      name: def.name,
      short_name: def.short,
      kind: "swiss",
      position: si + 1,
      begin_at: new Date(begin).toISOString(),
      end_at: new Date(lastEnd).toISOString(),
      team_ids: participants,
      entering_team_ids: def.entering,
      wins_to_advance: 3,
      losses_to_eliminate: 3,
    });
  }

  // Playoffs: 8 teams seeded by Stage 3 finish (QF 1v8, 4v5, 2v7, 3v6), BO3 with a BO5 final.
  // Each bracket round is its own stage, so fantasy transfer windows open between them
  // (docs/GAMEPLAY.md): Quarterfinals → Semifinals → Grand Final.
  const pBegin = t0 + 13 * day;
  const s = advancers;
  const bracketStage = (key: string, name: string, position: number, begin: number, teamIds: string[], slot: string, format: 1 | 3 | 5, pairs: Array<[string, string]>, gapHours: number) => {
    const stageId = `${opts.id}-${key}`;
    const played = pairs.map(([x, y], i) => playSeries(stageId, 1, slot, format, x, y, begin + i * gapHours * HOUR));
    const end = Math.max(...played.map((m) => new Date(m.games[m.games.length - 1]!.finished_at).getTime()));
    stages.push({
      id: stageId,
      name,
      short_name: name,
      kind: "single_elimination",
      position,
      begin_at: new Date(begin).toISOString(),
      end_at: new Date(end).toISOString(),
      team_ids: teamIds,
      entering_team_ids: [],
      wins_to_advance: null,
      losses_to_eliminate: null,
    });
    return played.map((m) => m.winner_id!);
  };
  const qfWinners = bracketStage("qf", "Quarterfinals", 4, pBegin, s, "quarterfinal", 3, [
    [s[0]!, s[7]!],
    [s[3]!, s[4]!],
    [s[1]!, s[6]!],
    [s[2]!, s[5]!],
  ], 4);
  const sfWinners = bracketStage("sf", "Semifinals", 5, pBegin + day, qfWinners, "semifinal", 3, [
    [qfWinners[0]!, qfWinners[1]!],
    [qfWinners[2]!, qfWinners[3]!],
  ], 4);
  bracketStage("gf", "Grand Final", 6, pBegin + 2 * day, sfWinners, "final", 5, [[sfWinners[0]!, sfWinners[1]!]], 0);
  const pEnd = Math.max(...stages.map((x) => new Date(x.end_at).getTime()));

  const teams: DemoApiTeam[] = opts.teams.map((t) => ({
    id: t.id,
    name: t.name,
    acronym: t.acronym,
    color: t.color,
    location: t.country,
  }));
  const players: DemoApiPlayer[] = [
    ...opts.players.map((p) => ({
      id: p.id,
      name: p.nickname,
      first_name: p.firstName,
      last_name: p.lastName,
      nationality: p.nationality,
      role: p.role,
      current_team_id: p.teamId,
      is_stand_in: p.isStandIn,
    })),
    ...extraPlayers,
  ];
  void seedOf;

  return {
    tournament: {
      id: opts.id,
      slug: opts.slug,
      name: opts.name,
      short_name: opts.shortName,
      tier: opts.tier,
      game: "cs2",
      location: opts.location,
      begin_at: new Date(t0).toISOString(),
      end_at: new Date(pEnd).toISOString(),
      stages,
      matches,
      teams,
      players,
    },
    corrections,
    rounds: roundLog,
  };
}
