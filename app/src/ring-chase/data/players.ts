import type { CodPlayer, CodRole, PlayerRatings } from '../core/types';

type RatingInput = Partial<PlayerRatings> & { overall: number };

function r(input: RatingInput): PlayerRatings {
  const o = input.overall;
  return {
    overall: o,
    slaying: input.slaying ?? o,
    objective: input.objective ?? o - 2,
    snd: input.snd ?? o - 1,
    respawn: input.respawn ?? o,
    clutch: input.clutch ?? o - 1,
    lan: input.lan ?? o,
    consistency: input.consistency ?? o - 2,
    leadership: input.leadership ?? o - 3,
    pace: input.pace ?? o,
    roleFit: input.roleFit ?? o,
    championshipFactor: input.championshipFactor ?? Math.min(99, o + 3),
    peakForm: input.peakForm ?? o + 2,
  };
}

function p(
  id: string,
  gamertag: string,
  primaryRole: CodRole,
  secondaryRole: CodRole,
  organization: string,
  rings: number,
  majorWins: number,
  achievement: string,
  ratings: RatingInput,
  extras?: Partial<Pick<CodPlayer, 'badge' | 'realName' | 'country' | 'mvpAwards' | 'accent'>>
): CodPlayer {
  return {
    id,
    gamertag,
    realName: extras?.realName,
    primaryRole,
    secondaryRole,
    country: extras?.country ?? 'USA',
    organization,
    rings,
    majorWins,
    mvpAwards: extras?.mvpAwards ?? 0,
    notableAchievement: achievement,
    badge: extras?.badge,
    ratings: r(ratings),
    accent: extras?.accent ?? '#c9a227',
  };
}

