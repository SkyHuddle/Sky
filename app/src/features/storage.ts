import type { DailyRunResult, PlayerStats } from '@/core/types';

const STATS_KEY = 'golden-road-stats';
const DAILY_KEY = 'golden-road-daily';
const HISTORY_KEY = 'golden-road-history';

const DEFAULT_STATS: PlayerStats = {
  goldenRoads: 0,
  attempts: 0,
  winStreak: 0,
  bestRosterScore: 0,
  dailyCompletions: 0,
  lastPlayedDate: null,
  skipsUsed: 0,
};

export function loadStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { ...DEFAULT_STATS };
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

export function saveStats(stats: PlayerStats): void {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function recordAttempt(
  goldenRoad: boolean,
  rosterScore: number,
  isDaily: boolean
): PlayerStats {
  const stats = loadStats();
  const today = new Date().toISOString().slice(0, 10);

  stats.attempts += 1;
  if (goldenRoad) {
    stats.goldenRoads += 1;
    stats.winStreak += 1;
  } else {
    stats.winStreak = 0;
  }
  if (rosterScore > stats.bestRosterScore) {
    stats.bestRosterScore = rosterScore;
  }
  if (isDaily) {
    stats.dailyCompletions += 1;
  }
  stats.lastPlayedDate = today;
  saveStats(stats);
  return stats;
}

export function loadDailyResult(dateKey: string): DailyRunResult | null {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (!raw) return null;
    const map: Record<string, DailyRunResult> = JSON.parse(raw);
    return map[dateKey] ?? null;
  } catch {
    return null;
  }
}

export function saveDailyResult(result: DailyRunResult): void {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    const map: Record<string, DailyRunResult> = raw ? JSON.parse(raw) : {};
    map[result.date] = result;
    localStorage.setItem(DAILY_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export interface ShareHistoryEntry {
  id: string;
  timestamp: number;
  goldenRoad: boolean;
  score: number;
  rosterNames: string[];
}

export function addShareHistory(entry: Omit<ShareHistoryEntry, 'id' | 'timestamp'>): void {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const list: ShareHistoryEntry[] = raw ? JSON.parse(raw) : [];
    list.unshift({
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 20)));
  } catch {
    /* ignore */
  }
}

export function loadShareHistory(): ShareHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
