import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type {
  CodPlayer,
  DailyConstraint,
  DraftPick,
  DraftRound,
  DraftSubphase,
  RosterSlot,
} from '../core/types';
import { DRAFT_ROUND_LABELS, SLOT_LABELS } from '../core/types';
import { SLOT_ORDER } from '../core/constants';
import { PlayerCard } from './PlayerCard';
import { TeamBanner } from './TeamBanner';
import { TeamSlotMachine } from './TeamSlotMachine';
import { playerPassesFilter } from '../features/daily';
import { cardOverall, teamRosterAvgOvr } from '../engine/card-context';

interface DraftScreenProps {
  currentRound: DraftRound;
  draftSubphase: DraftSubphase;
  picks: DraftPick[];
  openRoles: RosterSlot[];
  spinGeneration: number;
  respinsLeft: number;
  dailyConstraint: DailyConstraint;
  isDaily: boolean;
  onSpinComplete: () => void;
  onRespinTeam: () => void;
  onSelectPlayer: (player: CodPlayer, naturalRole: RosterSlot) => void;
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
  const pickedIds = new Set(picks.map((p) => p.player.id));
  const { team } = currentRound;

  const rosterEntries = useMemo(() => {
    return SLOT_ORDER.map((teamRole) => {
      const playerId = currentRound.team.roster[teamRole];
      const player = currentRound.roster.find((p) => p.id === playerId);
      if (!player) return null;

      const taken = pickedIds.has(player.id);
      const roleTaken = !openRoles.includes(teamRole);
      const dailyBlocked =
        isDaily && !playerPassesFilter(player, picks, dailyConstraint);
      const blocked = taken || roleTaken || dailyBlocked;

      return { player, teamRole, roleTaken, dailyBlocked, blocked };
    })
      .filter((entry): entry is NonNullable<typeof entry> => entry != null)
      .sort((a, b) => {
        if (a.blocked !== b.blocked) return a.blocked ? 1 : -1;
        return cardOverall(b.player, team) - cardOverall(a.player, team);
      });
  }, [currentRound, openRoles, pickedIds, isDaily, picks, dailyConstraint, team]);

  const pickableCount = rosterEntries.filter((e) => !e.blocked).length;

  return (
    <div className="flex flex-col min-h-[100dvh] max-w-lg mx-auto">
      <header className="sticky top-0 z-20 px-5 pt-5 pb-3 bg-[#060608]/90 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={onBack}
            className="text-white/40 text-sm hover:text-white/70 transition-colors py-2"
          >
            ← Exit
          </button>
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/35">
            {DRAFT_ROUND_LABELS[picks.length] ?? `Pick ${picks.length + 1}`} · {SLOT_LABELS[openRoles[0] ?? 'mainAR']}
          </span>
        </div>
        <RosterSlots picks={picks} openRoles={openRoles} />
      </header>

      <div className="flex-1 overflow-y-auto">
        {draftSubphase === 'spin' && (
          <TeamSlotMachine
            key={spinGeneration}
            team={currentRound.team}
            spin={currentRound.spin}
            spinKey={spinGeneration}
            roundIndex={currentRound.roundIndex}
            draftSlot={openRoles[0] ?? 'mainAR'}
            onComplete={onSpinComplete}
          />
        )}

        {draftSubphase === 'pick' && (
          <motion.div
            className="px-5 py-4 pb-12"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <TeamBanner team={team} rosterAvgOvr={teamRosterAvgOvr(team)} />

            {isDaily && dailyConstraint.id !== 'standard' && (
              <p className="text-[10px] text-ring-gold/60 mb-4 -mt-2 px-1">{dailyConstraint.title}</p>
            )}

            <div className="mb-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
              <p className="text-xs text-white/55 leading-relaxed">
                {pickableCount === 1 ? (
                  <>
                    Draft your{' '}
                    <span className="text-ring-gold font-medium">
                      {SLOT_LABELS[openRoles[0]!]}
                    </span>
                    .
                  </>
                ) : pickableCount > 1 ? (
                  <>Pick the {SLOT_LABELS[openRoles[0]!]} for this roster.</>
                ) : (
                  <>No eligible players for today&apos;s rule on this team.</>
                )}
              </p>
            </div>

            {pickableCount === 0 && (
              <p className="text-sm text-red-400/80 mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                No eligible players for today&apos;s rule on this team. Respin or try Daily tomorrow.
              </p>
            )}

            <div className="space-y-2.5">
              {rosterEntries.map(({ player, teamRole, roleTaken, dailyBlocked, blocked }) => (
                <div key={player.id}>
                  <PlayerCard
                    player={player}
                    team={team}
                    teamSlot={teamRole}
                    disabled={blocked}
                    onSelect={() => onSelectPlayer(player, teamRole)}
                  />
                  {roleTaken && (
                    <p className="text-[10px] text-white/25 mt-1.5 pl-1">
                      {SLOT_LABELS[teamRole]} slot filled
                    </p>
                  )}
                  {!roleTaken && dailyBlocked && (
                    <p className="text-[10px] text-red-400/75 mt-1.5 pl-1">
                      Blocked by today&apos;s rule
                    </p>
                  )}
                </div>
              ))}
            </div>

            {respinsLeft > 0 && (
              <button
                type="button"
                onClick={onRespinTeam}
                className="w-full mt-6 py-3.5 rounded-2xl border border-white/10 text-sm text-white/50 hover:text-white/70 hover:border-ring-gold/30 transition-colors"
              >
                Respin team ({respinsLeft} left)
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function RosterSlots({
  picks,
  openRoles,
}: {
  picks: DraftPick[];
  openRoles: RosterSlot[];
}) {
  const teamOvr =
    picks.length > 0
      ? Math.round(
          picks.reduce((sum, pick) => sum + cardOverall(pick.player, pick.team), 0) / picks.length
        )
      : null;

  return (
    <div>
      <div className="flex gap-1.5">
        {SLOT_ORDER.map((slot) => {
          const pick = picks.find((p) => p.role === slot);
          const open = openRoles.includes(slot);
          const ovr = pick ? cardOverall(pick.player, pick.team) : null;

          return (
            <div
              key={slot}
              className={`flex-1 rounded-xl py-2 px-1 text-center border transition-all ${
                pick
                  ? 'border-ring-gold/25 bg-ring-gold/8'
                  : open
                    ? 'border-ring-gold/15 bg-ring-gold/[0.04] ring-1 ring-ring-gold/10'
                    : 'border-white/5 opacity-40'
              }`}
            >
              <p className="text-[7px] uppercase tracking-wider text-white/30 font-medium">
                {SLOT_LABELS[slot].slice(0, 3)}
              </p>
              <p className="text-[10px] text-white/85 truncate font-medium mt-0.5 px-0.5">
                {pick ? pick.player.gamertag.slice(0, 6) : open ? '?' : '—'}
              </p>
              {ovr != null && (
                <p className="text-[9px] font-display tabular-nums mt-0.5 text-ring-gold/80">
                  {ovr}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {teamOvr != null && (
        <p className="text-[9px] text-center text-white/30 mt-2 uppercase tracking-wider">
          Draft avg <span className="text-ring-gold/80 font-display tabular-nums">{teamOvr}</span> OVR
        </p>
      )}
    </div>
  );
}
