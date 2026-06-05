import { motion } from 'framer-motion';
import type { CodPlayer, DailyConstraint, DraftPick, DraftRound, DraftSubphase } from '../core/types';
import { PlayerCard } from './PlayerCard';
import { TeamSlotMachine } from './TeamSlotMachine';
import { playerPassesFilter } from '../features/daily';

interface DraftScreenProps {
  currentRound: DraftRound;
  draftSubphase: DraftSubphase;
  picks: DraftPick[];
  spinGeneration: number;
  respinsLeft: number;
  dailyConstraint: DailyConstraint;
  isDaily: boolean;
  onSpinComplete: () => void;
  onRespinTeam: () => void;
  onSelectPlayer: (player: CodPlayer) => void;
  onBack: () => void;
}

export function DraftScreen({
  currentRound,
  draftSubphase,
  picks,
  spinGeneration,
  respinsLeft,
  dailyConstraint,
  isDaily,
  onSpinComplete,
  onRespinTeam,
  onSelectPlayer,
  onBack,
}: DraftScreenProps) {
  const pickedIds = new Set(picks.map((p) => p.player.id));
  const { team } = currentRound;

  const rosterEntries = currentRound.roster.map((player) => {
    const taken = pickedIds.has(player.id);
    const blocked =
      isDaily && !playerPassesFilter(player, picks, dailyConstraint);
    return { player, taken, blocked, disabled: taken || blocked };
  });

  const pickableCount = rosterEntries.filter((e) => !e.disabled).length;

  return (
    <div className="flex flex-col min-h-[100dvh] max-w-lg mx-auto">
      <header className="sticky top-0 z-20 px-5 pt-5 pb-3 bg-[#060608]/90 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={onBack}
            className="text-white/40 text-sm hover:text-white/70 transition-colors py-2"
          >
            ← Exit
          </button>
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/35">
            Round {picks.length + 1} of 4
          </span>
        </div>
        <PickSlots picks={picks} />
      </header>

      <div className="flex-1 overflow-y-auto">
        {draftSubphase === 'spin' && (
          <TeamSlotMachine
            key={spinGeneration}
            team={currentRound.team}
            spin={currentRound.spin}
            spinKey={spinGeneration}
            roundIndex={currentRound.roundIndex}
            onComplete={onSpinComplete}
          />
        )}

        {draftSubphase === 'pick' && (
          <motion.div
            className="px-5 py-4 pb-12"
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

            {pickableCount === 0 && (
              <p className="text-sm text-red-400/80 mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                No eligible players for today&apos;s rule on this team. Respin or try Daily tomorrow.
              </p>
            )}

            <div className="space-y-2.5">
              {rosterEntries.map(({ player, disabled }) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  disabled={disabled}
                  onSelect={() => onSelectPlayer(player)}
                />
              ))}
            </div>

            {respinsLeft > 0 && (
              <button
                type="button"
                onClick={onRespinTeam}
                className="w-full mt-6 py-3.5 rounded-2xl border border-white/10 text-sm text-white/50 hover:text-white/70 hover:border-ring-gold/30 transition-colors"
              >
                Respin team ({respinsLeft} left)
              </button>
            )}
          </motion.div>
        )}
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
