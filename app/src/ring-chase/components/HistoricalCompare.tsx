import { motion } from 'framer-motion';
import { History, Trophy } from 'lucide-react';
import type { HistoricalComparison } from '../core/types';
import { KbCard } from './KbCard';

interface HistoricalCompareProps {
  comparison: HistoricalComparison;
}

export function HistoricalCompare({ comparison }: HistoricalCompareProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <KbCard>
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-kb-gold/80" />
          <span className="text-[10px] uppercase tracking-widest text-kb-mute font-semibold">
            vs. real history
          </span>
        </div>

        <p className="text-sm text-kb-soft leading-relaxed">{comparison.anchorLine}</p>
        <p className="text-xs text-kb-gold/80 mt-2 leading-relaxed">{comparison.contrastLine}</p>

        <div className="mt-4 space-y-2 border-t border-kb-hairline pt-3">
          {comparison.facts.map((fact) => (
            <div key={`${fact.teamLabel}-${fact.playerTag}`} className="flex items-start gap-2 text-xs">
              <div className="flex-1 min-w-0">
                <p className="text-kb-soft truncate">
                  <span className="text-kb-mute">{fact.playerTag}</span>
                  {' · '}
                  {fact.teamLabel}
                </p>
                <p className="text-[10px] text-kb-mute mt-0.5 kb-mono">
                  {fact.placement} · {fact.majors} major{fact.majors === 1 ? '' : 's'} · Champs:{' '}
                  {fact.champs}
                </p>
              </div>
              {fact.ringThatYear && (
                <Trophy className="w-3.5 h-3.5 text-kb-gold shrink-0 mt-0.5" />
              )}
            </div>
          ))}
        </div>
      </KbCard>
    </motion.div>
  );
}
