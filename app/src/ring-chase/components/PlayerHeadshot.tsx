import { useEffect, useMemo, useState } from 'react';
import type { CodPlayer, HistoricalCodTeam } from '../core/types';
import { resolveTeamYearHeadshots } from '../data/headshot-resolve';
import { lookupPlayerHeadshot } from '../data/headshot-index';
import { getTeamYearEntry } from '../data/team-year-ratings';

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
  const entry = team ? getTeamYearEntry(team.id, player.id) : null;
  const candidateKey = `${team?.id ?? 'none'}:${player.id}:${entry?.headshot ?? ''}`;

  const candidates = useMemo(() => {
    const generic = lookupPlayerHeadshot(player.id, player.gamertag, entry?.bpTag);
    if (!team) return generic ? [generic] : [];
    return resolveTeamYearHeadshots(
      player,
      team,
      entry?.headshot,
      generic,
      entry?.bpTag
    );
  }, [player, team, entry?.bpTag, entry?.headshot]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [candidateKey]);

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
      key={`${candidateKey}:${index}`}
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
