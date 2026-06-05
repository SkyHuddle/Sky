import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SimulationResult, StageId, StageOutcome } from '@/core/types';
import { STAGE_LABELS } from '@/core/types';
import { STAGES } from '@/core/types';
import { STAGE_PAUSE, RUN_BEAT_DELAY } from '@/core/constants';
import { Check, X, Minus } from 'lucide-react';

interface SimulationScreenProps {
  result: SimulationResult;
  onComplete: () => void;
}

export function SimulationScreen({ result, onComplete }: SimulationScreenProps) {
  const [stageIndex, setStageIndex] = useState(-1);
  const [beatIndex, setBeatIndex] = useState(-1);
  const [showFinal, setShowFinal] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setStageIndex(-1);
    setBeatIndex(-1);
    setShowFinal(false);
    const t = setTimeout(() => setStageIndex(0), 400);
    return () => clearTimeout(t);
  }, [result]);

  useEffect(() => {
    if (stageIndex < 0 || stageIndex >= STAGES.length) return;

    const stage = result.stages[stageIndex];
    if (!stage) return;

    let beat = 0;
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const schedule = (fn: () => void, ms: number) => {
      timeouts.push(setTimeout(fn, ms));
    };

    const finishStage = () => {
      if (cancelled) return;
      setBeatIndex(-1);
      schedule(() => {
        if (cancelled) return;
        if (stageIndex < STAGES.length - 1) {
          setStageIndex(stageIndex + 1);
        } else {
          setShowFinal(true);
          schedule(() => {
            if (!cancelled) onCompleteRef.current();
          }, 1100);
        }
      }, STAGE_PAUSE);
    };

    const runBeat = () => {
      if (cancelled) return;
      setBeatIndex(beat);
      const step = stage.run[beat];

      schedule(() => {
        if (cancelled) return;
        if (!step.passed) {
          finishStage();
          return;
        }
        beat += 1;
        if (beat < stage.run.length) {
          runBeat();
        } else {
          finishStage();
        }
      }, RUN_BEAT_DELAY);
    };

    runBeat();

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [stageIndex, result.stages]);

  return (
    <div className="flex flex-col min-h-[100dvh] items-center justify-center px-5 max-w-lg mx-auto py-10">
      <motion.p
        className="text-[10px] uppercase tracking-[0.45em] text-gold/60 mb-8 font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Golden Road Run
      </motion.p>

      <div className="w-full space-y-3">
        {STAGES.map((stageId, i) => {
          const outcome = result.stages[i];
          if (!outcome) return null;

          return (
            <StageBlock
              key={stageId}
              stage={stageId}
              outcome={outcome}
              isPast={i < stageIndex}
              isCurrent={i === stageIndex}
              isFuture={i > stageIndex}
              activeBeatIndex={i === stageIndex ? beatIndex : -1}
            />
          );
        })}
      </div>

      <AnimatePresence>
        {showFinal && (
          <motion.div
            className="mt-10 text-center px-4"
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          >
            <h2
              className={`font-display text-3xl sm:text-4xl tracking-wide leading-tight ${
                result.goldenRoad ? 'text-gold glow-gold' : 'text-white/90'
              }`}
            >
              {result.goldenRoad
                ? 'GOLDEN ROAD'
                : result.failureMessage.toUpperCase()}
            </h2>
            {!result.goldenRoad && (
              <p className="text-white/35 text-xs mt-2">So close — run it back</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StageBlock({
  stage,
  outcome,
  isPast,
  isCurrent,
  isFuture,
  activeBeatIndex,
}: {
  stage: StageId;
  outcome: StageOutcome;
  isPast: boolean;
  isCurrent: boolean;
  isFuture: boolean;
  activeBeatIndex: number;
}) {
  const stageDone = isPast || (isCurrent && activeBeatIndex < 0 && !isFuture);
  const stagePassed = outcome.passed && stageDone;

  return (
    <motion.div
      layout
      className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
        isFuture
          ? 'border-white/[0.04] bg-white/[0.015] opacity-30'
          : stageDone
            ? stagePassed
              ? 'border-gold/30 bg-gold/[0.05] shadow-lg shadow-gold/5'
              : 'border-red-500/25 bg-red-500/[0.06]'
            : 'border-gold/15 bg-white/[0.025] ring-1 ring-gold/10'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
        <span className="font-display text-lg text-white/90">{STAGE_LABELS[stage]}</span>
        {stageDone ? (
          <span
            className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${
              stagePassed ? 'text-gold' : 'text-red-400'
            }`}
          >
            {stagePassed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
            {stagePassed ? 'Cleared' : 'Out'}
          </span>
        ) : isCurrent ? (
          <span className="text-[10px] text-gold/70 uppercase tracking-widest animate-pulse font-medium">
            Live
          </span>
        ) : (
          <span className="text-white/15 text-xs">—</span>
        )}
      </div>

      {(isCurrent || isPast) && (
        <ul className="px-3 py-2 space-y-0.5">
          {outcome.run.map((beat, i) => {
            const revealed =
              isPast || (isCurrent && activeBeatIndex >= 0 && i <= activeBeatIndex);
            const isFailBeat = revealed && !beat.passed;
            const isPassBeat = revealed && beat.passed;

            if (!revealed) {
              return (
                <li
                  key={beat.label}
                  className="flex items-center gap-2 py-1.5 text-white/12 text-xs px-2"
                >
                  <Minus className="w-3 h-3" />
                  <span>···</span>
                </li>
              );
            }

            return (
              <motion.li
                key={beat.label}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-2 py-1.5 text-xs rounded-lg px-2.5 ${
                  isFailBeat
                    ? 'text-red-300/90 bg-red-500/12'
                    : isPassBeat
                      ? 'text-white/75'
                      : 'text-white/40'
                }`}
              >
                {isFailBeat ? (
                  <X className="w-3 h-3 shrink-0" />
                ) : isPassBeat ? (
                  <Check className="w-3 h-3 shrink-0 text-gold/80" />
                ) : (
                  <Minus className="w-3 h-3 shrink-0" />
                )}
                <span className="truncate">{beat.label}</span>
              </motion.li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}
