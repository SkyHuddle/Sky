import { motion } from 'framer-motion';
import type { DraftPick } from '../core/types';
import { SLOT_LABELS } from '../core/types';
import { Button } from '@/components/ui/button';
import { RingPath } from './RingPath';
import { evaluateChemistry } from '../engine/chemistry';
import { cardCredentials, cardOverall } from '../engine/card-context';
import { getPlayerHeadshot } from '../data/team-year-ratings';

interface ReadyScreenProps {
  picks: DraftPick[];
  isDaily?: boolean;
  onAttempt: () => void;
  onEdit: () => void;
}

function ovrColor(ovr: number): string {
  if (ovr >= 94) return '#e8c547';
  if (ovr >= 90) return '#c9a227';
  return '#b8c0cc';
}

export function ReadyScreen({ picks, isDaily, onAttempt, onEdit }: ReadyScreenProps) {
  const avgOvr =
    picks.reduce((s, p) => s + cardOverall(p.player, p.team), 0) / picks.length;
  const chemistry = evaluateChemistry(picks);

  return (
    <div className="flex flex-col min-h-[100dvh] px-5 py-10 max-w-lg mx-auto justify-between">
      <div>
        <motion.div className="text-center" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[10px] uppercase tracking-[0.35em] text-ring-gold/70">Roster locked</p>
          <h2 className="font-display text-4xl text-white mt-2">RUN THE TABLE</h2>
          <p className="text-white/40 text-xs mt-2 max-w-[260px] mx-auto leading-relaxed">
            Win Major I–IV, then Champs. Your season record is on the line.
          </p>
        </motion.div>

        <motion.div
          className="mt-5 rounded-2xl glass-panel p-5 border border-ring-gold/15 shadow-lg shadow-black/20"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08 }}
        >
          <div className="mb-4 text-center">
            <p className="text-[10px] uppercase tracking-wider text-white/35">Card avg OVR</p>
            <p
              className="font-display text-4xl tabular-nums mt-1"
              style={{ color: ovrColor(avgOvr) }}
            >
              {avgOvr.toFixed(1)}
            </p>
          </div>
          <div className="mb-3">
            <RingPath variant="full" />
          </div>
          {chemistry.modifiers.length > 0 && (
            <p className="text-[10px] text-ring-gold/55 text-center font-medium">
              {chemistry.modifiers.slice(0, 2).join(' · ')}
            </p>
          )}
          {chemistry.issues.length > 0 && (
            <p className="text-[10px] text-amber-400/70 text-center mt-1">
              {chemistry.issues[0]}
            </p>
          )}
        </motion.div>

        <motion.div className="mt-5 space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.16 }}>
          {picks.map(({ player, team, role }, i) => {
            const creds = cardCredentials(team);
            const ovr = cardOverall(player, team);
            const headshot = getPlayerHeadshot(player, team);
            return (
              <motion.div
                key={`${team.id}-${player.id}`}
                className="flex items-center gap-3.5 p-3 rounded-2xl border border-white/[0.06] relative overflow-hidden"
                style={{
                  background: `linear-gradient(90deg, ${team.accent}12 0%, rgba(255,255,255,0.02) 70%)`,
                }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.14 + i * 0.04 }}
              >
                <div
                  className="absolute inset-y-0 left-0 w-0.5"
                  style={{ backgroundColor: team.accent }}
                />
                <div
                  className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center text-xs font-bold shrink-0 ml-1"
                  style={{
                    background: `${team.accent}22`,
                    color: team.accent,
                    border: `1px solid ${team.accent}35`,
                  }}
                >
                  {headshot ? (
                    <img src={headshot} alt="" className="w-full h-full object-cover object-top" />
                  ) : (
                    player.gamertag.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] text-white/35 uppercase tracking-wider">{SLOT_LABELS[role]}</p>
                  <p className="font-display text-base text-white truncate">{player.gamertag}</p>
                  <p className="text-[10px] text-white/35 truncate">{creds.headline}</p>
                </div>
                <span
                  className="font-display text-xl tabular-nums shrink-0"
                  style={{ color: ovrColor(ovr) }}
                >
                  {ovr}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <motion.div
        className="space-y-3 pb-4 pt-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          onClick={onAttempt}
          className="w-full h-16 text-lg font-semibold rounded-2xl bg-ring-gold text-black hover:bg-ring-gold/90 shadow-xl shadow-ring-gold/20 border-0 animate-pulse-ring"
        >
          Start the Run
        </Button>
        {!isDaily && (
          <button
            type="button"
            onClick={onEdit}
            className="w-full text-sm text-white/35 hover:text-white/55 py-2"
          >
            Redraft last pick
          </button>
        )}
        {isDaily && (
          <p className="text-center text-[10px] text-white/30 py-1">
            Daily locked — no redrafts or respins
          </p>
        )}
      </motion.div>
    </div>
  );
}
