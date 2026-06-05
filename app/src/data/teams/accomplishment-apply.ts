import type { PlayerRatings } from '@/core/types';
import {
  type TeamYearAccomplishment,
  ACCOMPLISHMENT_TUNING,
} from './accomplishment';

function clamp(n: number, min: number, max: number): number {
  return Math.round(Math.min(max, Math.max(min, n)));
}

/** Layer team-year achievement on top of stat-derived ratings */
export function applyAccomplishmentToRatings(
  ratings: PlayerRatings,
  accomplishment: TeamYearAccomplishment
): PlayerRatings {
  const tune = ACCOMPLISHMENT_TUNING[accomplishment];
  const overall = clamp(
    Math.max(ratings.overall + tune.bonus, tune.floor),
    52,
    97
  );
  const peak = clamp(Math.max(ratings.peak + tune.bonus, overall + 1), overall, 98);
  const international = clamp(ratings.international + tune.intlBonus, 50, 96);
  const clutch = clamp(ratings.clutch + Math.floor(tune.bonus / 2), 50, 95);

  return {
    overall,
    peak,
    international,
    clutch,
    consistency: ratings.consistency,
    leadership: ratings.leadership,
    synergy: ratings.synergy,
  };
}
