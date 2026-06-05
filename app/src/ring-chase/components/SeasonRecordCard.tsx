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
      className={`kb-card rounded-[var(--kb-r-lg)] text-center relative overflow-hidden ${
        compact ? 'px-5 py-5' : 'px-6 py-6'
      } ${isWin ? 'kb-card-accent-gold' : ''}`}
      style={{
        background: isWin
          ? 'linear-gradient(165deg, rgba(232,184,66,0.12) 0%, var(--kb-bg-card) 55%)'
          : undefined,
        boxShadow: isWin ? 'var(--kb-shadow-card), var(--kb-shadow-gold)' : undefined,
      }}
    >
      {isWin && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-40 h-24 bg-kb-gold/20 blur-3xl pointer-events-none" />
      )}

      <p className="text-[10px] uppercase tracking-[0.35em] text-kb-mute mb-2 relative">
        Season record
      </p>
      <p
        className={`font-display tabular-nums leading-none relative ${
          compact ? 'text-5xl sm:text-6xl' : 'text-6xl'
        } ${isWin ? 'text-ring-gold glow-ring' : 'text-kb-fg'}`}
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
        <p className="text-sm text-kb-soft mt-4 leading-relaxed relative max-w-[280px] mx-auto">
          {summary.narrative}
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
      className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border font-semibold ${
        highlight
          ? 'bg-kb-gold/12 text-kb-gold border-kb-gold/25'
          : 'bg-kb-glass text-kb-mute border-kb-border'
      }`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </span>
  );
}
