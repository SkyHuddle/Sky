/** LoL competitive year → Gol.gg season tag (2011 = S1). */
export function yearToGolSeason(year: number): string {
  const n = year - 2010;
  if (n < 1 || n > 99) throw new Error(`year out of range: ${year}`);
  return `S${n}`;
}

export function golSeasonToYear(season: string): number {
  const m = season.match(/^S(\d+)$/i);
  if (!m) throw new Error(`invalid season: ${season}`);
  return parseInt(m[1], 10) + 2010;
}
