import type { CardStatBreakdown } from '@/engine/player-power';
import { formatKda } from '@/engine/player-power';

interface StatBreakdownProps {
  stats: CardStatBreakdown;
  compact?: boolean;
}

export function StatBreakdown({ stats, compact }: StatBreakdownProps) {
  const chips = [
    { label: 'KDA', value: formatKda(stats.kda) },
    { label: 'KP', value: `${Math.round(stats.killParticipation)}%` },
    { label: 'DMG', value: `${stats.damagePct.toFixed(0)}%` },
    { label: 'WR', value: `${Math.round(stats.winRate)}%` },
    { label: 'GP', value: String(Math.round(stats.games)) },
  ];

  return (
    <div
      className={`flex flex-wrap gap-1.5 ${compact ? '' : 'pt-2.5 border-t border-white/[0.06] mt-2.5'}`}
    >
      {chips.map(({ label, value }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-[10px] tabular-nums"
        >
          <span className="text-white/30 uppercase tracking-wider">{label}</span>
          <span className="text-white/70 font-medium">{value}</span>
        </span>
      ))}
      {stats.confidence === 'estimated' && (
        <span className="inline-flex items-center rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] uppercase tracking-wider text-amber-400/90">
          ~est.
        </span>
      )}
    </div>
  );
}
