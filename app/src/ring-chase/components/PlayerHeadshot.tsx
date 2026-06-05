import { useMemo, useState } from 'react';
import type { CodPlayer, HistoricalCodTeam } from '../core/types';
import { resolveTeamYearHeadshots } from '../data/headshot-resolve';
import { getTeamYearEntry } from '../data/team-year-ratings';
import bpPlayers from '../data/generated/bp-players-index.json';

type BpPlayerRow = { id: number; tag: string; headshot: string | null };

const headshotByTag = new Map<string, string | null>();
for (const row of bpPlayers as BpPlayerRow[]) {
  if (row.headshot) headshotByTag.set(row.tag.toLowerCase(), row.headshot);
}

interface PlayerHeadshotProps {
  player: CodPlayer;
  team?: HistoricalCodTeam;
  className?: string;
  fallbackClassName?: string;
}

export function PlayerHeadshot({
  player,
  team,
  className = 'w-full h-full object-cover object-top',
  fallbackClassName,
}: PlayerHeadshotProps) {
  const candidates = useMemo(() => {
    const entry = team ? getTeamYearEntry(team.id, player.id) : null;
    const generic =
      headshotByTag.get((entry?.bpTag ?? player.gamertag).toLowerCase()) ??
      headshotByTag.get(player.gamertag.toLowerCase()) ??
      null;
    if (!team) return generic ? [generic] : [];
    return resolveTeamYearHeadshots(
      player,
      team,
      entry?.headshot,
      generic,
      entry?.bpTag
    );
  }, [player, team]);

  const [index, setIndex] = useState(0);
  const src = candidates[index];

  if (!src) {
    return (
      <span className={fallbackClassName ?? 'text-xs font-bold'}>
        {player.gamertag.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className={className}
      loading="lazy"
      onError={() => {
        if (index < candidates.length - 1) setIndex((i) => i + 1);
      }}
    />
  );
}
