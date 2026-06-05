import { motion, AnimatePresence } from 'framer-motion';
import type { DailyConstraint, DraftPick, DraftRound, Player, Role } from '@/core/types';
import { ROLE_LABELS } from '@/core/types';
import { ROLE_ORDER } from '@/core/constants';
import { TeamBanner, TeamRosterCard } from './TeamRosterCard';
import { isOnePerOrgDay, orgConstraintViolated } from '@/features/daily';

interface DraftScreenProps {
  currentRole: Role;
  currentRoleIndex: number;
  currentRound: DraftRound;
  picks: DraftPick[];
  dailyConstraint?: DailyConstraint;
  isDaily: boolean;
  onSelect: (player: Player) => void;
  onBack: () => void;
}

export function DraftScreen({
  currentRole,
  currentRoleIndex,
  currentRound,
  picks,
  dailyConstraint,
  isDaily,
  onSelect,
  onBack,
}: DraftScreenProps) {
  const orgLock =
    isDaily && dailyConstraint && isOnePerOrgDay(dailyConstraint.id);

  const roleOrder: Role[] = ['top', 'jungle', 'mid', 'adc', 'support'];

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
          <p className="text-[10px] uppercase tracking-[0.35em] text-gold/70">
            Pick your {ROLE_LABELS[currentRole]}
          </p>
          <h2 className="font-display text-3xl text-white tracking-wide mt-1">
            From this roster
          </h2>
        </motion.div>
      </header>

      <div className="flex-1 px-5 py-4 overflow-y-auto pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentRound.team.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <TeamBanner team={currentRound.team} />

            <p className="text-white/40 text-xs mb-3 leading-relaxed">
              Tap a player to fill your {ROLE_LABELS[currentRole]} slot. Their {ROLE_LABELS[currentRole]} is highlighted.
            </p>

            <div className="space-y-2">
              {roleOrder.map((teamRole, i) => {
                const playerId = currentRound.team.roster[teamRole];
                const player = currentRound.roster.find((p) => p.id === playerId);
                if (!player) return null;

                const blocked =
                  orgLock &&
                  orgConstraintViolated(
                    picks.map((p) => p.player),
                    player
                  );

                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <TeamRosterCard
                      player={player}
                      teamRole={teamRole}
                      draftRole={currentRole}
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
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {picks.length > 0 && (
        <div className="px-5 pb-4 border-t border-white/[0.04] pt-3">
          <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Your roster</p>
          <div className="flex gap-1.5 flex-wrap">
            {picks.map(({ role, player, team }) => (
              <span
                key={role}
                className="text-[10px] px-2 py-1 rounded-full bg-white/[0.06] text-white/60"
              >
                {player.name.split(' ')[0]} · {team.year}
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
