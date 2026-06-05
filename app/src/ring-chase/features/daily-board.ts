import type { DailyRunResult, SeasonSummary } from '../core/types';
import { getTeamById } from '../data';
import { getDailyTeams } from '../engine/draft';
import { hashString, mulberry32 } from '../engine/rng';

export interface DailyBoardEntry {
  id: string;
  date: string;
  record: string;
  regularSeasonWins: number;
  majorWins: number;
  ringWon: boolean;
  perfectSeason: boolean;
  headline: string;
  score: number;
  rosterNames: string[];
  isYou?: boolean;
  rankScore: number;
}

const BOARD_KEY = 'ring-chase-daily-board';

const COMMUNITY_TAGS = [
  'Attach', 'Pred', 'Dashy', 'Simp', 'Scump', 'Cellium', 'HyDra', 'Shotzzy',
  'Envoy', 'Octane', 'Kismet', 'aBeZy', 'CleanX', 'FormaL', 'Crimsix',
];

function rankScore(entry: {
  perfectSeason: boolean;
  ringWon: boolean;
  majorWins: number;
  regularSeasonWins: number;
  score: number;
}): number {
  let s = entry.score;
  if (entry.perfectSeason) s += 10_000;
  else if (entry.ringWon) s += 8_000;
  s += entry.majorWins * 600;
  s += entry.regularSeasonWins * 12;
  return s;
}

function seedCommunityEntries(dateKey: string): DailyBoardEntry[] {
  const rng = mulberry32(hashString(`daily-board-${dateKey}`));
  const entries: DailyBoardEntry[] = [];

  for (let i = 0; i < 12; i++) {
    const majors = Math.floor(rng() * 5);
    const ringWon = majors === 4 && rng() > 0.55;
    const perfect = ringWon && rng() > 0.35;
    const regWins = Math.floor(rng() * 21);
    const regLosses = 20 - regWins;
    const record = `${regWins}-${regLosses}`;
    const ringLine = perfect ? 'Perfect Season' : ringWon ? 'Ring' : 'No Ring';
    const headline = `${record} · ${majors > 0 ? `Won ${majors} Major${majors === 1 ? '' : 's'}` : '0 Majors'} · ${ringLine}`;

    const roster = Array.from({ length: 4 }, () =>
      COMMUNITY_TAGS[Math.floor(rng() * COMMUNITY_TAGS.length)]!
    );

    const score = 78 + majors * 3 + regWins * 0.35 + (ringWon ? 8 : 0);

    entries.push({
      id: `bot-${dateKey}-${i}`,
      date: dateKey,
      record,
      regularSeasonWins: regWins,
      majorWins: majors,
      ringWon,
      perfectSeason: perfect,
      headline,
      score,
      rosterNames: roster,
      rankScore: rankScore({
        perfectSeason: perfect,
        ringWon,
        majorWins: majors,
        regularSeasonWins: regWins,
        score,
      }),
    });
  }

  return entries;
}

export function loadDailyBoard(dateKey: string): DailyBoardEntry[] {
  try {
    const raw = localStorage.getItem(BOARD_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, DailyBoardEntry[]>) : {};
    if (!map[dateKey]) {
      map[dateKey] = seedCommunityEntries(dateKey);
      localStorage.setItem(BOARD_KEY, JSON.stringify(map));
    }
    return map[dateKey] ?? [];
  } catch {
    return seedCommunityEntries(dateKey);
  }
}

export function submitDailyBoardEntry(
  dateKey: string,
  summary: SeasonSummary,
  result: Pick<DailyRunResult, 'score' | 'ringWon' | 'perfectSeason' | 'majorWins' | 'record' | 'headline'>,
  rosterNames: string[]
): DailyBoardEntry[] {
  const board = loadDailyBoard(dateKey).filter((e) => !e.isYou);
  const you: DailyBoardEntry = {
    id: `you-${dateKey}`,
    date: dateKey,
    record: summary.record,
    regularSeasonWins: summary.regularSeasonWins,
    majorWins: summary.majorWins,
    ringWon: result.ringWon,
    perfectSeason: result.perfectSeason,
    headline: summary.headline,
    score: result.score,
    rosterNames,
    isYou: true,
    rankScore: rankScore({
      perfectSeason: result.perfectSeason,
      ringWon: result.ringWon,
      majorWins: summary.majorWins,
      regularSeasonWins: summary.regularSeasonWins,
      score: result.score,
    }),
  };

  const next = [...board, you].sort((a, b) => b.rankScore - a.rankScore);

  try {
    const raw = localStorage.getItem(BOARD_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, DailyBoardEntry[]>) : {};
    map[dateKey] = next;
    localStorage.setItem(BOARD_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }

  return next;
}

export function getDailyPlacement(dateKey: string, entryId: string): { rank: number; total: number } {
  const board = loadDailyBoard(dateKey);
  const sorted = [...board].sort((a, b) => b.rankScore - a.rankScore);
  const rank = sorted.findIndex((e) => e.id === entryId) + 1;
  return { rank: rank || sorted.length, total: sorted.length };
}

export function getDailyTeamLabels(dateKey: string): string[] {
  return getDailyTeams(dateKey).map((id) => {
    const team = getTeamById(id);
    return team ? `${team.teamName} ${team.season}` : id;
  });
}

export function canStartDailyToday(dailyPlayed: DailyRunResult | null): boolean {
  return dailyPlayed == null;
}
