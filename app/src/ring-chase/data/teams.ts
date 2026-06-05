import type { HistoricalCodTeam, RosterSlot, TeamTier } from '../core/types';
import { assignRosterSlots } from './roster-slots';

type RosterInput = Record<RosterSlot, string> | string[];

function team(
  id: string,
  teamName: string,
  season: number,
  gameTitle: string,
  eventContext: string,
  region: string,
  roster: RosterInput,
  opts: {
    teamRating: number;
    placement: string;
    majorWins: number;
    champsPlacement: string;
    isChampsWinner: boolean;
    isIconicRoster?: boolean;
    era?: 'pre-cdl' | 'cdl';
    accent: string;
    tier: TeamTier;
  }
): HistoricalCodTeam {
  return {
    id,
    teamName,
    season,
    gameTitle,
    eventContext,
    region,
    roster: Array.isArray(roster) ? assignRosterSlots(roster) : roster,
    teamRating: opts.teamRating,
    placement: opts.placement,
    majorWins: opts.majorWins,
    champsPlacement: opts.champsPlacement,
    isChampsWinner: opts.isChampsWinner,
    isIconicRoster: opts.isIconicRoster ?? true,
    era: opts.era ?? (season >= 2020 ? 'cdl' : 'pre-cdl'),
    accent: opts.accent,
    tier: opts.tier,
  };
}

