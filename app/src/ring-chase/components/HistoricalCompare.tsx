import { motion } from 'framer-motion';
import { History, Trophy } from 'lucide-react';
import type { HistoricalComparison } from '../core/types';

interface HistoricalCompareProps {
  comparison: HistoricalComparison;
}

export function HistoricalCompare({ comparison }: HistoricalCompareProps) {
  return (
    <motion.div
      className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-ring-gold/70" />
        <span className="text-[10px] uppercase tracking-widest text-white/40">
          vs. real history
        </span>
      </div>

      <p className="text-sm text-white/75 leading-relaxed">{comparison.anchorLine}</p>
      <p className="text-xs text-ring-gold/65 mt-2 leading-relaxed">{comparison.contrastLine}</p>

      <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-3">
        {comparison.facts.map((fact) => (
          <div key={`${fact.teamLabel}-${fact.playerTag}`} className="flex items-start gap-2 text-xs">
            <div className="flex-1 min-w-0">
              <p className="text-white/70 truncate">
                <span className="text-white/45">{fact.playerTag}</span>
                {' · '}
                {fact.teamLabel}
              </p>
              <p className="text-[10px] text-white/35 mt-0.5">
                {fact.placement} · {fact.majors} major{fact.majors === 1 ? '' : 's'} · Champs:{' '}
                {fact.champs}
              </p>
            </div>
            {fact.ringThatYear && (
              <Trophy className="w-3.5 h-3.5 text-ring-gold shrink-0 mt-0.5" />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
