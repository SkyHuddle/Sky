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
  if (ovr >= 94) return 'var(--kb-gold)';
  if (ovr >= 90) return 'var(--kb-gold-deep)';
  return 'var(--kb-fg-soft)';
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  function ShareCard({ picks, result, mode, dailyTitle }, ref) {
    const avgOvr = picks.reduce((s, p) => s + cardOverall(p.player, p.team), 0) / picks.length;
    const isWin = result.ringWon || result.perfectSeason;

    return (
      <div
        ref={ref}
        className="w-full max-w-[360px] rounded-[var(--kb-r-xl)] overflow-hidden relative border border-kb-border kb-card"
        style={{
          background: 'linear-gradient(165deg, var(--kb-bg-elev) 0%, var(--kb-bg-deep) 42%, #141008 100%)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 90% 55% at 50% -5%, rgba(232, 184, 66, 0.2) 0%, transparent 65%)',
          }}
        />

        <div className="relative z-10 p-5 flex flex-col gap-4">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.35em] text-kb-gold/70 mb-1 font-semibold">
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
            className={`rounded-[var(--kb-r-md)] border px-4 py-4 text-center ${
              isWin
                ? 'border-kb-gold/35 bg-kb-gold/8'
                : 'border-kb-border bg-kb-glass'
            }`}
          >
            <p
              className={`font-display text-4xl tabular-nums leading-none ${
                isWin ? 'text-ring-gold glow-ring' : 'text-kb-fg'
              }`}
            >
              {result.seasonSummary.record}
            </p>
            <p className="text-[11px] text-kb-soft mt-2 leading-relaxed">
              {result.seasonSummary.headline}
            </p>
          </div>

          <div className="space-y-0 border-t border-kb-hairline pt-3">
            {picks.map((pick) => {
              const ovr = cardOverall(pick.player, pick.team);
              const headshot = getPlayerHeadshot(pick.player, pick.team);
              return (
                <div
                  key={`${pick.team.id}-${pick.player.id}`}
                  className="flex items-center gap-2.5 py-2 border-b border-kb-hairline last:border-0"
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
                    <p className="text-sm text-kb-fg truncate font-medium">
                      {pick.player.gamertag}
                    </p>
                    <p className="text-[9px] text-kb-mute truncate">
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

          <div className="grid grid-cols-3 gap-2 text-center border-t border-kb-hairline pt-3">
            <StatBlock label="MVP" value={result.mvp.gamertag} />
            <StatBlock label="Majors" value={String(result.majorWins)} highlight={result.majorWins > 0} />
            <StatBlock label="Score" value={result.rosterScore.toFixed(1)} highlight />
          </div>

          <p className="text-center text-[9px] uppercase tracking-[0.35em] text-kb-faint">
            skylercamper.com · sister to knowball.us
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
      <p className="text-[8px] uppercase tracking-wider text-kb-mute">{label}</p>
      <p
        className={`font-display text-sm mt-0.5 tabular-nums truncate ${
          highlight ? 'text-kb-gold' : 'text-kb-fg'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
