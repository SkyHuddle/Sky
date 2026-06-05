import { forwardRef } from 'react';
import type { DraftPick, GameMode, SimulationResult } from '../core/types';
import { formatPickLine } from '../engine/explanations';
import { cardOverall } from '../engine/card-context';
import { getPlayerHeadshot } from '../data/team-year-ratings';

interface ShareCardProps {
  picks: DraftPick[];
  result: SimulationResult;
  mode: GameMode;
  dailyTitle?: string;
}

function ovrColor(ovr: number): string {
  if (ovr >= 94) return '#e8c547';
  if (ovr >= 90) return '#c9a227';
  return '#b8c0cc';
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  function ShareCard({ picks, result, mode, dailyTitle }, ref) {
    const avgOvr = picks.reduce((s, p) => s + cardOverall(p.player, p.team), 0) / picks.length;

    return (
      <div
        ref={ref}
        className="w-full max-w-[360px] rounded-3xl overflow-hidden relative border border-white/[0.08]"
        style={{
          background: 'linear-gradient(165deg, #0e0e14 0%, #07070a 42%, #141008 100%)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 90% 55% at 50% -5%, rgba(201, 162, 39, 0.2) 0%, transparent 65%)',
          }}
        />

        <div className="relative z-10 p-5 flex flex-col gap-4">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.35em] text-ring-gold/55 mb-1">
              Ring Chase {mode === 'daily' && dailyTitle ? `· ${dailyTitle}` : ''}
            </p>
            <p
              className="font-display text-lg tabular-nums"
              style={{ color: ovrColor(avgOvr) }}
            >
              {avgOvr.toFixed(0)} avg OVR
            </p>
          </div>

          <div
            className={`rounded-2xl border px-4 py-4 text-center ${
              result.ringWon || result.perfectSeason
                ? 'border-ring-gold/35 bg-ring-gold/8'
                : 'border-white/[0.08] bg-white/[0.02]'
            }`}
          >
            <p
              className={`font-display text-4xl tabular-nums leading-none ${
                result.ringWon || result.perfectSeason ? 'text-ring-gold' : 'text-white'
              }`}
            >
              {result.seasonSummary.record}
            </p>
            <p className="text-[11px] text-white/55 mt-2 leading-relaxed">
              {result.seasonSummary.headline}
            </p>
          </div>

          <div className="space-y-0 border-t border-white/[0.06] pt-3">
            {picks.map((pick) => {
              const ovr = cardOverall(pick.player, pick.team);
              const headshot = getPlayerHeadshot(pick.player, pick.team);
              return (
                <div
                  key={`${pick.team.id}-${pick.player.id}`}
                  className="flex items-center gap-2.5 py-2 border-b border-white/[0.04] last:border-0"
                >
                  <div
                    className="w-8 h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-[10px] font-bold"
                    style={{
                      background: `${pick.team.accent}22`,
                      color: pick.team.accent,
                      border: `1px solid ${pick.team.accent}33`,
                    }}
                  >
                    {headshot ? (
                      <img src={headshot} alt="" className="w-full h-full object-cover object-top" />
                    ) : (
                      pick.player.gamertag.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/85 truncate font-medium">
                      {pick.player.gamertag}
                    </p>
                    <p className="text-[9px] text-white/30 truncate">
                      {formatPickLine(pick.player, pick.team.teamName, pick.team.season)}
                    </p>
                  </div>
                  <span
                    className="font-display text-lg tabular-nums shrink-0"
                    style={{ color: ovrColor(ovr) }}
                  >
                    {ovr}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center border-t border-white/[0.06] pt-3">
            <StatBlock label="MVP" value={result.mvp.gamertag} />
            <StatBlock label="Majors" value={String(result.majorWins)} highlight={result.majorWins > 0} />
            <StatBlock label="Score" value={result.rosterScore.toFixed(1)} highlight />
          </div>

          <p className="text-center text-[9px] uppercase tracking-[0.35em] text-white/20">
            Play Ring Chase
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
    <div className="min-w-0">
      <p className="text-[8px] uppercase tracking-wider text-white/30">{label}</p>
      <p
        className={`font-display text-sm mt-0.5 tabular-nums truncate ${
          highlight ? 'text-ring-gold' : 'text-white/85'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
