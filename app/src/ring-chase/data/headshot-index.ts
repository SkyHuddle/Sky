import bpPlayers from './generated/bp-players-index.json';

type BpPlayerRow = {
  id: number;
  tag: string;
  headshot: string | null;
  nickname?: string | null;
};

const rows = bpPlayers as BpPlayerRow[];

const headshotByTag = new Map<string, string>();
const headshotByNickname = new Map<string, string>();

for (const row of rows) {
  if (!row.headshot) continue;
  headshotByTag.set(row.tag.toLowerCase(), row.headshot);
  if (row.nickname) {
    for (const nick of row.nickname.split(',')) {
      const key = nick.trim().toLowerCase();
      if (key) headshotByNickname.set(key, row.headshot);
    }
  }
}

/** Extra gamertag → BP tag aliases for retired players missing from the index by primary tag. */
const PLAYER_TAG_ALIASES: Record<string, string[]> = {
  haggy: ['Parasite'],
  xposed: ['XMystery'],
};

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

export function lookupBpHeadshot(...tags: Array<string | null | undefined>): string | null {
  const seen = new Set<string>();
  for (const raw of tags) {
    if (!raw) continue;
    const tag = normalizeTag(raw);
    if (seen.has(tag)) continue;
    seen.add(tag);

    const direct = headshotByTag.get(tag);
    if (direct) return direct;

    const nick = headshotByNickname.get(tag);
    if (nick) return nick;
  }
  return null;
}

export function lookupPlayerHeadshot(
  playerId: string,
  gamertag: string,
  bpTag?: string | null
): string | null {
  const aliases = PLAYER_TAG_ALIASES[playerId] ?? [];
  return lookupBpHeadshot(bpTag, gamertag, ...aliases);
}
