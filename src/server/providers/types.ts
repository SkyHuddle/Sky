import type { Cs2PlayerMapStats } from "@/domain/scoring/cs2";
import type { GameId, MatchStatus, SeriesFormat } from "@/domain/types";

/**
 * Normalised, provider-independent esports data. Provider adapters (demo, PandaScore, GRID)
 * translate their own payloads into these shapes; nothing downstream knows which provider was used.
 * All ids here are the PROVIDER's external ids; the ingestion layer maps them to internal ids.
 */

export interface NormTeam {
  externalId: string;
  name: string;
  acronym: string;
  color: string;
  country: string;
}

export interface NormPlayer {
  externalId: string;
  nickname: string;
  firstName: string;
  lastName: string;
  nationality: string;
  role: string;
  teamExternalId: string;
  isStandIn: boolean;
}

export interface NormStage {
  externalId: string;
  name: string;
  kind: "swiss" | "single_elimination";
  position: number;
  beginAt: Date;
  endAt: Date;
  teamExternalIds: string[];
  enteringTeamExternalIds: string[];
  winsToAdvance: number | null;
  lossesToEliminate: number | null;
}

export interface NormMap {
  externalId: string;
  number: number;
  mapName: string;
  roundsPlayed: number;
  roundsByTeam: Record<string, number>;
  winnerTeamExternalId: string;
  finishedAt: Date;
  statsVersion: number;
  /** playerId / teamId in these lines are EXTERNAL ids. */
  stats: Cs2PlayerMapStats[];
}

export interface NormMatch {
  externalId: string;
  stageExternalId: string;
  round: number;
  slot: string;
  format: SeriesFormat;
  scheduledAt: Date;
  originalScheduledAt: Date | null;
  status: MatchStatus;
  teamAExternalId: string;
  teamBExternalId: string;
  winnerTeamExternalId: string | null;
  maps: NormMap[];
  /** The map being played now, as a scoreboard snapshot (live matches only, when the provider supplies it). */
  liveMap?: NormLiveMap | null;
}

export interface NormLiveMap {
  number: number;
  mapName: string;
  roundsByTeam: Record<string, number>;
  /** Rounds completed so far. */
  roundNumber: number;
  /** When the provider produced this snapshot. */
  updatedAt: Date;
  /** playerId / teamId are EXTERNAL ids. */
  stats: Cs2PlayerMapStats[];
}

export interface NormTournament {
  externalId: string;
  game: GameId;
  slug: string;
  name: string;
  shortName: string;
  tier: "major" | "tier1" | "other";
  location: string;
  beginAt: Date;
  endAt: Date;
  stages: NormStage[];
  teams: NormTeam[];
  players: NormPlayer[];
  matches: NormMatch[];
}

export interface ProviderAdapter {
  /** Stable provider key stored with every external id ("demo", "pandascore", "grid"). */
  readonly key: string;
  /** True when the data is synthetic and must be labelled as demonstration data. */
  readonly isDemo: boolean;
  fetchTournaments(now: Date): Promise<NormTournament[]>;
}
