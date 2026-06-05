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
        }, 400);
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
    <div className="flex flex-col items-center justify-center min-h-[50dvh] px-5 pb-6">
      <p className="text-[10px] uppercase tracking-[0.35em] text-gold/70 mb-2">
        {DRAFT_PHASE_LABELS[phase]}
      </p>
      <p className="text-white/40 text-xs mb-6 uppercase tracking-widest">
        Rolling year & team…
      </p>

      <div className="w-full max-w-sm grid grid-cols-2 gap-3 mb-4">
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
        className="w-full max-w-sm rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center"
        animate={done ? { borderColor: 'rgba(201, 162, 39, 0.45)' } : {}}
      >
        {!done ? (
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full bg-gold/70"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        ) : (
          <p className="text-sm" style={{ color: team.accent }}>
            {team.tagline}
          </p>
        )}
      </motion.div>

      {!done && (
        <p className="text-white/25 text-[10px] uppercase tracking-widest mt-5 animate-pulse">
          Spinning…
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
      className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center overflow-hidden min-h-[100px] flex flex-col justify-center"
      animate={highlight ? { borderColor: `${accent}80` } : {}}
    >
      <p className="text-[9px] uppercase tracking-[0.3em] text-white/35 mb-2">{label}</p>
      <motion.p
        key={value}
        initial={{ opacity: 0.5, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.06 }}
        className={`font-display tracking-wide leading-tight ${
          small ? 'text-lg' : 'text-4xl'
        } ${highlight ? '' : 'text-white'}`}
        style={highlight ? { color: accent } : undefined}
      >
        {value}
      </motion.p>
      {sub && (
        <p className="text-[10px] text-white/30 mt-1 uppercase tracking-wider">{sub}</p>
      )}
    </motion.div>
  );
}
