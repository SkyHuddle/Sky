import type { GolPlayerStats } from './types';

function cellValue(html: string, label: string): string | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const simple = new RegExp(
    `<tr><td class="text-right">${escaped}: </td><td class='text-center'>([^<]+)</td></tr>`
  );
  const m = html.match(simple);
  if (m) return m[1].trim();

  const complex = new RegExp(
    `<tr><td class="text-right">${escaped}: </td><td class='text-center'>[\\s\\S]*?position-absolute'[^>]*>([^<]+)</div>`
  );
  const m2 = html.match(complex);
  return m2 ? m2[1].trim() : null;
}

function parseNum(raw: string | null): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/%/g, '').replace(/\+/g, '').trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function parseGolPlayerHtml(golId: number, html: string): GolPlayerStats | null {
  const title = html.match(/<title>([^<]+) stats - Games of Legends<\/title>/i);
  const name = title?.[1]?.trim() ?? `player-${golId}`;

  const record = cellValue(html, 'Record');
  let recordWins = 0;
  let recordLosses = 0;
  if (record) {
    const rm = record.match(/(\d+)W\s*-\s*(\d+)L/i);
    if (rm) {
      recordWins = parseInt(rm[1], 10);
      recordLosses = parseInt(rm[2], 10);
    }
  }

  const winRate = parseNum(cellValue(html, 'Win Rate'));
  const kda = parseNum(cellValue(html, 'KDA'));
  const csPerMin = parseNum(cellValue(html, 'CS per Minute'));
  const goldPerMin = parseNum(cellValue(html, 'Gold Per Minute'));
  const goldPct = parseNum(cellValue(html, 'Gold%'));
  const killParticipation = parseNum(cellValue(html, 'Kill Participation'));
  const damagePerMin = parseNum(cellValue(html, 'Damage Per Minute'));
  const damagePct = parseNum(cellValue(html, 'Damage%'));
  const csdAt15 = parseNum(cellValue(html, 'CS Differential at 15 min'));

  if (!winRate && !kda && !recordWins) return null;

  return {
    golId,
    name,
    recordWins,
    recordLosses,
    games: recordWins + recordLosses,
    winRate,
    kda,
    csPerMin,
    goldPerMin,
    goldPct,
    killParticipation,
    damagePerMin,
    damagePct,
    csdAt15,
    fetchedAt: new Date().toISOString(),
  };
}

export const GOL_PLAYER_STATS_URL = (id: number) =>
  `https://gol.gg/players/player-stats/${id}/season-ALL/split-ALL/tournament-ALL/`;

export const GOL_PLAYER_SEASON_URL = (id: number, season: string) =>
  `https://gol.gg/players/player-stats/${id}/season-${season}/split-ALL/tournament-ALL/`;
