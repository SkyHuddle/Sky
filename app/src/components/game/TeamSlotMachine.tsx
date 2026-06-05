import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { HistoricalTeam } from '@/core/types';
import { DRAFT_PHASE_LABELS } from '@/core/types';
import type { DraftTournamentPhase } from '@/core/types';
import { SPIN_DURATION_MS, SPIN_TICK_MS } from '@/core/constants';

interface TeamSlotMachineProps {
  phase: DraftTournamentPhase;
  sequence: HistoricalTeam[];
  onComplete: () => void;
  onSkip?: () => void;
  canSkip?: boolean;
}

export function TeamSlotMachine({
  phase,
  sequence,
  onComplete,
  onSkip,
  canSkip,
}: TeamSlotMachineProps) {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setIndex(0);
    setDone(false);
  }, [sequence]);

  useEffect(() => {
    if (sequence.length === 0) return;

    const totalTicks = sequence.length;
    let tick = 0;

    const interval = setInterval(() => {
      tick += 1;
      setIndex(tick - 1);

      if (tick >= totalTicks) {
        clearInterval(interval);
        setDone(true);
        setTimeout(onComplete, 350);
      }
    }, SPIN_TICK_MS);

    return () => clearInterval(interval);
  }, [sequence, onComplete]);

  const current = sequence[index] ?? sequence[sequence.length - 1];
  if (!current) return null;

  const progress = Math.min(1, (index + 1) / sequence.length);
  const slowing = progress > 0.65;

  return (
    <div className="flex flex-col items-center justify-center min-h-[50dvh] px-5">
      <p className="text-[10px] uppercase tracking-[0.35em] text-gold/70 mb-2">
        {DRAFT_PHASE_LABELS[phase]}
      </p>
      <p className="text-white/40 text-xs mb-8 uppercase tracking-widest">
        Rolling team & year…
      </p>

      <motion.div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center relative overflow-hidden"
        animate={
          done
            ? { scale: 1, borderColor: 'rgba(201, 162, 39, 0.5)' }
            : { scale: slowing ? 1 : [1, 1.01, 1] }
        }
        transition={{ duration: done ? 0.3 : 0.15 }}
      >
        {!done && (
          <motion.div
            className="absolute inset-x-0 top-0 h-1 bg-gold/60"
            style={{ scaleX: progress, transformOrigin: 'left' }}
          />
        )}

        <motion.div
          key={`${current.id}-${index}`}
          initial={{ opacity: 0.4, y: 8 }}
          animate={{ opacity: 1, y: done ? 0 : 8 }}
          transition={{ duration: done ? 0.2 : 0.05 }}
        >
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-2">
            {current.region}
          </p>
          <p
            className="font-display text-4xl sm:text-5xl tracking-wide leading-none"
            style={{ color: done ? current.accent : '#fff' }}
          >
            {current.year}
          </p>
          <p className="font-display text-xl sm:text-2xl text-white mt-3 tracking-wide">
            {current.name}
          </p>
          {done && (
            <motion.p
              className="text-sm mt-2"
              style={{ color: `${current.accent}cc` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {current.tagline}
            </motion.p>
          )}
        </motion.div>
      </motion.div>

      {!done && (
        <p className="text-white/25 text-[10px] uppercase tracking-widest mt-6 animate-pulse">
          Spinning…
        </p>
      )}

      {canSkip && onSkip && !done && (
        <button
          type="button"
          onClick={onSkip}
          className="mt-8 text-sm text-white/40 hover:text-gold border border-white/10 hover:border-gold/30 rounded-full px-5 py-2 transition-colors"
        >
          Skip team (1 left)
        </button>
      )}
    </div>
  );
}

export { SPIN_DURATION_MS };
