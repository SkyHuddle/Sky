import { motion } from 'framer-motion';
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
import { isOnePerOrgDay, orgConstraintViolated } from '@/features/daily';
import { cardOverall, teamRosterAvgOvr } from '@/engine/player-power';
import { ovrAccentColor } from '@/engine/ovr-display';

interface DraftScreenProps {
  currentRound: DraftRound;
  draftSubphase: DraftSubphase;
  picks: DraftPick[];
  openRoles: Role[];
  spinGeneration: number;
  respinsLeft: number;
  dailyConstraint?: DailyConstraint;
  isDaily: boolean;
  onSpinComplete: () => void;
  onRespinTeam: () => void;
  onSelectPlayer: (player: Player, naturalRole: Role) => void;
  onBack: () => void;
}

export function DraftScreen({
  currentRound,
  draftSubphase,
  picks,
  openRoles,
  spinGeneration,
  respinsLeft,
  dailyConstraint,
  isDaily,
  onSpinComplete,
  onRespinTeam,
  onSelectPlayer,
  onBack,
}: DraftScreenProps) {
  const orgLock =
    isDaily && dailyConstraint && isOnePerOrgDay(dailyConstraint.id);

  const roleOrder: Role[] = ['top', 'jungle', 'mid', 'adc', 'support'];
  const rosterAvg = teamRosterAvgOvr(currentRound.team, currentRound.roster);

  return (
    <div className="flex flex-col min-h-[100dvh] max-w-lg mx-auto">
      <header className="sticky top-0 z-20 px-5 pt-5 pb-3 bg-[#060608]/85 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={onBack}
            className="text-white/40 text-sm hover:text-white/70 transition-colors px-1 -ml-1"
          >
            ← Exit
          </button>
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/35 font-medium">
            Pick {picks.length + 1} / 5
          </span>
        </div>

        <TournamentProgress currentPhase={currentRound.phase} completedCount={picks.length} />
        <RosterSlots picks={picks} openRoles={openRoles} />
      </header>

      <div className="flex-1 overflow-y-auto">
        {draftSubphase === 'spin' && (
          <TeamSlotMachine
            key={spinGeneration}
            phase={currentRound.phase}
            team={currentRound.team}
            spin={currentRound.spin}
            spinKey={spinGeneration}
            onComplete={onSpinComplete}
          />
        )}

        {draftSubphase === 'pick' && (
          <motion.div
            className="px-5 py-4 pb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <TeamBanner team={currentRound.team} rosterAvgOvr={rosterAvg} />

            <div className="mb-4 rounded-xl glass-panel px-4 py-3">
              <p className="text-xs text-white/50 leading-relaxed">
                Tap a pro to draft.{' '}
                <span className="text-white/70">OVR</span> is their rating that year — tap{' '}
                <span className="text-white/70">View stats</span> for the breakdown. Open:{' '}
                <span className="text-gold font-medium">
                  {openRoles.map((r) => ROLE_LABELS[r]).join(', ')}
                </span>
              </p>
            </div>

            {respinsLeft > 0 && (
              <button
                type="button"
                onClick={onRespinTeam}
                className="w-full mb-5 flex items-center justify-center gap-2.5 text-sm font-semibold text-gold border border-gold/30 bg-gradient-to-r from-gold/12 to-transparent hover:from-gold/20 rounded-2xl px-4 py-3.5 transition-all active:scale-[0.98]"
              >
                <span className="text-lg leading-none">↻</span>
                Respin team
                <span className="text-[10px] font-normal text-gold/60 uppercase tracking-wider ml-1">
                  1 left
                </span>
              </button>
            )}

            <div className="space-y-3">
              {roleOrder.map((teamRole, i) => {
                const playerId = currentRound.team.roster[teamRole];
                const player = currentRound.roster.find((p) => p.id === playerId);
                if (!player) return null;

                const roleTaken = !openRoles.includes(teamRole);
                const blocked =
                  roleTaken ||
                  (orgLock &&
                    orgConstraintViolated(
                      picks.map((p) => p.player),
                      player
                    ));

                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <TeamRosterCard
                      player={player}
                      team={currentRound.team}
                      teamRole={teamRole}
                      onSelect={() => onSelectPlayer(player, teamRole)}
                      disabled={blocked}
                      roleTaken={roleTaken}
                    />
                    {roleTaken && (
                      <p className="text-[10px] text-white/25 mt-1.5 pl-1">
                        {ROLE_LABELS[teamRole]} slot filled
                      </p>
                    )}
                    {!roleTaken && blocked && (
                      <p className="text-[10px] text-red-400/75 mt-1.5 pl-1">
                        Org already used today
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
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
      <p className="text-[10px] uppercase tracking-[0.2em] text-gold/70 mb-2 font-medium">
        {DRAFT_PHASE_LABELS[currentPhase]}
      </p>
      <div className="flex gap-1.5">
        {DRAFT_PHASE_ORDER.map((phase, i) => (
          <div
            key={phase}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < completedCount
                ? 'bg-gold shadow-sm shadow-gold/30'
                : phase === currentPhase
                  ? 'bg-gold/45'
                  : 'bg-white/8'
            }`}
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
    <div className="flex gap-1.5">
      {slots.map((role) => {
        const pick = picks.find((p) => p.role === role);
        const open = openRoles.includes(role);
        const ovr = pick ? cardOverall(pick.player, pick.team) : null;

        return (
          <div
            key={role}
            className={`flex-1 rounded-xl py-2 px-1 text-center border transition-colors ${
              pick
                ? 'border-gold/25 bg-gold/8'
                : open
                  ? 'border-white/12 bg-white/[0.03] ring-1 ring-white/5'
                  : 'border-white/5 opacity-40'
            }`}
          >
            <p className="text-[7px] uppercase tracking-wider text-white/30 font-medium">
              {ROLE_LABELS[role].slice(0, 3)}
            </p>
            <p className="text-[10px] text-white/85 truncate font-medium mt-0.5 px-0.5">
              {pick ? pick.player.name.split(' ').pop() : '—'}
            </p>
            {ovr != null && (
              <p
                className="text-[9px] font-display tabular-nums mt-0.5"
                style={{ color: ovrAccentColor(ovr) }}
              >
                {ovr}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
