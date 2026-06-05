import type { PlayerRatings, Role } from '../../src/core/types';
import type { GolPlayerStats } from './types';

function clamp(n: number, min: number, max: number): number {
  return Math.round(Math.min(max, Math.max(min, n)));
}

/** Normalize stat to 0–1 vs typical pro career ranges on Gol.gg */
function norm(value: number, low: number, high: number): number {
  if (high <= low) return 0.5;
  return Math.min(1, Math.max(0, (value - low) / (high - low)));
}

/**
 * Career-all stats → Golden Road 55–98 scale.
 * Wider spread than hand-tuned peaks so sim difficulty stays meaningful.
 */
export function computeRatingsFromGol(
  stats: GolPlayerStats,
  role: Role
): PlayerRatings {
  const wr = norm(stats.winRate, 48, 72);
  const kda = norm(stats.kda, 2.2, 5.5);
  const dpm = norm(stats.damagePerMin, 320, 620);
  const gpm = norm(stats.goldPerMin, 340, 460);
  const kp = norm(stats.killParticipation, 52, 72);
  const sample = norm(Math.min(stats.games, 800), 80, 600);
  const lane = norm(stats.csdAt15, -8, 12);

  const isSupport = role === 'support';
  const isCarry = role === 'adc' || role === 'mid';

  const impact =
    wr * 0.28 +
    kda * 0.22 +
    (isSupport ? kp * 0.2 : dpm * 0.2) +
    (isCarry ? dpm * 0.12 : gpm * 0.08) +
    lane * 0.1 +
    sample * 0.1;

  const overall = clamp(55 + impact * 40, 55, 96);
  const peak = clamp(overall + (kda > 0.75 ? 4 : 2) + (wr > 0.7 ? 2 : 0), overall, 98);
  const international = clamp(overall + (wr - 0.5) * 12, 52, 97);
  const clutch = clamp(55 + kda * 28 + wr * 10, 52, 96);
  const consistency = clamp(52 + wr * 38 + sample * 8, 52, 95);
  const leadership = clamp(
    50 + (isSupport || role === 'jungle' ? 12 : 4) + sample * 10 + wr * 8,
    50,
    94
  );
  const synergy = clamp(52 + kp * 35 + wr * 8, 52, 95);

  return {
    overall,
    peak,
    international,
    clutch,
    consistency,
    leadership,
    synergy,
  };
}
