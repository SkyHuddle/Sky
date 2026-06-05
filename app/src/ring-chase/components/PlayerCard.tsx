import { motion } from 'framer-motion';
import type { CodPlayer } from '../core/types';
import { ROLE_LABELS } from '../core/types';

interface PlayerCardProps {
  player: CodPlayer;
  selected?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export function PlayerCard({ player, selected, disabled, onSelect }: PlayerCardProps) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={`w-full text-left rounded-2xl p-4 border transition-all ${
        selected
          ? 'border-ring-gold bg-ring-gold/15 shadow-lg shadow-ring-gold/10'
          : disabled
            ? 'border-white/[0.04] bg-white/[0.01] opacity-40'
            : 'border-white/[0.08] bg-white/[0.03] hover:border-ring-gold/30 hover:bg-white/[0.05] active:scale-[0.99]'
      }`}
    >
      <div className="flex items-center gap-3.5">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
          style={{
            background: `${player.accent}18`,
            color: player.accent,
            border: `1px solid ${player.accent}30`,
          }}
        >
          {player.gamertag.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-lg text-white truncate">{player.gamertag}</p>
          <p className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5">
            {ROLE_LABELS[player.primaryRole]}
          </p>
          {player.badge && (
            <span className="inline-block mt-1.5 text-[9px] px-2 py-0.5 rounded-full bg-ring-gold/15 text-ring-gold/90">
              {player.badge}
            </span>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className="font-display text-2xl tabular-nums text-ring-gold">
            {Math.round(player.ratings.overall)}
          </span>
        </div>
      </div>
    </motion.button>
  );
}
