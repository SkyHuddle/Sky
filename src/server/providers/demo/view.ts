import type { DemoApiLiveGame, DemoApiMatch, DemoApiTournament } from "./payload";
import { unpackSnapshot, type SimulatedTournament } from "./simulate";

/**
 * What the demo provider's API "returns" at a given moment. Matches that haven't started are
 * fixtures; matches in progress expose only finished maps; corrections appear when released.
 * Fixtures appear once their pairing is known (the previous Swiss round has finished).
 */
export function viewAt(sim: SimulatedTournament, now: Date): DemoApiTournament {
  const t = sim.tournament;
  const nowMs = now.getTime();
  const correctionsByGame = new Map(
    sim.corrections.filter((c) => new Date(c.releasedAt).getTime() <= nowMs).map((c) => [c.gameId, c]),
  );

  // A stage's participants are fully known once the previous stage has ended.
  const stages = t.stages.map((st, i) => {
    const prev = t.stages[i - 1];
    const known = !prev || new Date(prev.end_at).getTime() <= nowMs;
    return known ? st : { ...st, team_ids: st.entering_team_ids };
  });

  const matches: DemoApiMatch[] = [];
  for (const m of t.matches) {
    const stage = t.stages.find((s) => s.id === m.stage_id)!;
    const stageMatches = t.matches.filter((x) => x.stage_id === m.stage_id);
    const prevRound = stageMatches.filter((x) => x.round === m.round - 1);
    const prevRoundEnd = Math.max(
      new Date(stage.begin_at).getTime() - 24 * 3_600_000,
      ...prevRound.map((x) => lastFinish(x)),
    );
    const prevStage = t.stages.find((s) => s.position === stage.position - 1);
    const stageKnown = !prevStage || new Date(prevStage.end_at).getTime() <= nowMs;
    if (!stageKnown || prevRoundEnd > nowMs) continue; // pairing not known yet

    const scheduled = new Date(m.scheduled_at).getTime();
    const original = m.original_scheduled_at ? new Date(m.original_scheduled_at).getTime() : null;
    const games = m.games
      .filter((g) => new Date(g.finished_at).getTime() <= nowMs)
      .map((g) => {
        const c = correctionsByGame.get(g.id);
        return c ? { ...g, stats_version: c.statsVersion, players: c.players } : g;
      });
    const finished = games.length === m.games.length;
    let status: DemoApiMatch["status"];
    if (finished) status = m.status;
    else if (nowMs >= scheduled) status = "running";
    else if (original !== null && nowMs >= original - 6 * 3_600_000) status = "postponed";
    else status = "not_started";

    matches.push({
      ...m,
      // Before the postponement is announced, the provider still shows the original time.
      scheduled_at:
        original !== null && status === "not_started" && nowMs < original - 6 * 3_600_000
          ? m.original_scheduled_at!
          : m.scheduled_at,
      status,
      winner_id: finished ? m.winner_id : null,
      games,
      live_game: status === "running" ? liveGame(sim, m, games.length, nowMs) : null,
    });
  }

  const visibleIds = new Set(matches.flatMap((m) => m.games.flatMap((g) => g.players.map((p) => p.player_id))));
  const players = t.players.filter((p) => !p.is_stand_in || visibleIds.has(p.id));
  return { ...t, stages, matches, players };
}

/**
 * The map in progress, replayed from the simulation's round log: the scoreboard after the last
 * completed round at `now`. This is what a scoreboard-snapshot provider would send.
 */
function liveGame(sim: SimulatedTournament, m: DemoApiMatch, finishedCount: number, nowMs: number): DemoApiLiveGame | null {
  const g = m.games[finishedCount];
  if (!g) return null;
  const start = finishedCount > 0 ? new Date(m.games[finishedCount - 1]!.finished_at).getTime() : new Date(m.scheduled_at).getTime();
  const end = new Date(g.finished_at).getTime();
  const log = sim.rounds.get(g.id);
  if (!log || log.length === 0 || nowMs < start) return null;
  const per = (end - start) / log.length;
  const done = Math.min(log.length - 1, Math.floor((nowMs - start) / per)); // never reveal the final round early
  const [a, b] = m.opponents;
  if (done <= 0) {
    const zero = unpackSnapshot(g.players, { roundsA: 0, roundsB: 0, packed: new Int16Array(g.players.length * 12) });
    return { position: g.position, map: g.map, rounds: { [a]: 0, [b]: 0 }, round_number: 0, updated_at: new Date(start).toISOString(), players: zero };
  }
  const snap = log[done - 1]!;
  return {
    position: g.position,
    map: g.map,
    rounds: { [a]: snap.roundsA, [b]: snap.roundsB },
    round_number: snap.roundsA + snap.roundsB,
    updated_at: new Date(start + done * per).toISOString(),
    players: unpackSnapshot(g.players, snap),
  };
}

function lastFinish(m: DemoApiMatch): number {
  return Math.max(...m.games.map((g) => new Date(g.finished_at).getTime()));
}
