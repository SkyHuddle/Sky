import { Trophy } from 'lucide-react';
import type { CardStatBreakdown as Stats } from '../data/team-year-ratings';
import { formatKd } from '../data/team-year-ratings';
const ACCOMPLISHMENT_LABEL: Record<Stats['accomplishment'], string> = {
  champs_winner: 'Champs Winner',
  champs_finalist: 'Champs Finalist',
  major_winner: 'Major Winner',
  major_finalist: 'Major Finalist',
  contender: 'Contender',
  standard: 'Season',
};

interface CardStatBreakdownProps {
  stats: Stats;
  compact?: boolean;
}

function ModeChip({ label, kd, rating, maps }: { label: string; kd: number; rating: number; maps: number }) {
  if (maps < 1) return null;
  return (
    <span className="inline-flex flex-col gap-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06] px-2.5 py-1.5 text-[10px] tabular-nums min-w-[4.5rem]">
      <span className="text-white/30 uppercase tracking-wider text-[8px]">{label}</span>
      <span className="text-white/75 font-medium">{formatKd(kd)} K/D</span>
      <span className="text-white/40 text-[9px]">{rating.toFixed(2)} BP · {maps}m</span>
    </span>
  );
}

export function CardStatBreakdown({ stats, compact }: CardStatBreakdownProps) {
  const chips = [
    { label: 'K/D', value: formatKd(stats.kd) },
    { label: 'BP', value: stats.bpRating.toFixed(2) },
    { label: 'Maps', value: String(stats.maps) },
  ];

  return (
    <div className={compact ? '' : 'pt-3 border-t border-white/[0.06] mt-2'}>
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {chips.map(({ label, value }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.04] border border-white/[0.06] px-2 py-1 text-[10px] tabular-nums"
          >
            <span className="text-white/30 uppercase tracking-wider">{label}</span>
            <span className="text-white/75 font-medium">{value}</span>
          </span>
        ))}
        <span className="inline-flex items-center gap-1 rounded-md bg-ring-gold/10 border border-ring-gold/20 px-2 py-1 text-[9px] uppercase tracking-wider text-ring-gold/90">
          <Trophy className="w-3 h-3" />
          {ACCOMPLISHMENT_LABEL[stats.accomplishment]}
        </span>
        {stats.source === 'estimated' && (
          <span className="inline-flex items-center rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-1 text-[9px] uppercase tracking-wider text-amber-400/90">
            Estimated
          </span>
        )}
      </div>

      {(stats.hardpoint || stats.snd || stats.control) && (
        <div className="flex flex-wrap gap-1.5">
          {stats.hardpoint && (
            <ModeChip label="HP" kd={stats.hardpoint.kd} rating={stats.hardpoint.bpRating} maps={stats.hardpoint.maps} />
          )}
          {stats.snd && (
            <ModeChip label="S&D" kd={stats.snd.kd} rating={stats.snd.bpRating} maps={stats.snd.maps} />
          )}
          {stats.control && (
            <ModeChip
              label="CTL"
              kd={stats.control.kd}
              rating={stats.control.bpRating}
              maps={stats.control.maps}
            />
          )}
        </div>
      )}

      {!compact && stats.source === 'bp-stats' && (
        <p className="text-[9px] text-white/25 mt-2.5 leading-relaxed">
          OVR tuned from BreakingPoint season stats + {ACCOMPLISHMENT_LABEL[stats.accomplishment].toLowerCase()} context.
        </p>
      )}
    </div>
  );
}
