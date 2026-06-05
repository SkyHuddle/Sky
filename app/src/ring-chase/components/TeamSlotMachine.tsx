import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { SlotSpin } from '../core/types';
import { SPIN_TICK_MS } from '../core/constants';
import { hapticTap } from '../utils/haptics';

const NEUTRAL_GLOW = 'rgba(232, 184, 66, 0.12)';

interface TeamSlotMachineProps {
  spin: SlotSpin;
  spinKey: number;
  roundIndex: number;
  onComplete: () => void;
}

export function TeamSlotMachine({
  spin,
  spinKey,
  roundIndex,
  onComplete,
}: TeamSlotMachineProps) {
  const pickNumber = roundIndex + 1;
  const [index, setIndex] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setIndex(0);
  }, [spinKey, spin]);

  useEffect(() => {
    const totalTicks = spin.yearSequence.length;
    if (totalTicks === 0) {
      onCompleteRef.current();
      return;
    }

    let tick = 0;
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    interval = setInterval(() => {
      if (cancelled) return;
      tick += 1;
      setIndex(tick - 1);

      if (tick >= totalTicks) {
        if (interval) clearInterval(interval);
        hapticTap();
        onCompleteRef.current();
      }
    }, SPIN_TICK_MS);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [spinKey, spin.yearSequence.length]);

  const year = spin.yearSequence[index] ?? spin.yearSequence.at(-1) ?? '';
  const name = spin.nameSequence[index] ?? '';
  const region = spin.regionSequence[index] ?? '';
  const tickAccent = spin.accentSequence[index] ?? NEUTRAL_GLOW;
  const progress = spin.yearSequence.length ? (index + 1) / spin.yearSequence.length : 1;

  return (
    <div className="flex flex-col items-center justify-center min-h-[54dvh] px-5 pb-10 relative w-full">
      <div
        className="absolute inset-x-8 top-1/4 h-48 rounded-full blur-3xl opacity-30 pointer-events-none transition-colors duration-75"
        style={{ backgroundColor: tickAccent }}
      />

      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-[10px] uppercase tracking-[0.45em] text-kb-gold/80 mb-2 font-semibold">
          Pick {pickNumber} of 4
        </p>
      </motion.div>

      <div className="w-full max-w-sm grid grid-cols-2 gap-3 mb-6">
        <Reel label="Year" value={String(year)} accent={tickAccent} />
        <Reel label="Team" value={name} sub={region} accent={tickAccent} small />
      </div>

      <div className="kb-card w-full max-w-sm rounded-[var(--kb-r-lg)] border border-kb-border px-5 py-5">
        <div className="h-1.5 rounded-full bg-kb-glass-strong overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              width: `${progress * 100}%`,
              background: `linear-gradient(90deg, ${tickAccent}, var(--kb-gold))`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Reel({
  label,
  value,
  sub,
  accent,
  small,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  small?: boolean;
}) {
  return (
    <motion.div
      className="kb-card rounded-[var(--kb-r-md)] border border-kb-border p-4 text-center overflow-hidden min-h-[112px] flex flex-col justify-center"
      style={{
        borderColor: `${accent}35`,
        background: `linear-gradient(160deg, ${accent}14 0%, var(--kb-bg-card) 100%)`,
      }}
    >
      <p className="text-[9px] uppercase tracking-[0.3em] text-kb-mute mb-2 font-semibold">{label}</p>
      <motion.p
        key={value}
        initial={{ opacity: 0.35, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.05 }}
        className={`font-display tracking-wide leading-tight text-kb-fg ${
          small ? 'text-[0.95rem] px-1' : 'text-4xl'
        }`}
      >
        {value}
      </motion.p>
      {sub && <p className="text-[10px] text-kb-mute mt-1.5 uppercase tracking-wider">{sub}</p>}
    </motion.div>
  );
}
