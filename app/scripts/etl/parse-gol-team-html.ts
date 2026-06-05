import * as cheerio from 'cheerio';

export interface GolTeamRosterRow {
  golPlayerId: number;
  name: string;
  role: string;
  kda: number;
  killParticipation: number;
  damagePct: number;
  goldPct: number;
}

function parsePct(raw: string): number {
  const m = raw.match(/([\d.]+)%/);
  return m ? parseFloat(m[1]) : 0;
}

function parseNum(raw: string): number {
  if (!raw || raw === '-') return 0;
  const n = parseFloat(raw.replace(/%/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}

function pctFromCell($: cheerio.CheerioAPI, cell: cheerio.Cheerio<cheerio.AnyNode>): number {
  const span = cell.find('span').first().text().trim();
  if (span.includes('%')) return parsePct(span);
  return parsePct(cell.text());
}

export function parseGolTeamRoster(html: string): GolTeamRosterRow[] {
  const $ = cheerio.load(html);
  const caption = $("table caption:contains(\"player's stats\")").first();
  const table = caption.closest('table');
  if (!table.length) return [];

  const rows: GolTeamRosterRow[] = [];

  table.find('tbody tr').each((_, tr) => {
    const cells = $(tr).find('td');
    if (cells.length < 6) return;

    const roleText = cells.eq(0).text().trim();
    if (!roleText || roleText.includes('line-up')) return;

    const link = cells.eq(1).find('a[href*="player-stats"]').first();
    const href = link.attr('href') ?? '';
    const idMatch = href.match(/player-stats\/(\d+)\//);
    if (!idMatch) return;

    const kda = parseNum(cells.eq(2).text());
    const kp = parsePct(cells.eq(3).text());
    const dmg = pctFromCell($, cells.eq(5));
    const gold = cells.length > 6 ? pctFromCell($, cells.eq(6)) : 0;

    rows.push({
      golPlayerId: parseInt(idMatch[1], 10),
      name: link.text().trim(),
      role: roleText.replace(/\s+/g, ' '),
      kda,
      killParticipation: kp,
      damagePct: dmg,
      goldPct: gold,
    });
  });

  return rows;
}

export const GOL_TEAM_STATS_URL = (golTeamId: number) =>
  `https://gol.gg/teams/team-stats/${golTeamId}/split-ALL/tournament-ALL/`;
