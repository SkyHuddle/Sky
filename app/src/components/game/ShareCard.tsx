import { forwardRef } from 'react';
import type { DraftPick, SimulationResult } from '@/core/types';
import { ROLE_LABELS } from '@/core/types';
import { cardKda, cardOverall, formatKda } from '@/engine/player-power';
import { ovrAccentColor } from '@/engine/ovr-display';

interface ShareCardProps {
  picks: DraftPick[];
  result: SimulationResult;
  mode: 'free' | 'daily';
  dailyTitle?: string;
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  function ShareCard({ picks, result, mode, dailyTitle }, ref) {
    const achieved = result.goldenRoad;
    const avgOvr =
      picks.reduce((s, p) => s + cardOverall(p.player, p.team), 0) / picks.length;

    return (
      <div
        ref={ref}
        className="w-full max-w-[380px] mx-auto aspect-[4/5] rounded-3xl overflow-hidden relative border border-white/[0.08]"
        style={{
          background:
            'linear-gradient(165deg, #0e0e14 0%, #07070a 42%, #141008 100%)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 90% 55% at 50% -5%, rgba(201, 162, 39, 0.22) 0%, transparent 65%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10 p-6 h-full flex flex-col">
          <div className="text-center mb-5">
            <p className="text-[10px] uppercase tracking-[0.35em] text-gold/55 mb-2">
              Golden Road {mode === 'daily' ? '· Daily' : ''}
            </p>
            <h2
              className={`font-display text-2xl sm:text-[1.65rem] tracking-wide leading-tight ${
                achieved ? 'text-gold glow-gold' : 'text-white/90'
              }`}
            >
              {achieved ? 'GOLDEN ROAD' : result.failureMessage.toUpperCase()}
            </h2>
            {dailyTitle && (
              <p className="text-white/35 text-xs mt-2">{dailyTitle}</p>
            )}
            <p
              className="font-display text-lg tabular-nums mt-3"
              style={{ color: ovrAccentColor(avgOvr) }}
            >
              {avgOvr.toFixed(0)} avg OVR
            </p>
          </div>

          <div className="flex-1 space-y-0">
            {picks.map(({ role, player, team }) => {
              const ovr = cardOverall(player, team);
              return (
                <div
                  key={role}
                  className="py-2.5 border-b border-white/[0.05] last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-widest text-white/30 w-12 shrink-0">
                      {ROLE_LABELS[role]}
                    </span>
                    <span className="font-display text-sm text-white flex-1 truncate">
                      {player.name}
                    </span>
                    <span
                      className="font-display text-lg tabular-nums shrink-0"
                      style={{ color: ovrAccentColor(ovr) }}
                    >
                      {ovr}
                    </span>
                  </div>
                  <p className="text-[9px] text-white/25 mt-0.5 pl-12 truncate">
                    {team.name} · {team.year}
                    {cardKda(player, team) != null &&
                      ` · ${formatKda(cardKda(player, team)!)} KDA`}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-5 grid grid-cols-4 gap-2 text-center border-t border-white/[0.06]">
            <StatBlock label="Titles" value={String(result.titleCounts.domestic)} />
            <StatBlock label="MSI" value={String(result.titleCounts.msi)} />
            <StatBlock label="Worlds" value={String(result.titleCounts.worlds)} />
            <StatBlock label="Score" value={result.rosterScore.toFixed(1)} highlight />
          </div>

          <p className="text-center text-[9px] uppercase tracking-[0.35em] text-white/20 mt-4">
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
      <p className="text-[8px] uppercase tracking-wider text-white/30">{label}</p>
      <p
        className={`font-display text-lg mt-0.5 tabular-nums ${
          highlight ? 'text-gold' : 'text-white/85'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
