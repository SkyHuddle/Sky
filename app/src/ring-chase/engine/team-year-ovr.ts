import type { CodPlayer, HistoricalCodTeam, PlayerRatings } from '../core/types';
import type { TeamYearAccomplishment } from '../data/accomplishment';
import { ACCOMPLISHMENT_TUNING } from '../data/accomplishment';
import { getPlayerById } from '../data/players';
import { rosterPlayerIds } from '../data/roster-slots';
import type { EstimatedSlotOverride } from '../data/estimated-slot-overrides';

export interface ModeSlice {
  kd: number;
  bpRating: number;
  maps: number;
}

export interface TeamYearBpStats {
  kd: number;
  bpRating: number;
  maps: number;
  kills: number;
  deaths: number;
  hardpoint?: ModeSlice;
  snd?: ModeSlice;
  control?: ModeSlice;
}

/** Maps needed before BP stats fully drive OVR */
export const MIN_BP_MAPS_FULL = 40;
/** Minimum maps to use BP-backed stats at all */
export const MIN_BP_MAPS_THIN = 12;

export type TeamYearSource = 'bp-stats' | 'estimated' | 'curated-audit';

export function curatedOverall(
  player: CodPlayer,
  team: HistoricalCodTeam,
  accomplishment: TeamYearAccomplishment
): number {
  const rosterIds = rosterPlayerIds(team.roster);
  const roster = rosterIds.map((id) => getPlayerById(id)).filter((p): p is CodPlayer => p != null);
  const seedAvg =
    roster.length > 0
      ? roster.reduce((sum, p) => sum + p.ratings.overall, 0) / roster.length
      : player.ratings.overall;
  const delta = player.ratings.overall - seedAvg;
  const tuning = ACCOMPLISHMENT_TUNING[accomplishment];
  const raw = team.teamRating + delta * 0.9 + tuning.ovrBonus;
  return Math.round(Math.min(99, Math.max(tuning.floor, raw)));
}

/** What the stat line alone suggests for OVR on this team-year */
export function statLineOverall(
  stats: TeamYearBpStats,
  team: HistoricalCodTeam
): number {
  const volume = Math.min(2, stats.maps / 120);
  const raw =
    team.teamRating +
    (stats.bpRating - 1) * 16 +
    (stats.kd - 1) * 10 +
    volume;
  return Math.round(Math.min(99, Math.max(72, raw)));
}

/**
 * Blend team/roster context with BP stats. Thin samples lean on curated;
 * solid samples lean on the stat line.
 */
export function overallFromStats(
  stats: TeamYearBpStats,
  player: CodPlayer,
  team: HistoricalCodTeam,
  accomplishment: TeamYearAccomplishment,
  overrideOverall?: number
): number {
  if (overrideOverall != null) return overrideOverall;

  const tuning = ACCOMPLISHMENT_TUNING[accomplishment];
  const curated = curatedOverall(player, team, accomplishment);

  if (stats.maps <= 0) {
    return curated;
  }

  const sampleW = Math.min(
    1,
    Math.max(0, (stats.maps - MIN_BP_MAPS_THIN) / (MIN_BP_MAPS_FULL - MIN_BP_MAPS_THIN))
  );
  const statLine = statLineOverall(stats, team);

  const bpLift =
    ((stats.bpRating - 1) * 14 + (stats.kd - 1) * 8) *
    sampleW *
    Math.min(1, stats.maps / MIN_BP_MAPS_FULL);
  const volume = Math.min(1.2, Math.max(0, (stats.maps - 50) / 200)) * sampleW;

  let raw = curated * (1 - sampleW * 0.6) + statLine * (sampleW * 0.6) + bpLift + volume;

  // Weak stat lines shouldn't inherit a dynasty floor
  if (stats.kd < 1.0 && stats.bpRating < 1.02) {
    raw = Math.min(raw, statLine + 2, curated);
  }

  // Thin samples cap how far above stat line you can float
  if (stats.maps < MIN_BP_MAPS_FULL) {
    const thinCap = statLine + 3 + sampleW * 4;
    raw = Math.min(raw, thinCap);
  }

  // Trap / weak team-years stay near team rating
  if (team.tier === 'underdog') {
    raw = Math.min(raw, team.teamRating + 3);
  } else if (team.tier === 'solid') {
    raw = Math.min(raw, team.teamRating + 5);
  }

  return Math.round(Math.min(99, Math.max(tuning.floor, raw)));
}

export function resolveSlotRatings(input: {
  player: CodPlayer;
  team: HistoricalCodTeam;
  accomplishment: TeamYearAccomplishment;
  bpAgg: TeamYearBpStats | null;
  override?: EstimatedSlotOverride;
}): { source: TeamYearSource; stats: TeamYearBpStats; overall: number } {
  const { player, team, accomplishment, bpAgg, override } = input;

  if (override) {
    const stats: TeamYearBpStats = {
      kd: override.kd,
      bpRating: override.bpRating,
      maps: override.maps,
      kills: Math.round(override.kd * override.maps * 10),
      deaths: Math.round(override.maps * 10),
    };
    return {
      source: 'curated-audit',
      stats,
      overall: overallFromStats(stats, player, team, accomplishment, override.overall),
    };
  }

  if (bpAgg && bpAgg.maps >= MIN_BP_MAPS_THIN) {
    return {
      source: 'bp-stats',
      stats: bpAgg,
      overall: overallFromStats(bpAgg, player, team, accomplishment),
    };
  }

  return {
    source: 'estimated',
    stats: {
      kd: 1,
      bpRating: 1,
      maps: 0,
      kills: 0,
      deaths: 0,
    },
    overall: curatedOverall(player, team, accomplishment),
  };
}

export function scaleRatingsFromOverall(
  base: PlayerRatings,
  overall: number
): PlayerRatings {
  const scale = overall / Math.max(base.overall, 1);
  const scaled = { ...base };
  for (const key of Object.keys(scaled) as (keyof PlayerRatings)[]) {
    if (key === 'overall') continue;
    scaled[key] = Math.round(scaled[key] * scale * 10) / 10;
  }
  scaled.overall = overall;
  return scaled;
}
