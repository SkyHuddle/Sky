import { forwardRef } from 'react';
import type { DraftPick, SimulationResult } from '@/core/types';
import { ROLE_LABELS } from '@/core/types';

interface ShareCardProps {
  picks: DraftPick[];
  result: SimulationResult;
  mode: 'free' | 'daily';
  dailyTitle?: string;
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  function ShareCard({ picks, result, mode, dailyTitle }, ref) {
    const achieved = result.goldenRoad;

    return (
      <div
        ref={ref}
        className="w-full max-w-[380px] mx-auto aspect-[4/5] rounded-3xl overflow-hidden relative"
        style={{
          background:
            'linear-gradient(165deg, #0d0d12 0%, #08080c 40%, #12100a 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(201, 162, 39, 0.25) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 p-6 h-full flex flex-col">
          <div className="text-center mb-6">
            <p className="text-[10px] uppercase tracking-[0.35em] text-gold/60 mb-2">
              Golden Road {mode === 'daily' ? '· Daily' : ''}
            </p>
            <h2
              className={`font-display text-2xl sm:text-3xl tracking-wide leading-tight ${
                achieved ? 'text-gold' : 'text-white/90'
              }`}
            >
              {achieved ? 'GOLDEN ROAD ACHIEVED' : result.failureMessage.toUpperCase()}
            </h2>
            {dailyTitle && (
              <p className="text-white/40 text-xs mt-2">{dailyTitle}</p>
            )}
          </div>

          <div className="flex-1 space-y-3">
            {picks.map(({ role, player }) => (
              <div
                key={role}
                className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.06] last:border-0"
              >
                <span className="text-[10px] uppercase tracking-widest text-white/35 w-16 shrink-0">
                  {ROLE_LABELS[role]}
                </span>
                <span className="font-display text-lg text-white flex-1 truncate">
                  {player.name}
                </span>
                <span
                  className="text-xs font-medium tabular-nums shrink-0"
                  style={{ color: player.accent }}
                >
                  {player.ratings.overall}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-6 grid grid-cols-4 gap-2 text-center">
            <StatBlock label="Titles" value={String(result.titleCounts.domestic)} />
            <StatBlock label="MSI" value={String(result.titleCounts.msi)} />
            <StatBlock label="Worlds" value={String(result.titleCounts.worlds)} />
            <StatBlock label="Score" value={result.rosterScore.toFixed(1)} highlight />
          </div>

          <p className="text-center text-[9px] uppercase tracking-[0.3em] text-white/25 mt-4">
            goldenroad.gg
          </p>
        </div>
      </div>
    );
  }
);

function StatBlock({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wider text-white/35">{label}</p>
      <p
        className={`font-display text-xl mt-0.5 tabular-nums ${
          highlight ? 'text-gold' : 'text-white/90'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
