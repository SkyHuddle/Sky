import { motion } from 'framer-motion';
import type { Player, Role } from '@/core/types';
import { ROLE_LABELS } from '@/core/types';

interface PositionAssignSheetProps {
  player: Player;
  naturalRole: Role;
  openRoles: Role[];
  onAssign: (role: Role) => void;
  onCancel: () => void;
}

export function PositionAssignSheet({
  player,
  naturalRole,
  openRoles,
  onAssign,
  onCancel,
}: PositionAssignSheetProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm px-4 pb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0c0c10] p-5"
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[10px] uppercase tracking-widest text-gold/70">Assign position</p>
        <h3 className="font-display text-2xl text-white mt-1">{player.name}</h3>
        <p className="text-white/40 text-xs mt-1">
          Played {ROLE_LABELS[naturalRole]} on this team · pick an open slot
        </p>

        <div className="grid grid-cols-2 gap-2 mt-5">
          {openRoles.map((role) => {
            const isNatural = role === naturalRole;
            return (
              <button
                key={role}
                type="button"
                onClick={() => onAssign(role)}
                className={`h-14 rounded-xl font-display text-lg tracking-wide transition-colors ${
                  isNatural
                    ? 'bg-gold/15 border border-gold/50 text-gold'
                    : 'bg-white/[0.04] border border-white/10 text-white hover:border-white/25'
                }`}
              >
                {ROLE_LABELS[role]}
                {isNatural && (
                  <span className="block text-[9px] font-sans font-normal text-gold/70 uppercase tracking-wider">
                    Natural
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="w-full mt-4 text-sm text-white/40 py-2"
        >
          Back
        </button>
      </motion.div>
    </motion.div>
  );
}
