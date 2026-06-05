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
    <div className="flex flex-col items-center justify-center min-h-[52dvh] px-5 pb-8">
      <div className="text-center mb-8">
        <p className="text-[10px] uppercase tracking-[0.4em] text-gold/80 mb-2">
          {DRAFT_PHASE_LABELS[phase]}
        </p>
        <p className="text-white/50 text-sm">
          Rolling year &amp; team…
        </p>
      </div>

      <div className="w-full max-w-sm grid grid-cols-2 gap-3 mb-5">
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
        className="w-full max-w-sm rounded-2xl border px-5 py-4 text-center relative overflow-hidden"
        style={{
          borderColor: done ? `${team.accent}66` : 'rgba(255,255,255,0.1)',
          background: `linear-gradient(180deg, ${team.accent}12 0%, rgba(255,255,255,0.02) 100%)`,
        }}
        animate={done ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.35 }}
      >
        {!done ? (
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${progress * 100}%`,
                background: `linear-gradient(90deg, ${team.accent}99, #c9a227)`,
              }}
            />
          </div>
        ) : (
          <p className="text-sm font-medium" style={{ color: team.accent }}>
            {team.tagline}
          </p>
        )}
      </motion.div>

      {!done && (
        <p className="text-white/30 text-[10px] uppercase tracking-[0.3em] mt-6 animate-pulse">
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
      className="rounded-2xl border p-4 text-center overflow-hidden min-h-[108px] flex flex-col justify-center relative"
      style={{
        borderColor: highlight ? `${accent}70` : 'rgba(255,255,255,0.1)',
        background: highlight
          ? `linear-gradient(160deg, ${accent}20 0%, rgba(255,255,255,0.03) 100%)`
          : 'rgba(255,255,255,0.03)',
        boxShadow: highlight ? `0 0 28px ${accent}15` : undefined,
      }}
    >
      <p className="text-[9px] uppercase tracking-[0.3em] text-white/35 mb-2">
        {label}
      </p>
      <motion.p
        key={value}
        initial={{ opacity: 0.4, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.06 }}
        className={`font-display tracking-wide leading-tight ${
          small ? 'text-base' : 'text-4xl'
        } ${highlight ? '' : 'text-white/90'}`}
        style={highlight ? { color: accent } : undefined}
      >
        {value}
      </motion.p>
      {sub && (
        <p className="text-[10px] text-white/35 mt-1.5 uppercase tracking-wider">
          {sub}
        </p>
      )}
    </motion.div>
  );
}
