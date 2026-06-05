import type { CodPlayer, HistoricalCodTeam } from '../core/types';

const BP_STORAGE =
  'https://dfpiiufxcciujugzjvgx.supabase.co/storage/v1/object/public/players';

/** Prefer URLs that match the card's calendar year (jersey-era photos on BreakingPoint CDN). */
export function eraHeadshotScore(url: string | null | undefined, calendarYear: number): number {
  if (!url) return -100;
  const lower = url.toLowerCase();
  const yy = String(calendarYear % 100).padStart(2, '0');

  let score = 0;
  if (lower.includes(`cdl_${calendarYear}`) || lower.includes(`cdl_20${yy}`)) score += 60;
  if (lower.includes(`/${calendarYear}/`)) score += 50;
  if (lower.includes(`_${calendarYear}.`)) score += 35;
  if (calendarYear >= 2020 && lower.includes(`/${calendarYear + 1}/`)) score += 20;
  if (lower.includes('/2026/') && calendarYear < 2025) score -= 40;
  if (lower.includes('/m1/') && calendarYear < 2025) score -= 25;
  if (lower.includes('_front.')) score += 10;
  if (lower.includes('cdl_')) score += 8;
  return score;
}

function enc(segment: string): string {
  return encodeURIComponent(segment);
}

/** Best-effort era jersey URLs from BreakingPoint storage layout. */
export function buildEraHeadshotCandidates(
  player: CodPlayer,
  team: HistoricalCodTeam,
  bpTag?: string
): string[] {
  const tag = bpTag ?? player.gamertag;
  const tagVariants = [...new Set([tag, tag.replace(/\s/g, ''), player.gamertag])];
  const years = [team.season, team.season + 1, team.season - 1].filter((y) => y >= 2013);
  const teamNames = [...new Set([team.teamName, team.teamName.replace(/\s+/g, ' ')])];

  const urls: string[] = [];

  for (const year of years) {
    for (const t of tagVariants) {
      urls.push(`${BP_STORAGE}/${year}/${enc(`${t}_CDL_${year}`)}.webp`);
      urls.push(`${BP_STORAGE}/${year}/${enc(`${t}_CDL_${year - 1}`)}.webp`);
      urls.push(`${BP_STORAGE}/${year}/${enc(t)}.webp`);
      urls.push(`${BP_STORAGE}/${year}/Photos/${enc(t)}.webp`);
    }
    for (const teamName of teamNames) {
      for (const t of tagVariants) {
        urls.push(`${BP_STORAGE}/${year}/${enc(teamName)}/${enc(t)}/${enc(t)}_front.png`);
        urls.push(`${BP_STORAGE}/${year}/${enc(teamName)}/${enc(t)}/${enc(t)}.webp`);
      }
    }
  }

  return [...new Set(urls)];
}

export function pickBestHeadshot(
  calendarYear: number,
  candidates: Array<string | null | undefined>
): string | null {
  const ranked = candidates
    .filter((url): url is string => Boolean(url))
    .map((url) => ({ url, score: eraHeadshotScore(url, calendarYear) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < 0) return ranked.find((r) => r.score >= 0)?.url ?? ranked[0]?.url ?? null;
  return best.url;
}

export function resolveTeamYearHeadshots(
  player: CodPlayer,
  team: HistoricalCodTeam,
  storedHeadshot: string | null | undefined,
  genericHeadshot: string | null | undefined,
  bpTag?: string
): string[] {
  const built = buildEraHeadshotCandidates(player, team, bpTag);
  const eraFallbacks = [...built].sort(
    (a, b) => eraHeadshotScore(b, team.season) - eraHeadshotScore(a, team.season)
  );

  // Prefer verified bundle / BP index URLs — era guesses often 404 but scored higher before.
  const ordered = [storedHeadshot, genericHeadshot, ...eraFallbacks].filter(
    (url): url is string => Boolean(url)
  );
  return [...new Set(ordered)];
}
