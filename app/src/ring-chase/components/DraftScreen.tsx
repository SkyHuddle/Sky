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
import { SLOT_LABELS } from '../core/types';
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
      <header className="sticky top-0 z-20 px-5 pt-3 pb-3 kb-brand-bar">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={onBack}
            className="text-kb-mute text-sm hover:text-kb-soft transition-colors py-2"
          >
            ← Exit
          </button>
          <span className="text-[10px] uppercase tracking-[0.2em] text-kb-mute">
            {picks.length + 1} / 4
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

            {!isDaily && respinsLeft > 0 && (
              <button
                type="button"
                onClick={onRespinTeam}
                className="w-full mb-4 py-3 rounded-full border border-kb-gold/25 bg-kb-gold/[0.06] text-sm text-kb-soft hover:text-kb-fg hover:border-kb-gold/40 transition-colors font-medium"
              >
                Respin team ({respinsLeft} left)
              </button>
            )}

            {isDaily && dailyConstraint.id !== 'standard' && (
              <p className="text-[10px] text-kb-amber/80 mb-4 -mt-2 px-1 font-medium">{dailyConstraint.title}</p>
            )}

            {pickableCount === 0 && (
              <p className="text-sm text-kb-crimson/90 mb-4 rounded-[var(--kb-r-md)] border border-kb-crimson/20 bg-kb-crimson/10 px-4 py-3">
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
                    <p className="text-[10px] text-kb-faint mt-1.5 pl-1">
                      {SLOT_LABELS[teamRole]} slot filled
                    </p>
                  )}
                  {!roleTaken && dailyBlocked && (
                    <p className="text-[10px] text-kb-crimson/80 mt-1.5 pl-1">
                      Blocked by today&apos;s rule
                    </p>
                  )}
                </div>
              ))}
            </div>

            {isDaily && (
              <p className="text-center text-[10px] text-kb-faint mt-6">
                Daily mode — fixed teams, no respins
              </p>
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
                  ? 'border-kb-gold/25 bg-kb-gold/8'
                  : open
                    ? 'border-kb-gold/15 bg-kb-gold/[0.04] ring-1 ring-kb-gold/10'
                    : 'border-kb-hairline opacity-40'
              }`}
            >
              <p className="text-[7px] uppercase tracking-wider text-kb-mute font-semibold">
                {SLOT_LABELS[slot].slice(0, 3)}
              </p>
              <p className="text-[10px] text-kb-fg truncate font-medium mt-0.5 px-0.5">
                {pick ? pick.player.gamertag.slice(0, 6) : open ? '?' : '—'}
              </p>
              {ovr != null && (
                <p className="text-[9px] font-display tabular-nums mt-0.5 text-kb-gold/80">
                  {ovr}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {teamOvr != null && (
        <p className="text-[9px] text-center text-kb-mute mt-2 uppercase tracking-wider">
          Draft avg <span className="text-kb-gold/80 font-display tabular-nums">{teamOvr}</span> OVR
        </p>
      )}
    </div>
  );
}
