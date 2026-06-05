import type { CodPlayer, DraftPick, HistoricalCodTeam, PlayerRatings } from '../core/types';
import { getAccomplishmentTuning, getCardCredentials } from '../data/accomplishment';
import { resolveTeamRoster } from '../data';
import {
  getCardStatBreakdown,
  getTeamYearEntry,
  getTeamYearMeta,
  scaleRatingsFromOverall,
  type CardStatBreakdown,
} from '../data/team-year-ratings';
import bpMeta from '../data/generated/bp-sync-meta.json';

type BpLegend = { tag?: string; id?: number };
type BpMeta = { syncedAt?: string; source?: string; legends?: BpLegend[] };

const meta = bpMeta as BpMeta;

function formulaOverall(player: CodPlayer, team: HistoricalCodTeam): number {
  const roster = resolveTeamRoster(team);
  if (roster.length === 0) return Math.round(player.ratings.overall);

  const seedAvg = roster.reduce((sum, p) => sum + p.ratings.overall, 0) / roster.length;
  const delta = player.ratings.overall - seedAvg;
  const tuning = getAccomplishmentTuning(team);
  const raw = team.teamRating + delta * 0.9 + tuning.ovrBonus;

  return Math.round(Math.min(99, Math.max(tuning.floor, raw)));
}

/** Gameplay uses BP team-year cards when ETL data exists, else curated formula. */
export function getDataSourceLabel(): string {
  const teamYear = getTeamYearMeta();
  if (teamYear) {
    const date = new Date(teamYear.generatedAt).toLocaleDateString();
    return `BP team-year cards · ${teamYear.count} slots · ${date}`;
  }
  if (meta.source === 'breakingpoint-supabase' && meta.syncedAt) {
    const date = new Date(meta.syncedAt).toLocaleDateString();
    return `Historical cards · BP index synced ${date}`;
  }
  return 'Historical team-year cards';
}

export function hasBpReferenceIndex(): boolean {
  return Boolean(meta.legends?.length) || Boolean(getTeamYearMeta());
}

/**
 * OVR for this player on this specific team-year card.
 * Prefers BreakingPoint season stats when bundled.
 */
export function cardOverall(player: CodPlayer, team: HistoricalCodTeam): number {
  const entry = getTeamYearEntry(team.id, player.id);
  if (entry) return entry.overall;
  return formulaOverall(player, team);
}

export function cardRatings(player: CodPlayer, team: HistoricalCodTeam): PlayerRatings {
  const ovr = cardOverall(player, team);
  return scaleRatingsFromOverall(player.ratings, ovr);
}

export function cardCredentials(team: HistoricalCodTeam) {
  return getCardCredentials(team);
}

export function cardStatBreakdown(
  player: CodPlayer,
  team: HistoricalCodTeam
): CardStatBreakdown | null {
  return getCardStatBreakdown(player, team);
}

export function cardStatConfidence(
  player: CodPlayer,
  team: HistoricalCodTeam
): 'bp-stats' | 'estimated' {
  const entry = getTeamYearEntry(team.id, player.id);
  return entry?.source ?? 'estimated';
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