export const COD_TEAMS: HistoricalCodTeam[] = [
  team('optic-2017', 'OpTic Gaming', 2017, 'Infinite Warfare', 'World Championship roster', 'NA', ['scump', 'formal', 'crimsix', 'karma'], {
    teamRating: 96, placement: 'Champs Winner', majorWins: 3, champsPlacement: 'Champion', isChampsWinner: true, accent: '#9BC848', tier: 'legendary',
  }),
  team('faze-2021', 'Atlanta FaZe', 2021, 'Cold War', 'Dynasty peak', 'NA', ['simp', 'abezy', 'cellium', 'arcitys'], {
    teamRating: 97, placement: 'Champs Winner', majorWins: 4, champsPlacement: 'Champion', isChampsWinner: true, accent: '#FF0000', tier: 'legendary',
  }),
  team('empire-2020', 'Dallas Empire', 2020, 'Modern Warfare', 'CDL inaugural champs', 'NA', ['shotzzy', 'huke', 'illeY', 'clayster', 'crimsix-emp'], {
    teamRating: 94, placement: 'Champs Winner', majorWins: 2, champsPlacement: 'Champion', isChampsWinner: true, accent: '#0066CC', tier: 'legendary',
  }),
  team('eunited-2019', 'eUnited', 2019, 'Black Ops 4', 'Major winners', 'NA', ['silly', 'accuracy', 'abezy', 'sib'], {
    teamRating: 90, placement: 'Champs Winner', majorWins: 2, champsPlacement: 'Champion', isChampsWinner: true, accent: '#003366', tier: 'elite',
  }),
  team('lat-2022', 'Los Angeles Thieves', 2022, 'Vanguard', 'Back-to-back champs', 'NA', ['envoy', 'kenny', 'octane', 'drazah'], {
    teamRating: 91, placement: 'Champs Winner', majorWins: 2, champsPlacement: 'Champion', isChampsWinner: true, accent: '#CF102D', tier: 'elite',
  }),
  team('nysl-2023', 'New York Subliners', 2023, 'Modern Warfare III', 'Major III champs', 'NA', ['hydra', 'kismet', 'skyz', 'priestahh'], {
    teamRating: 92, placement: 'Champs Winner', majorWins: 2, champsPlacement: 'Champion', isChampsWinner: true, accent: '#FF6600', tier: 'elite',
  }),
  team('optic-tx-2024', 'OpTic Texas', 2024, 'Modern Warfare III', 'Champs winners', 'NA', ['dashy', 'shotzzy', 'mercules', 'pred'], {
    teamRating: 93, placement: 'Champs Winner', majorWins: 2, champsPlacement: 'Champion', isChampsWinner: true, accent: '#9BC848', tier: 'legendary',
  }),
  team('ultra-2024', 'Toronto Ultra', 2024, 'Modern Warfare III', 'Major winners', 'NA', ['scrap', 'cleanx', 'insight', 'cammy'], {
    teamRating: 88, placement: 'Major Winner', majorWins: 2, champsPlacement: 'Top 4', isChampsWinner: false, accent: '#7B2D8E', tier: 'strong',
  }),
  team('col-2014', 'compLexity', 2014, 'Ghosts', 'Dynasty era', 'NA', ['aches', 'teepee', 'crimsix-col', 'proofy'], {
    teamRating: 92, placement: 'Champs Winner', majorWins: 2, champsPlacement: 'Champion', isChampsWinner: true, accent: '#1E3A8A', tier: 'legendary',
  }),
  team('fariko-2013', 'Fariko Impact', 2013, 'Black Ops II', 'First LAN dynasty', 'NA', ['xposed', 'parasite', 'apathy', 'crowder'], {
    teamRating: 88, placement: 'Champs Winner', majorWins: 1, champsPlacement: 'Champion', isChampsWinner: true, accent: '#FFD700', tier: 'elite',
  }),
  team('envy-2016', 'Team Envy', 2016, 'Black Ops III', 'Major winners', 'NA', ['scump-envy', 'formal-envy', 'karma-envy', 'apathy'], {
    teamRating: 91, placement: 'Champs Winner', majorWins: 2, champsPlacement: 'Champion', isChampsWinner: true, accent: '#00CED1', tier: 'legendary',
  }),
  team('rise-2018', 'Rise Nation', 2018, 'WWII', 'Major winners', 'NA', ['gunless', 'loony', 'hicksy', 'diamondcon'], {
    teamRating: 86, placement: 'Major Winner', majorWins: 1, champsPlacement: 'Top 6', isChampsWinner: false, accent: '#FF4500', tier: 'strong',
  }),
  team('faze-2023', 'Atlanta FaZe', 2023, 'Modern Warfare II', 'Major winners', 'NA', ['simp', 'abezy', 'cellium', 'drazah'], {
    teamRating: 94, placement: 'Major Winner', majorWins: 2, champsPlacement: 'Top 4', isChampsWinner: false, accent: '#FF0000', tier: 'legendary',
  }),
  team('ultra-2021', 'Toronto Ultra', 2021, 'Cold War', 'Major winners', 'NA', ['cleanx', 'insight', 'cammy', 'hicksy'], {
    teamRating: 87, placement: 'Major Winner', majorWins: 1, champsPlacement: 'Top 6', isChampsWinner: false, accent: '#7B2D8E', tier: 'strong',
  }),
  team('100t-2019', '100 Thieves', 2019, 'Black Ops 4', 'Major winners', 'NA', ['octane', 'slasher', 'enable', 'nadeshot'], {
    teamRating: 85, placement: 'Major Winner', majorWins: 1, champsPlacement: 'Top 8', isChampsWinner: false, accent: '#FFD700', tier: 'solid',
  }),
  team('splyce-2017', 'Splyce', 2017, 'Infinite Warfare', 'Major winners', 'NA', ['temp', 'accuracy-eu', 'john', 'abe'], {
    teamRating: 84, placement: 'Major Winner', majorWins: 1, champsPlacement: 'Top 6', isChampsWinner: false, accent: '#00FF00', tier: 'solid',
  }),
  team('faze-2019', 'Atlanta FaZe', 2019, 'Black Ops 4', 'Major winners', 'NA', ['simp', 'abezy', 'cellium', 'zooma'], {
    teamRating: 90, placement: 'Major Winner', majorWins: 2, champsPlacement: 'Top 4', isChampsWinner: false, accent: '#FF0000', tier: 'elite',
  }),
  team('optic-2014', 'OpTic Gaming', 2014, 'Ghosts', 'Major winners', 'NA', ['scump', 'formal', 'crimsix', 'bigt'], {
    teamRating: 89, placement: 'Major Winner', majorWins: 2, champsPlacement: 'Top 4', isChampsWinner: false, accent: '#9BC848', tier: 'elite',
  }),
  team('optic-2016', 'OpTic Gaming', 2016, 'Black Ops III', 'Major winners', 'NA', ['scump', 'formal', 'crimsix', 'karma'], {
    teamRating: 93, placement: 'Major Winner', majorWins: 3, champsPlacement: 'Top 4', isChampsWinner: false, accent: '#9BC848', tier: 'legendary',
  }),
  team('faze-2018', 'FaZe Clan', 2018, 'WWII', 'Major winners', 'EU', ['attach', 'enable', 'zooma', 'replays'], {
    teamRating: 87, placement: 'Major Winner', majorWins: 1, champsPlacement: 'Top 6', isChampsWinner: false, accent: '#FF0000', tier: 'strong',
  }),
  team('nysl-2021', 'New York Subliners', 2021, 'Cold War', 'Major finalists', 'NA', ['asim', 'octane', 'mack', 'attach'], {
    teamRating: 86, placement: 'Major Finalist', majorWins: 0, champsPlacement: 'Top 6', isChampsWinner: false, accent: '#FF6600', tier: 'solid',
  }),
  team('lat-2021', 'Los Angeles Thieves', 2021, 'Cold War', 'Major winners', 'NA', ['envoy', 'kenny', 'octane', 'temp'], {
    teamRating: 88, placement: 'Major Winner', majorWins: 1, champsPlacement: 'Top 4', isChampsWinner: false, accent: '#CF102D', tier: 'strong',
  }),
  team('boston-2022', 'Boston Breach', 2022, 'Vanguard', 'Major finalists', 'NA', ['octane', 'methodz', 'vivid', 'neptune'], {
    teamRating: 83, placement: 'Major Finalist', majorWins: 0, champsPlacement: 'Top 8', isChampsWinner: false, accent: '#006633', tier: 'underdog',
  }),
  team('seattle-2023', 'Seattle Surge', 2023, 'Modern Warfare II', 'Major finalists', 'NA', ['octane', 'pred', 'lunarz', 'beans'], {
    teamRating: 85, placement: 'Major Finalist', majorWins: 0, champsPlacement: 'Top 6', isChampsWinner: false, accent: '#00A651', tier: 'solid',
  }),
  team('toronto-2022', 'Toronto Ultra', 2022, 'Vanguard', 'Major winners', 'NA', ['cleanx', 'cammy', 'insight', 'feelo'], {
    teamRating: 86, placement: 'Major Winner', majorWins: 1, champsPlacement: 'Top 4', isChampsWinner: false, accent: '#7B2D8E', tier: 'strong',
  }),
  team('minnesota-2020', 'Minnesota ROKKR', 2020, 'Modern Warfare', 'Major winners', 'NA', ['attach', 'majormaniak', 'priestahh', 'ghosty'], {
    teamRating: 84, placement: 'Major Winner', majorWins: 1, champsPlacement: 'Top 8', isChampsWinner: false, accent: '#5C2D91', tier: 'solid',
  }),
  team('optic-2015', 'OpTic Gaming', 2015, 'Advanced Warfare', 'Major winners', 'NA', ['scump', 'formal', 'crimsix', 'morph'], {
    teamRating: 90, placement: 'Major Winner', majorWins: 2, champsPlacement: 'Top 4', isChampsWinner: false, accent: '#9BC848', tier: 'elite',
  }),
  team('faze-2022', 'Atlanta FaZe', 2022, 'Vanguard', 'Major winners', 'NA', ['simp', 'abezy', 'cellium', 'sib'], {
    teamRating: 93, placement: 'Major Winner', majorWins: 2, champsPlacement: 'Top 4', isChampsWinner: false, accent: '#FF0000', tier: 'legendary',
  }),
  team('london-2024', 'London Royal Ravens', 2024, 'Modern Warfare III', 'Major finalists', 'EU', ['nastie', 'harry', 'nexus', 'reality'], {
    teamRating: 82, placement: 'Major Finalist', majorWins: 0, champsPlacement: 'Top 8', isChampsWinner: false, accent: '#5B2C6F', tier: 'underdog',
  }),
  team('optic-2022', 'OpTic Texas', 2022, 'Vanguard', 'Major winners', 'NA', ['dashy', 'shotzzy', 'enable', 'prolute'], {
    teamRating: 89, placement: 'Major Winner', majorWins: 1, champsPlacement: 'Top 6', isChampsWinner: false, accent: '#9BC848', tier: 'elite',
  }),
  team(
    'lg-2016',
    'Luminosity Gaming',
    2016,
    'Black Ops III',
    'COD XP Champs winners',
    'NA',
    { mainAR: 'classic', flex: 'slasher', smg: 'tjhaly', smg2: 'john' },
    {
      teamRating: 91,
      placement: 'Champs Winner',
      majorWins: 2,
      champsPlacement: 'Champion',
      isChampsWinner: true,
      accent: '#FACC15',
      tier: 'legendary',
    }
  ),
  team(
    'rise-2016',
    'Rise Nation',
    2016,
    'Black Ops III',
    'UMG South Carolina winners',
    'NA',
    { mainAR: 'gunless', flex: 'loony', smg: 'slacked', smg2: 'ricky' },
    {
      teamRating: 85,
      placement: 'Major Winner',
      majorWins: 1,
      champsPlacement: 'Top 8',
      isChampsWinner: false,
      accent: '#FF4500',
      tier: 'solid',
    }
  ),
  team(
    'lg-2017',
    'Luminosity Gaming',
    2017,
    'Infinite Warfare',
    'CWL Anaheim winners',
    'NA',
    { mainAR: 'classic', flex: 'saints', smg: 'slacked', smg2: 'octane' },
    {
      teamRating: 90,
      placement: 'Major Winner',
      majorWins: 2,
      champsPlacement: 'Top 4',
      isChampsWinner: false,
      accent: '#FACC15',
      tier: 'elite',
    }
  ),
  team(
    'lg-2018',
    'Luminosity Gaming',
    2018,
    'WWII',
    'CWL Birmingham winners',
    'NA',
    { mainAR: 'jkap', flex: 'john', smg: 'slacked', smg2: 'octane' },
    {
      teamRating: 89,
      placement: 'Major Winner',
      majorWins: 2,
      champsPlacement: 'Top 6',
      isChampsWinner: false,
      accent: '#FACC15',
      tier: 'elite',
    }
  ),
  team(
    'lg-2019',
    'Luminosity Gaming',
    2019,
    'Black Ops 4',
    'CWL Fort Worth winners',
    'NA',
    { mainAR: 'formal', flex: 'classic', smg: 'slacked', smg2: 'gunless' },
    {
      teamRating: 91,
      placement: 'Major Winner',
      majorWins: 3,
      champsPlacement: 'Top 4',
      isChampsWinner: false,
      accent: '#FACC15',
      tier: 'legendary',
    }
  ),
  team(
    'seattle-2020',
    'Seattle Surge',
    2020,
    'Modern Warfare',
    'CDL inaugural season',
    'NA',
    { mainAR: 'octane', flex: 'apathy-sea', smg: 'slacked', smg2: 'prestinni' },
    {
      teamRating: 84,
      placement: 'Major Finalist',
      majorWins: 0,
      champsPlacement: 'Top 8',
      isChampsWinner: false,
      accent: '#00A651',
      era: 'cdl',
      tier: 'solid',
    }
  ),
  // Trap cards — bottom-tier seasons (82-0 / 20-0 style variance)
  team('guerrillas-2020', 'Los Angeles Guerrillas', 2020, 'Modern Warfare', 'CDL inaugural flop', 'NA', {
    mainAR: 'assault',
    flex: 'gunless',
    smg: 'apathy-sea',
    smg2: 'lacefield',
  }, {
    teamRating: 76,
    placement: 'Missed Champs',
    majorWins: 0,
    champsPlacement: 'Top 12',
    isChampsWinner: false,
    accent: '#7AC943',
    tier: 'underdog',
  }),
  team('paris-2021', 'Paris Legion', 2021, 'Cold War', 'Missed playoffs', 'EU', ['harry', 'feelo', 'mettalz', 'decemate'], {
    teamRating: 74,
    placement: 'Missed Playoffs',
    majorWins: 0,
    champsPlacement: 'Top 12',
    isChampsWinner: false,
    accent: '#1B3A6B',
    tier: 'underdog',
  }),
  team('legion-2023', 'Las Vegas Legion', 2023, 'Modern Warfare II', 'Bottom of CDL', 'NA', ['lunarz', 'feelo', 'beans', 'neptune'], {
    teamRating: 73,
    placement: 'Missed Playoffs',
    majorWins: 0,
    champsPlacement: 'Top 12',
    isChampsWinner: false,
    accent: '#C4A000',
    tier: 'underdog',
  }),
  team('florida-2022', 'Florida Mutineers', 2022, 'Vanguard', 'Inconsistent season', 'NA', {
    mainAR: 'majormaniak',
    flex: 'methodz',
    smg: 'vivid',
    smg2: 'havoc',
  }, {
    teamRating: 78,
    placement: 'Missed Champs',
    majorWins: 0,
    champsPlacement: 'Top 10',
    isChampsWinner: false,
    accent: '#FF6B00',
    tier: 'underdog',
  }),
  team('surge-2021', 'Seattle Surge', 2021, 'Cold War', 'Down year after hype', 'NA', {
    mainAR: 'octane',
    flex: 'apathy-sea',
    smg: 'prestinni',
    smg2: 'diamondcon',
  }, {
    teamRating: 79,
    placement: 'Missed Playoffs',
    majorWins: 0,
    champsPlacement: 'Top 10',
    isChampsWinner: false,
    accent: '#00A651',
    tier: 'underdog',
  }),
  team('rokkr-2022', 'Minnesota ROKKR', 2022, 'Vanguard', 'Slump after Major I win', 'NA', {
    mainAR: 'majormaniak',
    flex: 'attach',
    smg: 'priestahh',
    smg2: 'ghosty',
  }, {
    teamRating: 77,
    placement: 'Missed Champs',
    majorWins: 0,
    champsPlacement: 'Top 8',
    isChampsWinner: false,
    accent: '#5C2D91',
    tier: 'underdog',
  }),
  team('ravens-2021', 'London Royal Ravens', 2021, 'Cold War', 'Pre-rebuild roster', 'EU', ['nastie', 'nexus', 'harry', 'reality'], {
    teamRating: 75,
    placement: 'Missed Playoffs',
    majorWins: 0,
    champsPlacement: 'Top 12',
    isChampsWinner: false,
    accent: '#5B2C6F',
    tier: 'underdog',
  }),
  team('mutineers-2020', 'Florida Mutineers', 2020, 'Modern Warfare', 'Early CDL struggles', 'NA', {
    mainAR: 'methodz',
    flex: 'enable',
    smg: 'havoc',
    smg2: 'neptune',
  }, {
    teamRating: 76,
    placement: 'Missed Champs',
    majorWins: 0,
    champsPlacement: 'Top 12',
    isChampsWinner: false,
    accent: '#FF6B00',
    tier: 'underdog',
  }),
  team('miami-2024', 'Miami Heretics', 2024, 'Modern Warfare III', 'Expansion growing pains', 'NA', {
    mainAR: 'mettalz',
    flex: 'reality',
    smg: 'beans',
    smg2: 'lunarz',
  }, {
    teamRating: 74,
    placement: 'Missed Playoffs',
    majorWins: 0,
    champsPlacement: 'Top 12',
    isChampsWinner: false,
    accent: '#E63946',
    tier: 'underdog',
  }),
  team('cloud9-2017', 'Cloud9', 2017, 'Infinite Warfare', 'Superteam that flopped', 'NA', {
    mainAR: 'methodz',
    flex: 'aches',
    smg: 'enable',
    smg2: 'haggy',
  }, {
    teamRating: 80,
    placement: 'Missed Champs',
    majorWins: 0,
    champsPlacement: 'Top 8',
    isChampsWinner: false,
    accent: '#00AEEF',
    tier: 'underdog',
  }),
];

export function getAllTeams(): HistoricalCodTeam[] {
  return COD_TEAMS;
}

export function getTeamById(id: string): HistoricalCodTeam | undefined {
  return COD_TEAMS.find((t) => t.id === id);
}

export function getValidTeams(filter?: (t: HistoricalCodTeam) => boolean): HistoricalCodTeam[] {
  const teams = COD_TEAMS.filter((t) => Object.keys(t.roster).length >= 4);
  return filter ? teams.filter(filter) : teams;
}
