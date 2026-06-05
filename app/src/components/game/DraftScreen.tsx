import { AnimatePresence, motion } from 'framer-motion';
import type {
  DailyConstraint,
  DraftPick,
  DraftRound,
  DraftSubphase,
  DraftTournamentPhase,
  Player,
  Role,
} from '@/core/types';
import { DRAFT_PHASE_LABELS, ROLE_LABELS } from '@/core/types';
import { DRAFT_PHASE_ORDER } from '@/core/types';
import { TeamBanner, TeamRosterCard } from './TeamRosterCard';
import { TeamSlotMachine } from './TeamSlotMachine';
import { PositionAssignSheet } from './PositionAssignSheet';
import { isOnePerOrgDay, orgConstraintViolated } from '@/features/daily';

interface DraftScreenProps {
  roundIndex: number;
  currentRound: DraftRound;
  draftSubphase: DraftSubphase;
  picks: DraftPick[];
  openRoles: Role[];
  skipsLeft: number;
  dailyConstraint?: DailyConstraint;
  isDaily: boolean;
  pendingPlayer: Player | null;
  pendingNaturalRole: Role | null;
  onSpinComplete: () => void;
  onSkipTeam: () => void;
  onSelectPlayer: (player: Player, naturalRole: Role) => void;
  onAssignRole: (role: Role) => void;
  onCancelAssign: () => void;
  onBack: () => void;
}

export function DraftScreen({
  roundIndex: _roundIndex,
  currentRound,
  draftSubphase,
  picks,
  openRoles,
  skipsLeft,
  dailyConstraint,
  isDaily,
  pendingPlayer,
  pendingNaturalRole,
  onSpinComplete,
  onSkipTeam,
  onSelectPlayer,
  onAssignRole,
  onCancelAssign,
  onBack,
}: DraftScreenProps) {
  const orgLock =
    isDaily && dailyConstraint && isOnePerOrgDay(dailyConstraint.id);

  const roleOrder: Role[] = ['top', 'jungle', 'mid', 'adc', 'support'];

  return (
    <div className="flex flex-col min-h-[100dvh] max-w-lg mx-auto">
      <header className="sticky top-0 z-20 px-5 pt-6 pb-3 bg-[#060608]/90 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={onBack}
            className="text-white/40 text-sm hover:text-white/70"
          >
            ← Exit
          </button>
          <span className="text-[10px] uppercase tracking-widest text-white/35">
            Pick {picks.length + 1}/5
          </span>
        </div>

        <TournamentProgress currentPhase={currentRound.phase} completedCount={picks.length} />
        <RosterSlots picks={picks} openRoles={openRoles} />
      </header>

      <div className="flex-1 overflow-y-auto">
        {draftSubphase === 'spin' && (
          <TeamSlotMachine
            phase={currentRound.phase}
            sequence={currentRound.spinSequence}
            onComplete={onSpinComplete}
            onSkip={onSkipTeam}
            canSkip={skipsLeft > 0}
          />
        )}

        {draftSubphase === 'pick' && (
          <motion.div
            className="px-5 py-4 pb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <TeamBanner team={currentRound.team} />

            <p className="text-white/45 text-xs mb-3 leading-relaxed">
              Pick one player from this roster. You still need:{' '}
              <span className="text-gold">
                {openRoles.map((r) => ROLE_LABELS[r]).join(', ')}
              </span>
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
                    transition={{ delay: i * 0.04 }}
                  >
                    <TeamRosterCard
                      player={player}
                      teamRole={teamRole}
                      onSelect={() => onSelectPlayer(player, teamRole)}
                      disabled={blocked}
                    />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {draftSubphase === 'assign' && pendingPlayer && pendingNaturalRole && (
          <PositionAssignSheet
            player={pendingPlayer}
            naturalRole={pendingNaturalRole}
            openRoles={openRoles}
            onAssign={onAssignRole}
            onCancel={onCancelAssign}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TournamentProgress({
  currentPhase,
  completedCount,
}: {
  currentPhase: DraftTournamentPhase;
  completedCount: number;
}) {
  return (
    <div className="mb-3">
      <p className="text-[10px] uppercase tracking-widest text-gold/60 mb-2">
        Golden Road — {DRAFT_PHASE_LABELS[currentPhase]}
      </p>
      <div className="flex gap-1">
        {DRAFT_PHASE_ORDER.map((phase, i) => (
          <div
            key={phase}
            className={`h-1 flex-1 rounded-full ${
              i < completedCount
                ? 'bg-gold'
                : phase === currentPhase
                  ? 'bg-gold/50'
                  : 'bg-white/10'
            }`}
            title={DRAFT_PHASE_LABELS[phase]}
          />
        ))}
      </div>
    </div>
  );
}

function RosterSlots({
  picks,
  openRoles,
}: {
  picks: DraftPick[];
  openRoles: Role[];
}) {
  const slots: Role[] = ['top', 'jungle', 'mid', 'adc', 'support'];
  return (
    <div className="flex gap-1">
      {slots.map((role) => {
        const pick = picks.find((p) => p.role === role);
        const open = openRoles.includes(role);
        return (
          <div
            key={role}
            className={`flex-1 rounded-lg py-1.5 px-1 text-center border ${
              pick
                ? 'border-gold/30 bg-gold/10'
                : open
                  ? 'border-white/15 bg-white/[0.03]'
                  : 'border-white/5 bg-transparent opacity-40'
            }`}
          >
            <p className="text-[8px] uppercase tracking-wider text-white/35">
              {ROLE_LABELS[role].slice(0, 3)}
            </p>
            <p className="text-[10px] text-white/80 truncate font-medium mt-0.5">
              {pick ? pick.player.name.split(' ')[0] : '—'}
            </p>
          </div>
        );
      })}
    </div>
  );
}
