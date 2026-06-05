import { motion } from 'framer-motion';
import type { DraftPick } from '@/core/types';
import { ROLE_LABELS } from '@/core/types';
import { Button } from '@/components/ui/button';
import { SimulationGuide } from './SimulationGuide';
import { careerOverall } from '@/engine/player-power';

interface ReadyScreenProps {
  picks: DraftPick[];
  onAttempt: () => void;
  onEdit: () => void;
}

export function ReadyScreen({ picks, onAttempt, onEdit }: ReadyScreenProps) {
  const avgOvr =
    picks.reduce((s, p) => s + careerOverall(p.player), 0) / picks.length;

  return (
    <div className="flex flex-col min-h-[100dvh] px-5 py-10 max-w-lg mx-auto justify-between">
      <div>
        <motion.p
          className="text-[10px] uppercase tracking-[0.35em] text-gold/70 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Roster Complete
        </motion.p>
        <motion.h2
          className="font-display text-4xl text-white text-center mt-2 tracking-wide"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          YOUR TEAM
        </motion.h2>

        <motion.div
          className="mt-8 space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {picks.map(({ role, player, team }, i) => (
            <motion.div
              key={role}
              className="flex items-center gap-4 p-3 rounded-xl border border-white/[0.06] bg-white/[0.03]"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 * i }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{
                  background: `${team.accent}25`,
                  color: team.accent,
                  border: `1px solid ${team.accent}40`,
                }}
              >
                {player.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-white/35 uppercase tracking-widest">
                  {ROLE_LABELS[role]} · {team.year} {team.name}
                </p>
                <p className="font-display text-lg text-white truncate">{player.name}</p>
              </div>
              <span className="text-gold font-display text-xl">
                {careerOverall(player)}
              </span>
            </motion.div>
          ))}
        </motion.div>

        <p className="text-center text-white/40 text-sm mt-6">
          Team OVR <span className="text-gold font-display text-2xl ml-1">{avgOvr.toFixed(0)}</span>
        </p>

        <div className="mt-6">
          <SimulationGuide />
        </div>
      </div>

      <motion.div
        className="space-y-3 pb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Button
          onClick={onAttempt}
          className="w-full h-16 text-lg font-semibold rounded-2xl bg-gold text-black hover:bg-gold/90 shadow-lg shadow-gold/25 animate-pulse-gold"
        >
          Attempt Golden Road
        </Button>
        <button
          type="button"
          onClick={onEdit}
          className="w-full text-sm text-white/40 hover:text-white/60 py-2"
        >
          Redraft last pick
        </button>
      </motion.div>
    </div>
  );
}
