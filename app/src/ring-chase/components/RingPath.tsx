import { STAGES, STAGE_LABELS } from '../core/types';

export function RingPath({ variant = 'compact' }: { variant?: 'compact' | 'full' }) {
  return (
    <div className={`flex items-center ${variant === 'full' ? 'justify-between gap-1' : 'gap-2'}`}>
      {STAGES.map((stage, i) => (
        <div key={stage} className="flex items-center flex-1 min-w-0">
          <div className="flex flex-col items-center flex-1 min-w-0">
            <div
              className={`rounded-full border flex items-center justify-center shrink-0 ${
                variant === 'full' ? 'w-8 h-8 text-[9px]' : 'w-6 h-6 text-[8px]'
              } border-ring-gold/30 bg-ring-gold/10 text-ring-gold/80 font-display`}
            >
              {i + 1}
            </div>
            <span
              className={`mt-1.5 text-center truncate w-full ${
                variant === 'full' ? 'text-[9px]' : 'text-[8px]'
              } uppercase tracking-wider text-white/35`}
            >
              {STAGE_LABELS[stage]}
            </span>
          </div>
          {i < STAGES.length - 1 && (
            <div className="h-px flex-1 bg-gradient-to-r from-ring-gold/25 to-transparent mx-0.5 mb-4" />
          )}
        </div>
      ))}
    </div>
  );
}
