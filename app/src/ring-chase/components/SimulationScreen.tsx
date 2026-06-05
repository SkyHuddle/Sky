import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DraftPick, SimulationResult, StageId, StageOutcome } from '../core/types';
import { STAGES, STAGE_LABELS } from '../core/types';
import { STAGE_PAUSE, RUN_BEAT_DELAY } from '../core/constants';
import { lanMomentForBeat } from '../engine/lan-moments';
import { Check, X, Minus, Radio } from 'lucide-react';
import { SeasonRecordCard } from './SeasonRecordCard';

interface SimulationScreenProps {
  result: SimulationResult;
  picks: DraftPick[];
  simSeed: string;
  onComplete: () => void;
}

export function SimulationScreen({ result, picks, simSeed, onComplete }: SimulationScreenProps) {
  const [stageIndex, setStageIndex] = useState(-1);
  const [beatIndex, setBeatIndex] = useState(-1);
  const [showFinal, setShowFinal] = useState(false);
  const [activeMoment, setActiveMoment] = useState<string | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setStageIndex(-1);
    setBeatIndex(-1);
    setShowFinal(false);
    setActiveMoment(null);
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
      setActiveMoment(null);
      schedule(() => {
        if (cancelled) return;
        if (stageIndex < STAGES.length - 1) {
          setStageIndex(stageIndex + 1);
        } else {
          setShowFinal(true);
          schedule(() => {
            if (!cancelled) onCompleteRef.current();
          }, 2200);
        }
      }, STAGE_PAUSE);
    };

    const runBeat = () => {
      if (cancelled) return;
      setBeatIndex(beat);
      const step = stage.run[beat];
      const moment = lanMomentForBeat(picks, stage.stage, step, beat, simSeed);
      setActiveMoment(moment);

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
  }, [stageIndex, result.stages, picks, simSeed]);

  return (
    <div className="flex flex-col min-h-[calc(100dvh-4rem)] items-center justify-center px-5 max-w-lg mx-auto py-10">
      <motion.p
        className="text-[10px] uppercase tracking-[0.45em] text-kb-gold/70 mb-2 font-semibold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Ring Chase Run
      </motion.p>
      <motion.p
        className="text-kb-mute text-xs mb-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
      >
        Win every major. Then Champs.
      </motion.p>

      <AnimatePresence mode="wait">
        {activeMoment && stageIndex >= 0 && !showFinal && (
          <motion.div
            key={activeMoment}
            className="w-full mb-4 rounded-[var(--kb-r-md)] border border-kb-amber/25 bg-kb-amber/[0.08] px-3.5 py-2.5 flex items-start gap-2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            <Radio className="w-3.5 h-3.5 text-kb-amber shrink-0 mt-0.5 animate-pulse" />
            <p className="text-xs text-kb-soft leading-relaxed">{activeMoment}</p>
          </motion.div>
        )}
      </AnimatePresence>

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
            className="mt-8 w-full px-1"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          >
            <SeasonRecordCard
              summary={result.seasonSummary}
              variant="sim"
              perfectSeason={result.perfectSeason}
              ringWon={result.ringWon}
            />
            <p className="text-center text-kb-mute text-xs mt-4 leading-relaxed px-2">
              {result.seasonSummary.narrative}
            </p>
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
      className={`rounded-[var(--kb-r-lg)] border overflow-hidden transition-all duration-300 ${
        isFuture
          ? 'border-kb-hairline bg-kb-card/40 opacity-30'
          : stageDone
            ? stagePassed
              ? 'kb-card-accent-gold border-kb-gold/30 bg-kb-gold/[0.05]'
              : 'border-kb-crimson/25 bg-kb-crimson/[0.06]'
            : 'border-kb-gold/15 bg-kb-card ring-1 ring-kb-gold/10'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-kb-hairline gap-3">
        <span className="font-display text-lg text-kb-fg">{STAGE_LABELS[stage]}</span>
        {stageDone ? (
          <span
            className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${
              stagePassed ? 'text-kb-gold' : 'text-kb-crimson'
            }`}
          >
            {stagePassed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
            {stagePassed ? 'Cleared' : 'Out'}
          </span>
        ) : isCurrent ? (
          <span className="text-[10px] text-kb-amber uppercase tracking-widest animate-pulse font-semibold">
            Live
          </span>
        ) : (
          <span className="text-kb-faint text-xs">—</span>
        )}
      </div>

      {(isCurrent || isPast) && (
        <ul className="px-3 py-2 space-y-0.5">
          {outcome.run.map((beat, i) => {
            const revealed = isPast || (isCurrent && activeBeatIndex >= 0 && i <= activeBeatIndex);
            const isFailBeat = revealed && !beat.passed;
            const isPassBeat = revealed && beat.passed;

            if (!revealed) {
              return (
                <li
                  key={beat.label}
                  className="flex items-center gap-2 py-1.5 text-kb-faint text-xs px-2"
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
                    ? 'text-kb-crimson/90 bg-kb-crimson/12'
                    : isPassBeat
                      ? 'text-kb-soft'
                      : 'text-kb-mute'
                }`}
              >
                {isFailBeat ? (
                  <X className="w-3 h-3 shrink-0" />
                ) : isPassBeat ? (
                  <Check className="w-3 h-3 shrink-0 text-kb-gold/80" />
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
