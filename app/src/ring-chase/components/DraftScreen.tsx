import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CodPlayer, DailyConstraint, DraftPick, DraftRound, DraftSubphase } from '../core/types';
import { TEAM_REVEAL_MS } from '../core/constants';
import { PlayerCard } from './PlayerCard';
import { playerPassesFilter } from '../features/daily';

interface DraftScreenProps {
  currentRound: DraftRound;
  draftSubphase: DraftSubphase;
  picks: DraftPick[];
  revealKey: number;
  dailyConstraint: DailyConstraint;
  isDaily: boolean;
  onRevealComplete: () => void;
  onSelectPlayer: (player: CodPlayer) => void;
  onBack: () => void;
}

export function DraftScreen({
  currentRound,
  draftSubphase,
  picks,
  revealKey,
  dailyConstraint,
  isDaily,
  onRevealComplete,
  onSelectPlayer,
  onBack,
}: DraftScreenProps) {
  const pickedIds = new Set(picks.map((p) => p.player.id));
  const { team } = currentRound;

  useEffect(() => {
    if (draftSubphase !== 'reveal') return;
    const t = setTimeout(onRevealComplete, TEAM_REVEAL_MS);
    return () => clearTimeout(t);
  }, [draftSubphase, revealKey, onRevealComplete]);

  return (
    <div className="flex flex-col min-h-[100dvh] max-w-lg mx-auto">
      <header className="sticky top-0 z-20 px-5 pt-5 pb-3 bg-[#060608]/90 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={onBack}
            className="text-white/40 text-sm hover:text-white/70 transition-colors"
          >
            ← Exit
          </button>
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/35">
            Round {picks.length + 1} of 4
          </span>
        </div>
        <PickSlots picks={picks} />
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4 pb-12">
        <AnimatePresence mode="wait">
          {draftSubphase === 'reveal' && (
            <motion.div
              key={`reveal-${revealKey}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -12 }}
              className="text-center py-8"
            >
              <p className="text-[10px] uppercase tracking-[0.35em] text-ring-gold/60 mb-4">
                Round {currentRound.roundIndex + 1}
              </p>
              <div
                className="rounded-2xl glass-panel p-6 border mx-auto max-w-sm"
                style={{ borderColor: `${team.accent}30` }}
              >
                <div
                  className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center font-display text-2xl"
                  style={{ background: `${team.accent}20`, color: team.accent }}
                >
                  {team.teamName.slice(0, 2).toUpperCase()}
                </div>
                <h2 className="font-display text-2xl text-white">{team.teamName}</h2>
                <p className="text-ring-gold/80 text-sm mt-1">{team.season}</p>
                <p className="text-white/40 text-xs mt-2">{team.eventContext}</p>
                <p className="text-white/25 text-[10px] mt-1">{team.gameTitle}</p>
              </div>
              <p className="text-white/30 text-xs mt-6 animate-pulse">Choose one...</p>
            </motion.div>
          )}

          {draftSubphase === 'pick' && (
            <motion.div
              key="pick"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-5">
                <p className="text-[10px] uppercase tracking-widest text-white/35">Choose one</p>
                <h2 className="font-display text-xl text-white mt-1">
                  {team.teamName} <span className="text-white/40">{team.season}</span>
                </h2>
                {isDaily && dailyConstraint.id !== 'standard' && (
                  <p className="text-[10px] text-ring-gold/60 mt-1">{dailyConstraint.title}</p>
                )}
              </div>

              <div className="space-y-2.5">
                {currentRound.roster.map((player) => {
                  const taken = pickedIds.has(player.id);
                  const blocked = !playerPassesFilter(player, picks, dailyConstraint);
                  return (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      disabled={taken || blocked}
                      onSelect={() => onSelectPlayer(player)}
                    />
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PickSlots({ picks }: { picks: DraftPick[] }) {
  return (
    <div className="flex gap-2">
      {[0, 1, 2, 3].map((i) => {
        const pick = picks[i];
        return (
          <div
            key={i}
            className={`flex-1 h-12 rounded-xl border flex items-center justify-center text-[10px] uppercase tracking-wider ${
              pick
                ? 'border-ring-gold/30 bg-ring-gold/8 text-ring-gold/90'
                : 'border-white/[0.06] bg-white/[0.02] text-white/20'
            }`}
          >
            {pick ? pick.player.gamertag.slice(0, 6) : `R${i + 1}`}
          </div>
        );
      })}
    </div>
  );
}
