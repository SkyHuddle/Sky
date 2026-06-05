import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SimulationResult, StageId } from '../core/types';
import {
  STAGES,
  STAGE_LABELS,
  MAJOR_OUTCOME_LABELS,
  CHAMPS_OUTCOME_LABELS,
} from '../core/types';
import { STAGE_PAUSE, STAGE_REVEAL_DELAY } from '../core/constants';
import { Check, X } from 'lucide-react';

interface SimulationScreenProps {
  result: SimulationResult;
  onComplete: () => void;
}

function outcomeLabel(stage: StageId, outcome: string): string {
  if (stage === 'champs') {
    return CHAMPS_OUTCOME_LABELS[outcome as keyof typeof CHAMPS_OUTCOME_LABELS] ?? outcome;
  }
  return MAJOR_OUTCOME_LABELS[outcome as keyof typeof MAJOR_OUTCOME_LABELS] ?? outcome;
}

export function SimulationScreen({ result, onComplete }: SimulationScreenProps) {
  const [stageIndex, setStageIndex] = useState(-1);
  const [showFinal, setShowFinal] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setStageIndex(-1);
    setShowFinal(false);
    const t = setTimeout(() => setStageIndex(0), 400);
    return () => clearTimeout(t);
  }, [result]);

  useEffect(() => {
    if (stageIndex < 0 || stageIndex >= STAGES.length) return;

    const t = setTimeout(() => {
      if (stageIndex < STAGES.length - 1) {
        setStageIndex(stageIndex + 1);
      } else {
        setShowFinal(true);
        setTimeout(() => onCompleteRef.current(), 1200);
      }
    }, STAGE_REVEAL_DELAY + STAGE_PAUSE);

    return () => clearTimeout(t);
  }, [stageIndex]);

  return (
    <div className="flex flex-col min-h-[100dvh] items-center justify-center px-5 max-w-lg mx-auto py-10">
      <motion.p
        className="text-[10px] uppercase tracking-[0.45em] text-ring-gold/60 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Ring Chase Run
      </motion.p>

      <div className="w-full space-y-3">
        {STAGES.map((stageId, i) => {
          const outcome = result.stages[i];
          if (!outcome) return null;
          const revealed = i <= stageIndex;
          const isCurrent = i === stageIndex;

          return (
            <motion.div
              key={stageId}
              layout
              className={`rounded-2xl border px-4 py-3.5 transition-all ${
                !revealed
                  ? 'border-white/[0.04] bg-white/[0.015] opacity-30'
                  : outcome.passed
                    ? 'border-ring-gold/30 bg-ring-gold/[0.05]'
                    : 'border-red-500/25 bg-red-500/[0.06]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-lg text-white/90">{STAGE_LABELS[stageId]}</span>
                {revealed ? (
                  <span
                    className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${
                      outcome.passed ? 'text-ring-gold' : 'text-red-400'
                    }`}
                  >
                    {outcome.passed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    {outcomeLabel(stageId, outcome.outcome)}
                  </span>
                ) : isCurrent ? (
                  <span className="text-[10px] text-ring-gold/70 uppercase animate-pulse">Live</span>
                ) : (
                  <span className="text-white/15">—</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {showFinal && (
          <motion.div
            className="mt-10 text-center px-4"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h2
              className={`font-display text-3xl sm:text-4xl tracking-wide ${
                result.perfectSeason
                  ? 'text-ring-gold glow-ring'
                  : result.ringWon
                    ? 'text-ring-gold glow-ring'
                    : 'text-white/90'
              }`}
            >
              {result.perfectSeason
                ? 'PERFECT SEASON'
                : result.ringWon
                  ? 'RING WON'
                  : 'NO RING'}
            </h2>
            <p className="text-white/40 text-xs mt-2">{result.explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
