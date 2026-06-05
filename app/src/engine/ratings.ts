import type { Player, StageId } from '@/core/types';

/** Soft cap so stacked legend rosters do not run away with sim win rate */
function compressStagePower(raw: number): number {
  const knee = 76;
  const factor = 0.65;
  if (raw <= knee) return raw;
  return knee + (raw - knee) * factor;
}

/** Weight ratings by stage emphasis */
const STAGE_WEIGHTS: Record<StageId, Partial<keyof Player['ratings']>> = {
  spring: 'consistency',
  msi: 'international',
  summer: 'consistency',
  worlds: 'clutch',
};

export function computeRosterScore(players: Player[]): number {
  if (players.length === 0) return 0;

  const avg = (key: keyof Player['ratings']) =>
    players.reduce((s, p) => s + p.ratings[key], 0) / players.length;

  const overall = avg('overall');
  const peak = avg('peak');
  const synergy = avg('synergy');
  const leadership = avg('leadership');
  const intl = avg('international');

  // Region synergy bonus (same region pairs)
  const regions = players.map((p) => p.region);
  const regionClusters = new Map<string, number>();
  for (const r of regions) {
    regionClusters.set(r, (regionClusters.get(r) ?? 0) + 1);
  }
  const maxCluster = Math.max(...regionClusters.values());
  const regionBonus = maxCluster >= 4 ? 3 : maxCluster >= 3 ? 1.5 : 0;

  const raw =
    overall * 0.35 +
    peak * 0.15 +
    synergy * 0.2 +
    leadership * 0.1 +
    intl * 0.2 +
    regionBonus;

  return Math.round(Math.min(99.9, raw) * 10) / 10;
}

export function stageTeamPower(
  players: Player[],
  stage: StageId
): number {
  const focus = STAGE_WEIGHTS[stage];
  const avg = (key: keyof Player['ratings']) =>
    players.reduce((s, p) => s + p.ratings[key], 0) / players.length;

  const base = avg('overall');
  const focused = focus ? avg(focus) : base;
  const intl = stage === 'msi' || stage === 'worlds' ? avg('international') : avg('consistency');
  const clutch = stage === 'worlds' ? avg('clutch') : 0;

  const avgWorldTitles =
    players.reduce((s, p) => s + p.worldTitles, 0) / players.length;
  const worldsBoost =
    stage === 'worlds' ? Math.min(2.5, avgWorldTitles * 0.45) : 0;

  const raw =
    base * 0.4 + focused * 0.35 + intl * 0.2 + clutch * 0.05 + worldsBoost;
  return compressStagePower(raw);
}

export function countTitles(players: Player[]) {
  return {
    domestic: players.reduce((s, p) => s + p.domesticTitles, 0),
    msi: players.reduce((s, p) => s + p.msiTitles, 0),
    worlds: players.reduce((s, p) => s + p.worldTitles, 0),
  };
}
