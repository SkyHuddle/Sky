import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { HistoricalCodTeam, SlotSpin } from '../core/types';
import { SPIN_TICK_MS } from '../core/constants';

interface TeamSlotMachineProps {
  team: HistoricalCodTeam;
  spin: SlotSpin;
  spinKey: number;
  roundIndex: number;
  onComplete: () => void;
}

export function TeamSlotMachine({
  team,
  spin,
  spinKey,
  roundIndex,
  onComplete,
}: TeamSlotMachineProps) {
  const pickNumber = roundIndex + 1;
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setIndex(0);
    setDone(false);
  }, [spinKey, spin]);

  useEffect(() => {
    const totalTicks = spin.yearSequence.length;
    if (totalTicks === 0) return;

    let tick = 0;
    let cancelled = false;

    const interval = setInterval(() => {
      if (cancelled) return;
      tick += 1;
      setIndex(tick - 1);

      if (tick >= totalTicks) {
        clearInterval(interval);
        setDone(true);
        setTimeout(() => {
          if (!cancelled) onCompleteRef.current();
        }, 450);
      }
    }, SPIN_TICK_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [spinKey, spin.yearSequence.length]);

  const year = spin.yearSequence[index] ?? team.season;
  const name = spin.nameSequence[index] ?? team.teamName;
  const region = spin.regionSequence[index] ?? team.region;
  const progress = spin.yearSequence.length ? (index + 1) / spin.yearSequence.length : 1;

  return (
    <div className="flex flex-col items-center justify-center min-h-[54dvh] px-5 pb-10 relative">
      <div
        className="absolute inset-x-8 top-1/4 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: team.accent }}
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
        <Reel label="Year" value={String(year)} highlight={done} accent={team.accent} />
        <Reel label="Team" value={name} sub={region} highlight={done} accent={team.accent} small />
      </div>

      <motion.div
        className="kb-card w-full max-w-sm rounded-[var(--kb-r-lg)] border px-5 py-5 text-center relative overflow-hidden"
        style={{
          borderColor: done ? `${team.accent}55` : undefined,
          background: done
            ? `linear-gradient(180deg, ${team.accent}18 0%, var(--kb-bg-card) 100%)`
            : undefined,
          boxShadow: done ? `0 16px 48px ${team.accent}15` : undefined,
        }}
        animate={done ? { scale: [1, 1.015, 1] } : {}}
        transition={{ duration: 0.4 }}
      >
        {!done ? (
          <div className="h-1.5 rounded-full bg-kb-glass-strong overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${progress * 100}%`,
                background: `linear-gradient(90deg, ${team.accent}, var(--kb-gold))`,
              }}
            />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-[10px] uppercase tracking-widest text-kb-mute mb-1">You landed</p>
            <p className="text-base font-medium" style={{ color: team.accent }}>
              {team.eventContext}
            </p>
            <p className="text-[10px] text-kb-faint mt-1">{team.gameTitle}</p>
          </motion.div>
        )}
      </motion.div>

      {!done && (
        <p className="text-kb-faint text-[10px] uppercase tracking-[0.35em] mt-8 animate-pulse">
          Spinning
        </p>
      )}
    </div>
  );
}

function Reel({
  label,
  value,
  sub,
  highlight,
  accent,
  small,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight: boolean;
  accent: string;
  small?: boolean;
}) {
  return (
    <motion.div
      className="kb-card rounded-[var(--kb-r-md)] border p-4 text-center overflow-hidden min-h-[112px] flex flex-col justify-center"
      style={{
        borderColor: highlight ? `${accent}60` : undefined,
        background: highlight
          ? `linear-gradient(160deg, ${accent}22 0%, var(--kb-bg-card) 100%)`
          : undefined,
        boxShadow: highlight ? `0 0 32px ${accent}12` : undefined,
      }}
    >
      <p className="text-[9px] uppercase tracking-[0.3em] text-kb-mute mb-2 font-semibold">{label}</p>
      <motion.p
        key={value}
        initial={{ opacity: 0.3, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.05 }}
        className={`font-display tracking-wide leading-tight ${
          small ? 'text-[0.95rem] px-1' : 'text-4xl'
        } ${highlight ? '' : 'text-kb-fg'}`}
        style={highlight ? { color: accent } : undefined}
      >
        {value}
      </motion.p>
      {sub && <p className="text-[10px] text-kb-mute mt-1.5 uppercase tracking-wider">{sub}</p>}
    </motion.div>
  );
}
