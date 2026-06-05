import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { SeasonSummary } from '../engine/season-summary';

interface SeasonRecordCardProps {
  summary: SeasonSummary;
  variant?: 'sim' | 'share' | 'result';
  perfectSeason?: boolean;
  ringWon?: boolean;
}

export function SeasonRecordCard({
  summary,
  variant = 'result',
  perfectSeason,
  ringWon,
}: SeasonRecordCardProps) {
  const isWin = perfectSeason || ringWon;
  const compact = variant === 'sim';

  return (
    <motion.div
      className={`rounded-2xl border text-center relative overflow-hidden ${
        compact ? 'px-5 py-5' : 'px-6 py-6'
      }`}
      style={{
        borderColor: isWin ? 'rgba(201, 162, 39, 0.45)' : 'rgba(255,255,255,0.1)',
        background: isWin
          ? 'linear-gradient(165deg, rgba(201,162,39,0.14) 0%, rgba(6,6,8,0.95) 55%)'
          : 'linear-gradient(165deg, rgba(255,255,255,0.04) 0%, rgba(6,6,8,0.95) 55%)',
        boxShadow: isWin ? '0 16px 48px rgba(201, 162, 39, 0.12)' : undefined,
      }}
    >
      {isWin && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-40 h-24 bg-ring-gold/20 blur-3xl pointer-events-none" />
      )}

      <p className="text-[10px] uppercase tracking-[0.35em] text-white/35 mb-2 relative">
        Season record
      </p>
      <p
        className={`font-display tabular-nums leading-none relative ${
          compact ? 'text-5xl sm:text-6xl' : 'text-6xl'
        } ${isWin ? 'text-ring-gold glow-ring' : 'text-white'}`}
      >
        {summary.record}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 relative">
        <Chip
          highlight={summary.majorWins > 0}
          label={summary.majorWins > 0 ? `Won ${summary.majorsLine}` : '0 Majors'}
        />
        <Chip
          highlight={Boolean(ringWon)}
          label={summary.champsLine}
          icon={ringWon ? Trophy : undefined}
        />
        <Chip highlight={perfectSeason} label={summary.ringLine} />
      </div>

      {!compact && (
        <p className="text-sm text-white/55 mt-4 leading-relaxed relative max-w-[280px] mx-auto">
          {summary.narrative}
        </p>
      )}

      {variant !== 'sim' && (
        <p className="text-[10px] text-white/30 mt-3 tabular-nums relative">
          Bracket {summary.bracketWins}-{summary.bracketLosses} · Regular season {summary.record}
        </p>
      )}
    </motion.div>
  );
}

function Chip({
  label,
  highlight,
  icon: Icon,
}: {
  label: string;
  highlight?: boolean;
  icon?: typeof Trophy;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border font-medium ${
        highlight
          ? 'bg-ring-gold/12 text-ring-gold/95 border-ring-gold/25'
          : 'bg-white/[0.04] text-white/50 border-white/[0.08]'
      }`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </span>
  );
}
