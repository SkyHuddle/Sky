import type { HistoricalTeam, Player, PlayerRatings, TeamTier } from '@/core/types';

/**
 * Ratings in the DB reflect career PEAK (manual, esports-informed — not pulled from match APIs).
 * On a draft card we scale down for weak teams, off-peak years, and regional context
 * so CLG 2020 ≠ T1 2016 even if the same player id appears on both.
 */

const TIER_MULTIPLIER: Record<TeamTier, number> = {
  weak: 0.78,
  average: 0.9,
  contender: 0.96,
  legend: 1,
};

function yearMultiplier(teamYear: number, peakYear: number): number {
  const diff = Math.abs(teamYear - peakYear);
  if (diff === 0) return 1;
  if (diff <= 1) return 0.95;
  if (diff <= 2) return 0.9;
  if (diff <= 4) return 0.84;
  return 0.76;
}

function regionIntlModifier(region: string, team: HistoricalTeam): number {
  if (team.tier === 'legend' || team.tier === 'contender') return 1;
  if (region === 'LCK' || region === 'LPL') return 0.98;
  if (region === 'LEC') return 0.94;
  if (region === 'LCS') return 0.9;
  return 0.92;
}

function clampStat(value: number): number {
  return Math.round(Math.min(99, Math.max(52, value)));
}

function scaleRatings(base: PlayerRatings, factor: number): PlayerRatings {
  const s = (v: number) => clampStat(v * factor);
  return {
    overall: s(base.overall),
    peak: s(base.peak),
    international: s(base.international),
    clutch: s(base.clutch),
    consistency: s(base.consistency),
    leadership: s(base.leadership),
    synergy: s(base.synergy),
  };
}

/** Effective stats for this player ON this specific team-year card */
export function computeEffectiveRatings(
  player: Player,
  team: HistoricalTeam
): PlayerRatings {
  const tier = TIER_MULTIPLIER[team.tier];
  const year = yearMultiplier(team.year, player.peakYear);
  const intlRegion = regionIntlModifier(player.region, team);

  const factor = tier * year;

  const scaled = scaleRatings(player.ratings, factor);

  // International stage especially punishes NA/EU weak-era cards
  scaled.international = clampStat(
    player.ratings.international * factor * intlRegion
  );

  // Peak only matters if this card is near their peak year
  if (Math.abs(team.year - player.peakYear) > 3) {
    scaled.peak = clampStat(Math.min(scaled.peak, scaled.overall + 2));
  }

  return scaled;
}

export function effectiveOverall(player: Player, team: HistoricalTeam): number {
  return computeEffectiveRatings(player, team).overall;
}

/** Players as they actually perform for simulation (card context, not career peak) */
export function playersForSimulation(
  picks: { player: Player; team: HistoricalTeam }[]
): Player[] {
  return picks.map(({ player, team }) => ({
    ...player,
    ratings: computeEffectiveRatings(player, team),
  }));
}
