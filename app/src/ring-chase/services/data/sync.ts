import type { BpPlayerSeasonAggregate, BpSyncResult } from '../breakingpoint/types';
import { breakingpointClient } from '../breakingpoint/client';
import { COD_PLAYERS } from '../../data/players';
import { COD_TEAMS } from '../../data/teams';

function aggregateStats(
  rows: Awaited<ReturnType<typeof breakingpointClient.getPlayerStatsForSeason>>
): BpPlayerSeasonAggregate[] {
  const byPlayer = new Map<number, BpPlayerSeasonAggregate & { _kills: number; _deaths: number; _damage: number; _minutes: number; _bpSum: number; _hpK: number; _hpD: number; _sndK: number; _sndD: number; _ctlK: number; _ctlD: number }>();

  for (const row of rows) {
    const cur = byPlayer.get(row.player_id) ?? {
      playerId: row.player_id,
      tag: row.player_tag,
      seasonId: row.season_id,
      maps: 0,
      kd: 0,
      bpRating: 0,
      slayerRating: 0,
      hpKd: 0,
      sndKd: 0,
      ctlKd: 0,
      damagePer10: 0,
      killsPer10: 0,
      _kills: 0,
      _deaths: 0,
      _damage: 0,
      _minutes: 0,
      _bpSum: 0,
      _hpK: 0,
      _hpD: 0,
      _sndK: 0,
      _sndD: 0,
      _ctlK: 0,
      _ctlD: 0,
    };

    cur.maps += 1;
    cur._kills += row.kills ?? 0;
    cur._deaths += row.deaths ?? 0;
    cur._damage += row.damage ?? 0;
    cur._minutes += (row.gametime_min ?? 0) + (row.gametime_sec ?? 0) / 60;
    cur._bpSum += row.bp_rating ?? 0;

    if (row.mode_id === 1) {
      cur._hpK += row.kills ?? 0;
      cur._hpD += row.deaths ?? 0;
    } else if (row.mode_id === 2) {
      cur._sndK += row.kills ?? 0;
      cur._sndD += row.deaths ?? 0;
    } else if (row.mode_id === 3) {
      cur._ctlK += row.kills ?? 0;
      cur._ctlD += row.deaths ?? 0;
    }

    byPlayer.set(row.player_id, cur);
  }

  return [...byPlayer.values()].map((p) => {
    const kd = p._deaths > 0 ? p._kills / p._deaths : p._kills;
    const minutes = Math.max(p._minutes, 1);
    return {
      playerId: p.playerId,
      tag: p.tag,
      seasonId: p.seasonId,
      maps: p.maps,
      kd: Math.round(kd * 1000) / 1000,
      bpRating: Math.round((p._bpSum / Math.max(p.maps, 1)) * 1000) / 1000,
      slayerRating: Math.round(kd * 100) / 100,
      hpKd: p._hpD > 0 ? Math.round((p._hpK / p._hpD) * 1000) / 1000 : 0,
      sndKd: p._sndD > 0 ? Math.round((p._sndK / p._sndD) * 1000) / 1000 : 0,
      ctlKd: p._ctlD > 0 ? Math.round((p._ctlK / p._ctlD) * 1000) / 1000 : 0,
      damagePer10: Math.round((p._damage / minutes) * 10 * 10) / 10,
      killsPer10: Math.round((p._kills / minutes) * 10 * 10) / 10,
    };
  });
}

/**
 * Sync BreakingPoint Supabase → normalized aggregates.
 * Gameplay reads cached JSON, not live API.
 */
export async function syncBreakingPointData(seasonId = 2026): Promise<{
  result: BpSyncResult;
  aggregates: BpPlayerSeasonAggregate[];
}> {
  try {
    const ping = await breakingpointClient.ping();
    if (!ping.ok) throw new Error('BreakingPoint Supabase unreachable');

    const [players, teams] = await Promise.all([
      breakingpointClient.getPlayers({ limit: 1000 }),
      breakingpointClient.getTeams({ limit: 500 }),
    ]);

    const statRows: Awaited<ReturnType<typeof breakingpointClient.getPlayerStatsForSeason>> = [];
    const pageSize = 1000;
    for (let offset = 0; offset < 15000; offset += pageSize) {
      const batch = await breakingpointClient.getPlayerStatsForSeason(seasonId, pageSize, offset);
      if (batch.length === 0) break;
      statRows.push(...batch);
      if (batch.length < pageSize) break;
    }

    const aggregates = aggregateStats(statRows);

    return {
      result: {
        syncedAt: new Date().toISOString(),
        players: players.length,
        teams: teams.length,
        statRows: statRows.length,
        seasonId,
        source: 'supabase',
      },
      aggregates,
    };
  } catch {
    return {
      result: {
        syncedAt: new Date().toISOString(),
        players: COD_PLAYERS.length,
        teams: COD_TEAMS.length,
        statRows: 0,
        seasonId,
        source: 'seed',
      },
      aggregates: [],
    };
  }
}
