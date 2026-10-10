import type { MatchStatus } from "@/domain/types";
import type { NormMatch, NormTournament, ProviderAdapter } from "../types";
import type { DemoApiMatch, DemoApiTournament } from "./payload";
import { demoCatalog } from "./catalog";
import { viewAt } from "./view";

const STATUS: Record<DemoApiMatch["status"], MatchStatus> = {
  not_started: "scheduled",
  running: "live",
  finished: "completed",
  postponed: "postponed",
  canceled: "cancelled",
  forfeit: "forfeit",
};

/** Translates the demo provider's payload into the normalised model. */
export function normalizeDemoTournament(t: DemoApiTournament): NormTournament {
  return {
    externalId: t.id,
    game: t.game,
    slug: t.slug,
    name: t.name,
    shortName: t.short_name,
    tier: t.tier,
    location: t.location,
    beginAt: new Date(t.begin_at),
    endAt: new Date(t.end_at),
    stages: t.stages.map((s) => ({
      externalId: s.id,
      name: s.name,
      kind: s.kind,
      position: s.position,
      beginAt: new Date(s.begin_at),
      endAt: new Date(s.end_at),
      teamExternalIds: s.team_ids,
      enteringTeamExternalIds: s.entering_team_ids,
      winsToAdvance: s.wins_to_advance,
      lossesToEliminate: s.losses_to_eliminate,
    })),
    teams: t.teams.map((x) => ({
      externalId: x.id,
      name: x.name,
      acronym: x.acronym,
      color: x.color,
      country: x.location,
    })),
    players: t.players.map((p) => ({
      externalId: p.id,
      nickname: p.name,
      firstName: p.first_name,
      lastName: p.last_name,
      nationality: p.nationality,
      role: p.role,
      teamExternalId: p.current_team_id,
      isStandIn: p.is_stand_in,
    })),
    matches: t.matches.map(normalizeMatch),
  };
}

function normalizeMatch(m: DemoApiMatch): NormMatch {
  return {
    externalId: m.id,
    stageExternalId: m.stage_id,
    round: m.round,
    slot: m.bracket_slot,
    format: m.number_of_games,
    scheduledAt: new Date(m.scheduled_at),
    originalScheduledAt: m.original_scheduled_at ? new Date(m.original_scheduled_at) : null,
    status: STATUS[m.status],
    teamAExternalId: m.opponents[0],
    teamBExternalId: m.opponents[1],
    winnerTeamExternalId: m.winner_id,
    maps: m.games.map((g) => ({
      externalId: g.id,
      number: g.position,
      mapName: g.map,
      roundsPlayed: Object.values(g.rounds).reduce((a, b) => a + b, 0),
      roundsByTeam: g.rounds,
      winnerTeamExternalId: g.winner_id,
      finishedAt: new Date(g.finished_at),
      statsVersion: g.stats_version,
      stats: g.players.map((p) => ({
        playerId: p.player_id,
        teamId: p.team_id,
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        openingKills: p.first_kills,
        multiKillRounds: { k3: p.multikills["3k"], k4: p.multikills["4k"], k5: p.multikills["5k"] },
        clutchesWon: {
          v1: p.clutches_won["1v1"],
          v2: p.clutches_won["1v2"],
          v3: p.clutches_won["1v3"],
          v4: p.clutches_won["1v4"],
          v5: p.clutches_won["1v5"],
        },
      })),
    })),
  };
}

/** The demo provider: serves the simulated catalog as it would look at `now`. */
export class DemoProvider implements ProviderAdapter {
  readonly key = "demo";
  readonly isDemo = true;

  constructor(private readonly anchor: Date) {}

  async fetchTournaments(now: Date): Promise<NormTournament[]> {
    return demoCatalog(this.anchor).map((sim) => normalizeDemoTournament(viewAt(sim, now)));
  }
}
