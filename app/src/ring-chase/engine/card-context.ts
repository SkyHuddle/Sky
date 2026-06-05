import type { CodPlayer, DraftPick, HistoricalCodTeam, PlayerRatings } from '../core/types';
import { getAccomplishmentTuning, getCardCredentials } from '../data/accomplishment';
import { resolveTeamRoster } from '../data';
import bpMeta from '../data/generated/bp-sync-meta.json';

type BpLegend = { tag?: string; id?: number };
type BpMeta = { syncedAt?: string; source?: string; legends?: BpLegend[] };

const meta = bpMeta as BpMeta;

/** Gameplay uses curated team-year cards. BP JSON is a reference index only — no live API. */
export function getDataSourceLabel(): string {
  if (meta.source === 'breakingpoint-supabase' && meta.syncedAt) {
    const date = new Date(meta.syncedAt).toLocaleDateString();
    return `Historical cards · BP index synced ${date}`;
  }
  return 'Historical team-year cards';
}

export function hasBpReferenceIndex(): boolean {
  return Boolean(meta.legends?.length);
}

/**
 * OVR for this player on this specific team-year card.
 * Anchored to team strength + player profile — not career totals.
 */
export function cardOverall(player: CodPlayer, team: HistoricalCodTeam): number {
  const roster = resolveTeamRoster(team);
  if (roster.length === 0) return Math.round(player.ratings.overall);

  const seedAvg = roster.reduce((sum, p) => sum + p.ratings.overall, 0) / roster.length;
  const delta = player.ratings.overall - seedAvg;
  const tuning = getAccomplishmentTuning(team);
  const raw = team.teamRating + delta * 0.9 + tuning.ovrBonus;

  return Math.round(Math.min(99, Math.max(tuning.floor, raw)));
}

export function cardRatings(player: CodPlayer, team: HistoricalCodTeam): PlayerRatings {
  const ovr = cardOverall(player, team);
  const scale = ovr / Math.max(player.ratings.overall, 1);
  const scaled = { ...player.ratings };

  for (const key of Object.keys(scaled) as (keyof PlayerRatings)[]) {
    if (key === 'overall') continue;
    scaled[key] = Math.round(scaled[key] * scale * 10) / 10;
  }
  scaled.overall = ovr;
  return scaled;
}

export function cardCredentials(team: HistoricalCodTeam) {
  return getCardCredentials(team);
}

export function teamRosterAvgOvr(team: HistoricalCodTeam): number {
  const roster = resolveTeamRoster(team);
  if (roster.length === 0) return 0;
  const sum = roster.reduce((acc, player) => acc + cardOverall(player, team), 0);
  return Math.round((sum / roster.length) * 10) / 10;
}

/** Players with team-year ratings applied — used for sim + odds */
export function simulationPlayers(picks: DraftPick[]): CodPlayer[] {
  return picks.map((pick) => ({
    ...pick.player,
    ratings: cardRatings(pick.player, pick.team),
  }));
}
