import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { HistoricalTeam, SlotSpin } from '@/core/types';
import { DRAFT_PHASE_LABELS } from '@/core/types';
import type { DraftTournamentPhase } from '@/core/types';
import { SPIN_TICK_MS } from '@/core/constants';

interface TeamSlotMachineProps {
  phase: DraftTournamentPhase;
  team: HistoricalTeam;
  spin: SlotSpin;
  spinKey: number;
  onComplete: () => void;
}

export function TeamSlotMachine({
  phase,
  team,
  spin,
  spinKey,
  onComplete,
}: TeamSlotMachineProps) {
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

  const year = spin.yearSequence[index] ?? team.year;
  const name = spin.nameSequence[index] ?? team.name;
  const region = spin.regionSequence[index] ?? team.region;
  const progress = spin.yearSequence.length
    ? (index + 1) / spin.yearSequence.length
    : 1;

  return (
    <div className="flex flex-col items-center justify-center min-h-[54dvh] px-5 pb-10">
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-[10px] uppercase tracking-[0.45em] text-gold/80 mb-2 font-medium">
          {DRAFT_PHASE_LABELS[phase]}
        </p>
        <p className="text-white/45 text-sm">Rolling your team…</p>
      </motion.div>

      <div className="w-full max-w-sm grid grid-cols-2 gap-3 mb-6">
        <Reel label="Year" value={String(year)} highlight={done} accent={team.accent} />
        <Reel
          label="Team"
          value={name}
          sub={region}
          highlight={done}
          accent={team.accent}
          small
        />
      </div>

      <motion.div
        className="w-full max-w-sm rounded-2xl border px-5 py-5 text-center relative overflow-hidden"
        style={{
          borderColor: done ? `${team.accent}55` : 'rgba(255,255,255,0.08)',
          background: done
            ? `linear-gradient(180deg, ${team.accent}18 0%, rgba(255,255,255,0.02) 100%)`
            : 'rgba(255,255,255,0.02)',
          boxShadow: done ? `0 16px 48px ${team.accent}15` : undefined,
        }}
        animate={done ? { scale: [1, 1.015, 1] } : {}}
        transition={{ duration: 0.4 }}
      >
        {!done ? (
          <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${progress * 100}%`,
                background: `linear-gradient(90deg, ${team.accent}, #c9a227)`,
              }}
            />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-[10px] uppercase tracking-widest text-white/35 mb-1">
              You landed
            </p>
            <p className="text-base font-medium" style={{ color: team.accent }}>
              {team.tagline}
            </p>
          </motion.div>
        )}
      </motion.div>

      {!done && (
        <p className="text-white/25 text-[10px] uppercase tracking-[0.35em] mt-8 animate-pulse">
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
      className="rounded-2xl border p-4 text-center overflow-hidden min-h-[112px] flex flex-col justify-center relative"
      style={{
        borderColor: highlight ? `${accent}60` : 'rgba(255,255,255,0.08)',
        background: highlight
          ? `linear-gradient(160deg, ${accent}22 0%, rgba(255,255,255,0.02) 100%)`
          : 'rgba(255,255,255,0.02)',
        boxShadow: highlight ? `0 0 32px ${accent}12, inset 0 1px 0 ${accent}20` : undefined,
      }}
    >
      <p className="text-[9px] uppercase tracking-[0.3em] text-white/30 mb-2 font-medium">
        {label}
      </p>
      <motion.p
        key={value}
        initial={{ opacity: 0.3, y: 10, filter: 'blur(2px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.05 }}
        className={`font-display tracking-wide leading-tight ${
          small ? 'text-[0.95rem] px-1' : 'text-4xl'
        } ${highlight ? '' : 'text-white/85'}`}
        style={highlight ? { color: accent } : undefined}
      >
        {value}
      </motion.p>
      {sub && (
        <p className="text-[10px] text-white/30 mt-1.5 uppercase tracking-wider">{sub}</p>
      )}
    </motion.div>
  );
}
