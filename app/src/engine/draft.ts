import type { Player, Role } from '@/core/types';
import { DRAFT_POOL_SIZE, ROLE_ORDER } from '@/core/constants';
import { getPlayersByRole } from '@/data';

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateDraftPool(
  role: Role,
  seed: string,
  roundIndex: number,
  filter?: (p: Player) => boolean,
  excludeIds: string[] = []
): Player[] {
  const pool = getPlayersByRole(role, 'lol', (p) => {
    if (excludeIds.includes(p.id)) return false;
    return filter ? filter(p) : true;
  });

  if (pool.length === 0) {
    return getPlayersByRole(role).slice(0, DRAFT_POOL_SIZE);
  }

  const rng = mulberry32(hashString(`${seed}-${role}-${roundIndex}`));
  const shuffled = shuffle(pool, rng);
  return shuffled.slice(0, Math.min(DRAFT_POOL_SIZE, shuffled.length));
}

export function createRunSeed(mode: 'free' | 'daily', dateKey?: string): string {
  if (mode === 'daily' && dateKey) {
    return `daily-${dateKey}`;
  }
  return `free-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export { ROLE_ORDER };
