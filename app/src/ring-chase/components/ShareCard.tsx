import { forwardRef } from 'react';
import type { DraftPick, GameMode, SimulationResult } from '../core/types';
import { CHAMPS_OUTCOME_LABELS } from '../core/types';
import { formatPickLine } from '../engine/explanations';

interface ShareCardProps {
  picks: DraftPick[];
  result: SimulationResult;
  mode: GameMode;
  dailyTitle?: string;
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  function ShareCard({ picks, result, mode, dailyTitle }, ref) {
    const headline = result.perfectSeason
      ? 'PERFECT SEASON'
      : result.ringWon
        ? 'RING WON'
        : 'NO RING';

    return (
      <div
        ref={ref}
        className="aspect-[4/5] w-full max-w-[340px] rounded-2xl overflow-hidden relative"
        style={{
          background: 'linear-gradient(165deg, #0c0c10 0%, #060608 45%, #0a0906 100%)',
          border: '1px solid rgba(201, 162, 39, 0.25)',
        }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative p-6 flex flex-col h-full">
          <div className="text-center mb-5">
            <p className="text-[9px] uppercase tracking-[0.4em] text-ring-gold/60 mb-2">
              {mode === 'daily' && dailyTitle ? dailyTitle : 'Ring Chase'}
            </p>
            <h2
              className={`font-display text-3xl tracking-wide ${
                result.ringWon || result.perfectSeason ? 'text-ring-gold' : 'text-white'
              }`}
            >
              {headline}
            </h2>
          </div>

          <div className="space-y-2 flex-1">
            {picks.map((pick) => (
              <div key={`${pick.team.id}-${pick.player.id}`} className="flex justify-between text-sm">
                <span className="text-white/70 truncate pr-2">
                  {formatPickLine(pick.player, pick.team.teamName, pick.team.season)}
                </span>
                <span className="text-ring-gold/80 tabular-nums shrink-0">
                  {Math.round(pick.player.ratings.overall)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-1.5 text-xs">
            <div className="flex justify-between text-white/50">
              <span>Major Wins</span>
              <span className="text-white/80">{result.majorWins}</span>
            </div>
            <div className="flex justify-between text-white/50">
              <span>Champs</span>
              <span className="text-white/80">
                {CHAMPS_OUTCOME_LABELS[result.champsOutcome]}
              </span>
            </div>
            <div className="flex justify-between text-white/50">
              <span>Roster Rating</span>
              <span className="text-ring-gold">{result.rosterScore}</span>
            </div>
            <div className="flex justify-between text-white/50">
              <span>Ring Odds</span>
              <span className="text-white/80">{Math.round(result.ringOdds * 100)}%</span>
            </div>
            <div className="flex justify-between text-white/50">
              <span>MVP</span>
              <span className="text-white/80">{result.mvp.gamertag}</span>
            </div>
            <div className="flex justify-between text-white/50">
              <span>Weak Link</span>
              <span className="text-white/80">{result.weakLink?.gamertag ?? 'None'}</span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-[10px] text-white/40 italic">{result.explanation}</p>
            <p className="text-[9px] text-ring-gold/50 mt-2 uppercase tracking-widest">
              {result.footer}
            </p>
            <p className="text-[8px] text-white/25 mt-3 uppercase tracking-[0.2em]">
              Play Ring Chase
            </p>
          </div>
        </div>
      </div>
    );
  }
);
