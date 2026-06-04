import { motion } from 'framer-motion';
import type { Player } from '@/core/types';
import { cn } from '@/lib/utils';

interface PlayerCardProps {
  player: Player;
  onSelect: () => void;
  disabled?: boolean;
  selected?: boolean;
}

export function PlayerCard({ player, onSelect, disabled, selected }: PlayerCardProps) {
  const initials = player.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'relative w-full text-left rounded-2xl p-4 transition-colors',
        'border border-white/[0.08] bg-white/[0.03]',
        'active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none',
        selected && 'ring-2 ring-gold/80 border-gold/40',
        !disabled && 'hover:border-gold/30 hover:bg-white/[0.06]'
      )}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      layout
    >
      {selected && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            boxShadow: `0 0 40px ${player.accent}40, inset 0 0 60px ${player.accent}15`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}

      <div className="flex gap-4 items-center relative z-10">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
          style={{
            background: `linear-gradient(135deg, ${player.accent}40 0%, ${player.accent}15 100%)`,
            border: `1px solid ${player.accent}50`,
            color: player.accent,
          }}
        >
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl tracking-wide text-white truncate">
            {player.name}
          </h3>
          <p className="text-gold/80 text-sm font-medium mt-0.5">
            {player.peakTeam} ({player.peakYear})
          </p>
          <p className="text-white/50 text-xs mt-1 line-clamp-2 leading-relaxed">
            {player.achievements}
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-2xl font-display text-gold tabular-nums">
            {player.ratings.overall}
          </span>
          <p className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5">OVR</p>
        </div>
      </div>
    </motion.button>
  );
}
