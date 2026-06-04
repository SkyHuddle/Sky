import { motion, AnimatePresence } from 'framer-motion';
import type { DailyConstraint, DraftPick, Player, Role } from '@/core/types';
import { ROLE_LABELS } from '@/core/types';
import { ROLE_ORDER } from '@/core/constants';
import { PlayerCard } from './PlayerCard';
import { isOnePerOrgDay, orgConstraintViolated } from '@/features/daily';

interface DraftScreenProps {
  currentRole: Role;
  currentRoleIndex: number;
  draftPool: Player[];
  picks: DraftPick[];
  dailyConstraint?: DailyConstraint;
  isDaily: boolean;
  onSelect: (player: Player) => void;
  onBack: () => void;
}

export function DraftScreen({
  currentRole,
  currentRoleIndex,
  draftPool,
  picks,
  dailyConstraint,
  isDaily,
  onSelect,
  onBack,
}: DraftScreenProps) {
  const orgLock =
    isDaily && dailyConstraint && isOnePerOrgDay(dailyConstraint.id);

  return (
    <div className="flex flex-col min-h-[100dvh] max-w-lg mx-auto">
      <header className="sticky top-0 z-20 px-5 pt-6 pb-4 bg-[#060608]/90 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onBack}
            className="text-white/40 text-sm hover:text-white/70"
          >
            ← Exit
          </button>
          <span className="text-[10px] uppercase tracking-widest text-white/35">
            Round {currentRoleIndex + 1}/5
          </span>
        </div>

        <RoleProgress currentIndex={currentRoleIndex} />

        <motion.div
          key={currentRole}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mt-4"
        >
          <p className="text-[10px] uppercase tracking-[0.35em] text-gold/70">Draft</p>
          <h2 className="font-display text-4xl text-white tracking-wide">
            {ROLE_LABELS[currentRole]}
          </h2>
          {isDaily && dailyConstraint && (
            <p className="text-white/40 text-xs mt-1">{dailyConstraint.description}</p>
          )}
        </motion.div>
      </header>

      <div className="flex-1 px-5 py-4 space-y-3 overflow-y-auto pb-6">
        <AnimatePresence mode="popLayout">
          {draftPool.map((player, i) => {
            const blocked =
              orgLock &&
              orgConstraintViolated(
                picks.map((p) => p.player),
                player
              );

            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.06 }}
              >
                <PlayerCard
                  player={player}
                  onSelect={() => onSelect(player)}
                  disabled={blocked}
                />
                {blocked && (
                  <p className="text-[10px] text-red-400/80 mt-1 pl-1">
                    Org already used
                  </p>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {picks.length > 0 && (
        <div className="px-5 pb-4">
          <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Roster</p>
          <div className="flex gap-1.5 flex-wrap">
            {picks.map(({ role, player }) => (
              <span
                key={role}
                className="text-[10px] px-2 py-1 rounded-full bg-white/[0.06] text-white/60"
              >
                {ROLE_LABELS[role].slice(0, 3)} {player.name.split(' ')[0]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RoleProgress({ currentIndex }: { currentIndex: number }) {
  return (
    <div className="flex gap-1">
      {ROLE_ORDER.map((role, i) => (
        <div
          key={role}
          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
            i < currentIndex
              ? 'bg-gold'
              : i === currentIndex
                ? 'bg-gold/60'
                : 'bg-white/10'
          }`}
        />
      ))}
    </div>
  );
}
