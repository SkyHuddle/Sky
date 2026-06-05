import type { CodPlayer, DailyConstraint, DraftPick, HistoricalCodTeam } from '../core/types';

export function getDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

const DAILY_CONSTRAINTS: DailyConstraint[] = [
  {
    id: 'standard',
    title: 'Daily Ring Chase',
    description: 'Same four iconic teams for everyone. One official attempt.',
  },
  {
    id: 'no-rings',
    title: 'No Ring Winners',
    description: 'Cannot draft any player with a championship ring.',
    pickFilter: (player) => player.rings === 0,
  },
  {
    id: 'one-optic',
    title: 'One OpTic Player',
    description: 'Maximum one player from OpTic organization history.',
    pickFilter: (player, picks) => {
      const opticPicks = picks.filter((p) => p.player.organization.toLowerCase().includes('optic')).length;
      if (player.organization.toLowerCase().includes('optic') && opticPicks >= 1) return false;
      return true;
    },
  },
  {
    id: 'one-faze',
    title: 'One FaZe Player',
    description: 'Maximum one FaZe player on your roster.',
    pickFilter: (player, picks) => {
      const fazePicks = picks.filter((p) => p.player.organization.toLowerCase().includes('faze')).length;
      if (player.organization.toLowerCase().includes('faze') && fazePicks >= 1) return false;
      return true;
    },
  },
  {
    id: 'cdl-only',
    title: 'CDL Era Only',
    description: 'Only teams from the CDL era (2020+).',
    filter: (ctx) => ctx.team.era === 'cdl',
  },
  {
    id: 'pre-cdl',
    title: 'Pre-CDL Legends',
    description: 'Only classic teams before the CDL.',
    filter: (ctx) => ctx.team.era === 'pre-cdl',
  },
  {
    id: 'one-per-org',
    title: 'One Per Organization',
    description: 'No two players from the same org.',
    pickFilter: (player, picks) => !picks.some((p) => p.player.organization === player.organization),
  },
  {
    id: 'no-mvp',
    title: 'No MVP Winners',
    description: 'MVP award winners are off limits.',
    pickFilter: (player) => player.mvpAwards === 0,
  },
  {
    id: 'champs-teams',
    title: 'Champs-Winning Teams',
    description: 'Only teams that won Champs that year.',
    filter: (ctx) => ctx.team.isChampsWinner,
  },
  {
    id: 'champs-losers',
    title: 'Champs Losers',
    description: 'Teams that fell short at Champs.',
    filter: (ctx) => !ctx.team.isChampsWinner,
  },
  {
    id: 'underdogs',
    title: 'Underdog Rosters',
    description: 'Solid and underdog tier teams only.',
    filter: (ctx) => ctx.team.tier === 'solid' || ctx.team.tier === 'underdog',
  },
  {
    id: 'one-legend',
    title: 'One Legend, Three Stars',
    description: 'Max one player rated 94+ overall.',
    pickFilter: (player, picks) => {
      const legends = picks.filter((p) => p.player.ratings.overall >= 94).length;
      if (player.ratings.overall >= 94 && legends >= 1) return false;
      return true;
    },
  },
  {
    id: 'snd-meta',
    title: 'SnD-Heavy Meta',
    description: 'Favor Search & Destroy specialists.',
    filter: (ctx) => ctx.roster.some((p) => p.ratings.snd >= 90),
  },
  {
    id: 'respawn-meta',
    title: 'Respawn-Heavy Meta',
    description: 'Teams built for HP/Control.',
    filter: (ctx) => ctx.roster.some((p) => p.ratings.respawn >= 90),
  },
  {
    id: 'no-top5',
    title: 'No Top 5 Rated',
    description: 'Cannot pick players rated 95+ overall.',
    pickFilter: (player) => player.ratings.overall < 95,
  },
  {
    id: 'no-ar-stars',
    title: 'No AR Superstars',
    description: 'Main AR players rated 92+ are banned.',
    pickFilter: (player) => !(player.primaryRole === 'mainAR' && player.ratings.overall >= 92),
  },
  {
    id: 'no-smg-stars',
    title: 'No SMG Superstars',
    description: 'SMG players rated 93+ are banned.',
    pickFilter: (player) => !(player.primaryRole === 'smg' && player.ratings.overall >= 93),
  },
  {
    id: 'major-winners',
    title: 'Major Winners Only',
    description: 'Only players with at least one Major win.',
    pickFilter: (player) => player.majorWins >= 1,
  },
  {
    id: 'ringless',
    title: 'Ringless Grinders',
    description: 'Only players without a ring.',
    pickFilter: (player) => player.rings === 0,
  },
  {
    id: 'na-only',
    title: 'NA Legends',
    description: 'North American teams only.',
    filter: (ctx) => ctx.team.region === 'NA',
  },
  {
    id: 'iconic-only',
    title: 'Iconic Rosters',
    description: 'Only legendary and elite team cards.',
    filter: (ctx) => ctx.team.tier === 'legendary' || ctx.team.tier === 'elite',
  },
  {
    id: 'dynasty',
    title: 'Dynasty Era',
    description: 'OpTic, FaZe, or Empire championship teams.',
    filter: (ctx) => ['optic-2017', 'faze-2021', 'empire-2020', 'optic-2016', 'faze-2022'].includes(ctx.team.id),
  },
  {
    id: 'smg-only-picks',
    title: 'SMG Slayers',
    description: 'Must pick SMG-primary players.',
    pickFilter: (player) => player.primaryRole === 'smg' || player.secondaryRole === 'smg',
  },
  {
    id: 'ar-only-picks',
    title: 'AR Anchors',
    description: 'Must pick AR-primary players.',
    pickFilter: (player) => player.primaryRole === 'mainAR' || player.secondaryRole === 'mainAR',
  },
  {
    id: 'no-simp',
    title: 'No Simp',
    description: 'Simp cannot be drafted today.',
    pickFilter: (player) => player.gamertag !== 'Simp',
  },
  {
    id: 'no-scump',
    title: 'No Scump',
    description: 'The King is off limits.',
    pickFilter: (player) => player.gamertag !== 'Scump',
  },
  {
    id: 'flex-required',
    title: 'Flex Required',
    description: 'Must draft at least one flex player by round 4.',
    pickFilter: () => true,
  },
  {
    id: 'leaders-only',
    title: 'Leaders Only',
    description: 'Only players with 88+ leadership.',
    pickFilter: (player) => player.ratings.leadership >= 88,
  },
  {
    id: 'lan-demons',
    title: 'LAN Demons',
    description: 'Only players with 88+ LAN rating.',
    pickFilter: (player) => player.ratings.lan >= 88,
  },
  {
    id: 'hungry',
    title: 'Hungry Dogs',
    description: 'No player with 2+ rings allowed.',
    pickFilter: (player) => player.rings < 2,
  },
  {
    id: 'wildcard',
    title: 'Wildcard Wednesday',
    description: 'Underdog teams get a boost today.',
    filter: (ctx) => ctx.team.tier !== 'legendary',
  },
];

export function getDailyConstraint(): DailyConstraint {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return DAILY_CONSTRAINTS[dayOfYear % DAILY_CONSTRAINTS.length];
}

export function getDailyChallengeNumber(): number {
  const start = new Date('2026-01-01').getTime();
  return Math.floor((Date.now() - start) / 86400000) + 1;
}

export function teamPassesFilter(
  team: HistoricalCodTeam,
  roster: CodPlayer[],
  constraint: DailyConstraint
): boolean {
  if (!constraint.filter) return true;
  return constraint.filter({ team, roster });
}

export function playerPassesFilter(
  player: CodPlayer,
  picks: DraftPick[],
  constraint: DailyConstraint
): boolean {
  if (!constraint.pickFilter) return true;
  return constraint.pickFilter(player, picks);
}

export function estimatePercentile(score: number, ringWon: boolean, perfectSeason: boolean): number {
  let base = Math.min(97, Math.max(8, (score - 72) * 2.8));
  if (ringWon) base = Math.min(99, base + 18);
  if (perfectSeason) base = 99;
  return Math.round(base);
}