export const COD_PLAYERS: CodPlayer[] = [
  p('scump', 'Scump', 'smg', 'flex', 'OpTic', 2, 8, '2x Champs · King', { overall: 94, slaying: 96, snd: 88, leadership: 90, pace: 97 }, { badge: 'King', mvpAwards: 2 }),
  p('formal', 'FormaL', 'mainAR', 'flex', 'OpTic', 2, 7, 'Finals MVP', { overall: 93, slaying: 91, snd: 95, objective: 90, leadership: 88 }, { badge: 'Finals MVP' }),
  p('crimsix', 'Crimsix', 'flex', 'mainAR', 'OpTic', 3, 12, '3 Rings · Winner', { overall: 92, leadership: 95, clutch: 93, championshipFactor: 98 }, { badge: '3 Rings' }),
  p('karma', 'Karma', 'flex', 'mainAR', 'OpTic', 3, 10, '3 Rings · Support', { overall: 90, snd: 94, leadership: 92, clutch: 91 }, { badge: '3 Rings' }),
  p('dashy', 'Dashy', 'mainAR', 'flex', 'OpTic', 1, 4, 'Champs MVP', { overall: 91, slaying: 93, respawn: 92, lan: 90 }, { badge: 'Champs MVP' }),
  p('shotzzy', 'Shotzzy', 'smg', 'flex', 'OpTic', 1, 5, 'Champs · Flex God', { overall: 93, slaying: 95, pace: 96, peakForm: 96 }, { badge: 'Champs' }),
  p('mercules', 'Mercules', 'mainAR', 'flex', 'OpTic', 1, 2, 'Champs Winner', { overall: 88, objective: 90, consistency: 87 }),
  p('pred', 'Pred', 'smg', 'flex', 'OpTic', 1, 3, 'MVP Season', { overall: 92, slaying: 94, pace: 95, peakForm: 95 }, { badge: 'MVP' }),
  p('simp', 'Simp', 'smg', 'flex', 'FaZe', 4, 10, '4 Rings · GOAT', { overall: 97, slaying: 98, clutch: 96, lan: 97, championshipFactor: 99 }, { badge: '4 Rings', mvpAwards: 3 }),
  p('abezy', 'aBeZy', 'smg', 'flex', 'FaZe', 4, 9, '4 Rings · Slayer', { overall: 96, slaying: 98, pace: 97, respawn: 96 }, { badge: '4 Rings' }),
  p('cellium', 'Cellium', 'flex', 'mainAR', 'FaZe', 4, 8, '4 Rings · Flex', { overall: 94, objective: 93, snd: 92, consistency: 95 }, { badge: '4 Rings' }),
  p('arcitys', 'Arcitys', 'mainAR', 'flex', 'FaZe', 4, 7, '4 Rings · AR', { overall: 91, snd: 93, leadership: 88 }, { badge: '4 Rings' }),
  p('drazah', 'Drazah', 'flex', 'smg', 'FaZe', 2, 4, '2 Rings', { overall: 89, slaying: 90, respawn: 91 }),
  p('sib', 'Sib', 'flex', 'smg', 'FaZe', 1, 2, 'Major Winner', { overall: 87, slaying: 88, pace: 89 }),
  p('huke', 'Huke', 'flex', 'smg', 'Empire', 2, 5, '2 Rings · Flex', { overall: 90, slaying: 91, clutch: 89, lan: 91 }),
  p('illeY', 'iLLeY', 'flex', 'mainAR', 'Empire', 1, 3, 'Champs Winner', { overall: 88, objective: 90, snd: 89 }),
  p('clayster', 'Clayster', 'mainAR', 'flex', 'Empire', 2, 8, '2 Rings · Legend', { overall: 91, leadership: 94, lan: 93, championshipFactor: 95 }, { badge: 'Legend' }),
  p('crimsix-emp', 'Crimsix', 'flex', 'mainAR', 'Empire', 2, 8, 'Empire Ring', { overall: 90, leadership: 93 }),
  p('envoy', 'Envoy', 'smg', 'flex', 'LAT', 1, 4, 'Champs Winner', { overall: 90, snd: 92, clutch: 91 }),
  p('kenny', 'Kenny', 'mainAR', 'flex', 'LAT', 1, 3, 'Champs AR', { overall: 89, snd: 91, objective: 88 }),
  p('hydra', 'HyDra', 'smg', 'flex', 'NYSL', 1, 4, 'Champs · Slayer', { overall: 93, slaying: 95, pace: 94, peakForm: 94 }, { badge: 'Champs' }),
  p('kismet', 'Kismet', 'flex', 'mainAR', 'NYSL', 1, 3, 'Champs IGL', { overall: 90, leadership: 93, snd: 91, objective: 90 }),
  p('skyz', 'Skyz', 'mainAR', 'flex', 'NYSL', 1, 3, 'Champs AR', { overall: 89, snd: 90, consistency: 88 }),
  p('priestahh', 'Priestahh', 'flex', 'smg', 'NYSL', 1, 2, 'Major Winner', { overall: 87, respawn: 89, slaying: 86 }),
  p('scrap', 'Scrap', 'flex', 'smg', 'Ultra', 1, 2, 'Champs Winner', { overall: 88, slaying: 89, clutch: 87 }),
  p('cleanx', 'CleanX', 'smg', 'flex', 'Ultra', 1, 3, 'Champs · SMG', { overall: 90, slaying: 92, pace: 93 }),
  p('insight', 'Insight', 'flex', 'mainAR', 'Ultra', 1, 2, 'Champs IGL', { overall: 88, leadership: 91, snd: 90 }),
  p('cammy', 'Cammy', 'smg', 'flex', 'Ultra', 0, 2, 'Major Finalist', { overall: 86, slaying: 88, pace: 87 }),
  p('silly', 'Silly', 'flex', 'mainAR', 'eUnited', 1, 2, 'Champs Winner', { overall: 87, leadership: 90, snd: 88 }),
  p('accuracy', 'Accuracy', 'mainAR', 'flex', 'eUnited', 1, 2, 'Champs AR', { overall: 86, snd: 88 }),
  p('attach', 'Attach', 'flex', 'smg', 'NYSL', 0, 3, 'Major Winner', { overall: 88, snd: 90, leadership: 87 }),
  p('octane', 'Octane', 'mainAR', 'flex', '100T', 0, 2, 'Major Winner', { overall: 89, objective: 90, consistency: 91 }),
  p('slasher', 'Slasher', 'flex', 'mainAR', 'Luminosity', 1, 2, 'Champs · IGL', { overall: 89, leadership: 92, snd: 90 }, { badge: 'Champs' }),
  p('classic', 'Classic', 'mainAR', 'flex', 'Luminosity', 1, 2, 'Champs Winner', { overall: 90, leadership: 91, lan: 90, snd: 89 }, { badge: 'Champs' }),
  p('tjhaly', 'TJHaLy', 'smg', 'flex', 'Luminosity', 1, 1, 'Champs Winner', { overall: 88, slaying: 90, pace: 91 }),
  p('slacked', 'Slacked', 'smg', 'flex', 'Luminosity', 0, 2, 'Major winner · LG', { overall: 85, slaying: 86, respawn: 87, objective: 86 }),
  p('ghosty', 'Ghosty', 'smg', 'flex', '100T', 0, 1, 'Rising Star', { overall: 85, slaying: 87, pace: 88 }),
  p('aches', 'Aches', 'mainAR', 'flex', 'compLexity', 2, 6, '2 Rings · Legend', { overall: 90, leadership: 92, lan: 91, championshipFactor: 94 }, { badge: 'Legend' }),
  p('teepee', 'TeePee', 'flex', 'mainAR', 'compLexity', 2, 5, '2 Rings', { overall: 89, objective: 91, leadership: 88 }),
  p('jkap', 'JKap', 'mainAR', 'flex', 'FaZe', 1, 4, 'Champs · IGL', { overall: 88, leadership: 93, snd: 90 }),
  p('crimsix-col', 'Crimsix', 'flex', 'mainAR', 'compLexity', 2, 8, 'coL Ring', { overall: 91, leadership: 94 }),
  p('proofy', 'Proofy', 'mainAR', 'flex', 'FaZe', 0, 2, 'Major Winner', { overall: 86, slaying: 87 }),
  p('replays', 'Replays', 'flex', 'mainAR', 'FaZe', 0, 1, 'Major Winner', { overall: 84, leadership: 86 }),
  p('apathy', 'Apathy', 'flex', 'smg', 'Envy', 1, 3, 'Champs Winner', { overall: 87, clutch: 90, lan: 88 }),
  p('xposed', 'XMystery', 'smg', 'flex', 'Fariko', 1, 1, 'Champs Winner', { overall: 85, slaying: 87 }),
  p('parasite', 'Parasite', 'flex', 'mainAR', 'Fariko', 1, 1, 'Champs IGL', { overall: 84, leadership: 88, snd: 86 }),
  p('karma-envy', 'Karma', 'flex', 'mainAR', 'Envy', 2, 7, 'Envy Ring', { overall: 89, snd: 93 }),
  p('scump-envy', 'Scump', 'smg', 'flex', 'Envy', 0, 3, 'Major Winner', { overall: 92, slaying: 94 }),
  p('formal-envy', 'FormaL', 'mainAR', 'flex', 'Envy', 0, 3, 'Major Winner', { overall: 91, snd: 94 }),
  p('hicksy', 'Hicksy', 'smg', 'flex', 'Rise', 0, 1, 'Major Finalist', { overall: 84, slaying: 86 }),
  p('gunless', 'Gunless', 'mainAR', 'flex', 'Rise', 0, 1, 'Major Winner', { overall: 86, snd: 88 }),
  p('loony', 'Loony', 'flex', 'mainAR', 'Rise', 0, 1, 'Major IGL', { overall: 85, leadership: 89 }),
  p('diamondcon', 'Diamondcon', 'smg', 'flex', 'Rise', 0, 0, 'Major Finalist', { overall: 83, slaying: 85 }),
  p('enable', 'Enable', 'flex', 'smg', 'FaZe', 0, 2, 'Major Winner', { overall: 86, snd: 89, clutch: 87 }),
  p('zooma', 'ZooMaa', 'smg', 'flex', 'FaZe', 0, 2, 'Major Winner', { overall: 88, slaying: 90, pace: 91 }),
  p('methodz', 'Methodz', 'mainAR', 'flex', '100T', 0, 1, 'Major Winner', { overall: 85, snd: 87 }),
  p('john', 'John', 'flex', 'smg', 'Luminosity', 1, 3, 'LG · Major Winner', { overall: 87, slaying: 88, snd: 87, clutch: 88 }),
  p('saints', 'Saints', 'flex', 'smg', 'Luminosity', 0, 2, 'LG · Major Winner', { overall: 86, slaying: 88, pace: 87 }),
  p('ricky', 'Ricky', 'flex', 'mainAR', 'Rise', 0, 1, 'Rise IGL', { overall: 85, leadership: 90, snd: 86 }),
  p('prestinni', 'Prestinni', 'smg', 'flex', 'Seattle', 0, 1, 'Surge SMG', { overall: 86, slaying: 88, pace: 87 }),
  p('apathy-sea', 'Apathy', 'flex', 'smg', 'Seattle', 0, 1, 'Surge veteran', { overall: 85, clutch: 88, lan: 86 }),
  p('temp', 'Temp', 'flex', 'mainAR', 'Splyce', 0, 1, 'Major Winner', { overall: 84, leadership: 86 }),
  p('accuracy-eu', 'Accuracy', 'mainAR', 'flex', 'Splyce', 0, 1, 'Major Winner', { overall: 83, snd: 85 }),
  p('haggy', 'Haggy', 'flex', 'smg', 'eUnited', 0, 0, 'LAN Demon', { overall: 82, lan: 88, slaying: 84 }),
  p('reality', 'Reality', 'mainAR', 'flex', 'Mindfreak', 0, 0, 'APAC Legend', { overall: 82, snd: 84 }, { country: 'AUS' }),
  p('majormaniak', 'MajorManiak', 'flex', 'smg', 'FaZe', 0, 2, 'Major Winner', { overall: 86, respawn: 88 }),
  p('asim', 'Asim', 'smg', 'flex', 'NYSL', 0, 1, 'Major Winner', { overall: 85, slaying: 87 }),
  p('neptune', 'Neptune', 'smg', 'flex', 'LAT', 0, 0, 'Flex SMG', { overall: 83, pace: 86 }),
  p('abe', 'Abe', 'flex', 'mainAR', 'Rise', 0, 0, 'Role Player', { overall: 80, objective: 84 }),
  p('feelo', 'Feelo', 'smg', 'flex', 'Toronto', 0, 0, 'SMG', { overall: 81, slaying: 83 }),
  p('mettalz', 'MettalZ', 'mainAR', 'flex', 'Toronto', 0, 0, 'AR', { overall: 82, snd: 84 }),
  p('joe', 'JoeDeceives', 'smg', 'flex', 'Boston', 0, 0, 'Rising SMG', { overall: 84, slaying: 86 }),
  p('vivid', 'Vivid', 'flex', 'smg', 'Boston', 0, 0, 'Flex', { overall: 83, respawn: 85 }),
  p('nastie', 'Nastie', 'mainAR', 'flex', 'London', 0, 0, 'AR', { overall: 82, snd: 83 }),
  p('harry', 'Harry', 'smg', 'flex', 'London', 0, 0, 'SMG', { overall: 81, slaying: 82 }),
  p('beans', 'Beans', 'smg', 'flex', 'Seattle', 0, 0, 'SMG', { overall: 82, pace: 84 }),
  p('lunarz', 'Lunarz', 'mainAR', 'flex', 'Seattle', 0, 0, 'AR', { overall: 81, snd: 82 }),
  p('bigt', 'BigT', 'flex', 'mainAR', 'OpTic', 0, 2, 'OpTic Legend', { overall: 86, leadership: 92 }),
  p('morph', 'MBoZe', 'smg', 'flex', 'OpTic', 0, 1, 'OpTic SMG', { overall: 84, slaying: 86 }),
  p('nadeshot', 'Nadeshot', 'mainAR', 'flex', '100T', 0, 0, '100T Founder', { overall: 80, leadership: 88 }),
  p('crowder', 'Crowder', 'flex', 'mainAR', 'FaZe', 0, 1, 'Coach · IGL', { overall: 82, leadership: 90 }),
  p('prolute', 'Prolute', 'smg', 'flex', 'OpTic', 0, 1, 'Major Winner', { overall: 84, slaying: 85 }),
  p('mack', 'Mack', 'smg', 'flex', 'NYSL', 0, 1, 'Major Winner', { overall: 85, slaying: 86 }),
  p('nexus', 'Nexus', 'flex', 'mainAR', 'London', 0, 0, 'Flex', { overall: 80, objective: 82 }),
  p('havoc', 'Havoc', 'smg', 'flex', 'Mutineers', 0, 0, 'Flex SMG', { overall: 78, slaying: 80, pace: 79 }),
  p('lacefield', 'Lacefield', 'smg', 'flex', 'Guerrillas', 0, 0, 'SMG', { overall: 76, slaying: 78, respawn: 75 }),
  p('decemate', 'Decemate', 'flex', 'mainAR', 'Legion', 0, 0, 'Flex', { overall: 77, snd: 78, objective: 76 }),
  p('assault', 'Assault', 'mainAR', 'flex', 'Guerrillas', 0, 0, 'AR', { overall: 79, snd: 80, consistency: 78 }),
];

const playerMap = new Map<string, CodPlayer>();
for (const player of COD_PLAYERS) {
  if (!playerMap.has(player.id)) playerMap.set(player.id, player);
}

export function getPlayerById(id: string): CodPlayer | undefined {
  return playerMap.get(id) ?? COD_PLAYERS.find((pl) => pl.id === id);
}

export function getAllPlayers(): CodPlayer[] {
  return [...playerMap.values()];
}

export function resolveRoster(playerIds: string[]): CodPlayer[] {
  return playerIds.map((id) => getPlayerById(id)).filter((pl): pl is CodPlayer => pl != null);
}
