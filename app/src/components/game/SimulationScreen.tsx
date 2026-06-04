import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SimulationResult, StageId } from '@/core/types';
import { STAGE_LABELS } from '@/core/types';
import { STAGES } from '@/core/types';
import { STAGE_REVEAL_DELAY, STAGE_PAUSE } from '@/core/constants';
import { Check, X } from 'lucide-react';

interface SimulationScreenProps {
  result: SimulationResult;
  onComplete: () => void;
}

export function SimulationScreen({ result, onComplete }: SimulationScreenProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [showFinal, setShowFinal] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (revealedCount < STAGES.length) {
      const t = setTimeout(() => {
        setRevealedCount((c) => c + 1);
      }, revealedCount === 0 ? 400 : STAGE_REVEAL_DELAY + STAGE_PAUSE);
      return () => clearTimeout(t);
    }

    const finalT = setTimeout(() => {
      setShowFinal(true);
    }, STAGE_REVEAL_DELAY);

    const doneT = setTimeout(() => onCompleteRef.current(), STAGE_REVEAL_DELAY + 1200);
    return () => {
      clearTimeout(finalT);
      clearTimeout(doneT);
    };
  }, [revealedCount]);

  return (
    <div className="flex flex-col min-h-[100dvh] items-center justify-center px-5 max-w-lg mx-auto">
      <motion.p
        className="text-[10px] uppercase tracking-[0.4em] text-gold/60 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Simulating Season
      </motion.p>

      <div className="w-full space-y-4">
        {STAGES.map((stage, i) => {
          const outcome = result.stages[i];
          const revealed = i < revealedCount;
          if (!outcome) return null;

          return (
            <StageRow
              key={stage}
              stage={stage}
              passed={outcome.passed}
              revealed={revealed}
            />
          );
        })}
      </div>

      <AnimatePresence>
        {showFinal && (
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <h2
              className={`font-display text-3xl sm:text-4xl tracking-wide ${
                result.goldenRoad ? 'text-gold glow-gold' : 'text-white'
              }`}
            >
              {result.goldenRoad
                ? 'GOLDEN ROAD'
                : result.failureMessage.toUpperCase()}
            </h2>
            {result.goldenRoad && (
              <p className="text-gold/70 text-sm mt-2 tracking-widest uppercase">
                Achieved
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StageRow({
  stage,
  passed,
  revealed,
}: {
  stage: StageId;
  passed: boolean;
  revealed: boolean;
}) {
  return (
    <motion.div
      className={`flex items-center justify-between p-4 rounded-2xl border transition-colors duration-500 ${
        !revealed
          ? 'border-white/[0.04] bg-white/[0.02] opacity-40'
          : passed
            ? 'border-gold/30 bg-gold/5'
            : 'border-red-500/30 bg-red-500/5'
      }`}
      animate={revealed ? { opacity: 1, scale: 1 } : { opacity: 0.4, scale: 0.98 }}
    >
      <span className="font-display text-lg text-white/90">{STAGE_LABELS[stage]}</span>
      {revealed ? (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`flex items-center gap-1.5 text-sm font-medium ${
            passed ? 'text-gold' : 'text-red-400'
          }`}
        >
          {passed ? (
            <>
              <Check className="w-4 h-4" /> Champion
            </>
          ) : (
            <>
              <X className="w-4 h-4" /> Eliminated
            </>
          )}
        </motion.span>
      ) : (
        <span className="text-white/20 text-sm">...</span>
      )}
    </motion.div>
  );
}
