import type { CodPlayer, HistoricalCodTeam } from '../core/types';
import type { TeamYearAccomplishment } from './accomplishment';
import { resolveTeamYearHeadshots } from './headshot-resolve';
import { lookupPlayerHeadshot } from './headshot-index';
import teamYearBundle from './generated/team-year-ratings.json';

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

export interface TeamYearRatingsEntry {
  teamId: string;
  playerId: string;
  seasonId: number;
  calendarYear: number;
  bpPlayerId?: number;
  bpTag?: string;
  headshot?: string | null;
  source: 'bp-stats' | 'estimated' | 'curated-audit';
  accomplishment: TeamYearAccomplishment;
  stats: TeamYearBpStats;
  overall: number;
}

interface TeamYearRatingsBundle {
  source: string;
  generatedAt: string;
  entryCount: number;
  entries: Record<string, TeamYearRatingsEntry>;
}

const bundle = teamYearBundle as TeamYearRatingsBundle;

function entryKey(teamId: string, playerId: string) {
  return `${teamId}:${playerId}`;
}

export function hasTeamYearRatings(): boolean {
  return bundle.entryCount > 0;
}

export function getTeamYearMeta(): {
  source: string;
  generatedAt: string;
  count: number;
} | null {
  if (!hasTeamYearRatings()) return null;
  return {
    source: bundle.source,
    generatedAt: bundle.generatedAt,
    count: bundle.entryCount,
  };
}

export function getTeamYearEntry(
  teamId: string,
  playerId: string
): TeamYearRatingsEntry | null {
  return bundle.entries[entryKey(teamId, playerId)] ?? null;
}

export function getTeamYearOverall(
  teamId: string,
  playerId: string
): number | null {
  return getTeamYearEntry(teamId, playerId)?.overall ?? null;
}

export function getPlayerHeadshot(player: CodPlayer, team?: HistoricalCodTeam): string | null {
  const entry = team ? getTeamYearEntry(team.id, player.id) : null;
  const generic = lookupPlayerHeadshot(player.id, player.gamertag, entry?.bpTag);

  if (!team) return generic;

  const urls = resolveTeamYearHeadshots(
    player,
    team,
    entry?.headshot,
    generic,
    entry?.bpTag
  );
  return urls[0] ?? null;
}

export function getPlayerHeadshotCandidates(
  player: CodPlayer,
  team?: HistoricalCodTeam
): string[] {
  const entry = team ? getTeamYearEntry(team.id, player.id) : null;
  const generic = lookupPlayerHeadshot(player.id, player.gamertag, entry?.bpTag);
  if (!team) return generic ? [generic] : [];
  return resolveTeamYearHeadshots(player, team, entry?.headshot, generic, entry?.bpTag);
}

export function formatKd(kd: number): string {
  return kd.toFixed(2);
}

export interface CardStatBreakdown {
  kd: number;
  bpRating: number;
  maps: number;
  kills: number;
  deaths: number;
  hardpoint?: ModeSlice;
  snd?: ModeSlice;
  control?: ModeSlice;
  source: 'bp-stats' | 'estimated' | 'curated-audit';
  accomplishment: TeamYearAccomplishment;
}

export function getCardStatBreakdown(
  player: CodPlayer,
  team: HistoricalCodTeam
): CardStatBreakdown | null {
  const entry = getTeamYearEntry(team.id, player.id);
  if (!entry) return null;
  return {
    ...entry.stats,
    source: entry.source,
    accomplishment: entry.accomplishment,
  };
}

export { scaleRatingsFromOverall } from '../engine/team-year-ovr';
