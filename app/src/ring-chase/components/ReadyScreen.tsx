import { motion } from 'framer-motion';
import type { DraftPick } from '../core/types';
import { SLOT_LABELS } from '../core/types';
import { Button } from '@/components/ui/button';
import { RingPath } from './RingPath';
import { evaluateChemistry } from '../engine/chemistry';
import { cardCredentials, cardOverall } from '../engine/card-context';

interface ReadyScreenProps {
  picks: DraftPick[];
  onAttempt: () => void;
  onEdit: () => void;
}

export function ReadyScreen({ picks, onAttempt, onEdit }: ReadyScreenProps) {
  const avgOvr =
    picks.reduce((s, p) => s + cardOverall(p.player, p.team), 0) / picks.length;
  const chemistry = evaluateChemistry(picks);

  return (
    <div className="flex flex-col min-h-[100dvh] px-5 py-10 max-w-lg mx-auto justify-between">
      <div>
        <motion.div className="text-center" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[10px] uppercase tracking-[0.35em] text-ring-gold/70">Roster locked</p>
          <h2 className="font-display text-4xl text-white mt-2">RUN THE TABLE</h2>
          <p className="text-white/40 text-xs mt-2">4 majors. 1 Champs. No losses.</p>
        </motion.div>

        <motion.div
          className="mt-5 rounded-2xl glass-panel p-5 border-ring-gold/10"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08 }}
        >
          <div className="mb-4 text-center">
            <p className="text-[10px] uppercase tracking-wider text-white/35">Roster rating</p>
            <p className="font-display text-4xl text-ring-gold tabular-nums mt-1">{avgOvr.toFixed(1)}</p>
          </div>
          <div className="mb-3">
            <RingPath variant="full" />
          </div>
          {chemistry.modifiers.length > 0 && (
            <p className="text-[10px] text-white/35 text-center">
              {chemistry.modifiers.slice(0, 2).join(' · ')}
            </p>
          )}
        </motion.div>

        <motion.div className="mt-5 space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.16 }}>
          {picks.map(({ player, team, role }, i) => {
            const creds = cardCredentials(team);
            const ovr = cardOverall(player, team);
            return (
            <motion.div
              key={`${team.id}-${player.id}`}
              className="flex items-center gap-3.5 p-3 rounded-2xl glass-panel"
              style={{ background: `linear-gradient(90deg, ${team.accent}0a 0%, transparent 70%)` }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.14 + i * 0.04 }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: `${team.accent}20`, color: team.accent }}
              >
                {player.gamertag.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-white/35 uppercase tracking-wider">{SLOT_LABELS[role]}</p>
                <p className="font-display text-base text-white truncate">{player.gamertag}</p>
                <p className="text-[10px] text-white/30 truncate">{creds.headline}</p>
              </div>
              <span className="font-display text-xl text-ring-gold tabular-nums">{ovr}</span>
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
        <button
          type="button"
          onClick={onEdit}
          className="w-full text-sm text-white/35 hover:text-white/55 py-2"
        >
          Redraft last pick
        </button>
      </motion.div>
    </div>
  );
}
