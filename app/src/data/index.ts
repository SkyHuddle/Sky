import type { EsportId, Player, Role } from '@/core/types';
import { LOL_PLAYERS } from './players/lol';
import {
  mergePlayersWithGol,
  getGolDataMeta,
  getPlayerDataSource,
  hasGolRatings,
} from './merge-gol-ratings';

export { getGolDataMeta, getPlayerDataSource, hasGolRatings };

const LOL_PLAYERS_WITH_GOL = mergePlayersWithGol(LOL_PLAYERS);

const PLAYER_MAP = new Map<string, Player>(
  LOL_PLAYERS_WITH_GOL.map((p) => [p.id, p])
);

const REGISTRY: Record<EsportId, Player[]> = {
  lol: LOL_PLAYERS_WITH_GOL,
  valorant: [],
  cs2: [],
  dota2: [],
};

export function getPlayers(esport: EsportId = 'lol'): Player[] {
  return REGISTRY[esport];
}

export function getPlayersByRole(
  role: Role,
  esport: EsportId = 'lol',
  filter?: (p: Player) => boolean
): Player[] {
  return getPlayers(esport).filter(
    (p) => p.role === role && (!filter || filter(p))
  );
}

export function getPlayerById(id: string, esport: EsportId = 'lol'): Player | undefined {
  if (esport === 'lol') return PLAYER_MAP.get(id);
  return getPlayers(esport).find((p) => p.id === id);
}
