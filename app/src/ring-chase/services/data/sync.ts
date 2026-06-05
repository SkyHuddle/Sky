import type { BpSyncResult } from '../breakingpoint/types';
import { breakingpointClient } from '../breakingpoint/client';
import { COD_PLAYERS } from '../../data/players';
import { COD_TEAMS } from '../../data/teams';

/**
 * Data sync orchestrator.
 * Production: scheduled cron → BreakingPoint API → normalized DB → rating calc.
 * V1: seeded fallback database bundled with the app.
 */
export async function syncBreakingPointData(): Promise<BpSyncResult> {
  try {
    const [players, teams, events] = await Promise.all([
      breakingpointClient.getPlayers(),
      breakingpointClient.getTeams(),
      breakingpointClient.getEvents(),
    ]);

    return {
      syncedAt: new Date().toISOString(),
      players: players.length,
      teams: teams.length,
      events: events.length,
      source: 'api',
    };
  } catch {
    return {
      syncedAt: new Date().toISOString(),
      players: COD_PLAYERS.length,
      teams: COD_TEAMS.length,
      events: 0,
      source: 'seed',
    };
  }
}
