import { motion } from 'framer-motion';
import type { DraftPick } from '@/core/types';
import { ROLE_LABELS } from '@/core/types';
import { Button } from '@/components/ui/button';
import { SimulationGuide } from './SimulationGuide';
import { GoldenRoadPath } from './GoldenRoadPath';
import { cardKda, cardOverall, formatKda } from '@/engine/player-power';
import { estimateGoldenRoadOdds, rosterStagePreview } from '@/engine/simulation';
import { ovrAccentColor, ovrMeterPercent } from '@/engine/ovr-display';

interface ReadyScreenProps {
  picks: DraftPick[];
  onAttempt: () => void;
  onEdit: () => void;
}

export function ReadyScreen({ picks, onAttempt, onEdit }: ReadyScreenProps) {
  const avgOvr =
    picks.reduce((s, p) => s + cardOverall(p.player, p.team), 0) / picks.length;
  const odds = estimateGoldenRoadOdds(picks);
  const oddsPct = Math.round(odds * 100);
  const meter = ovrMeterPercent(avgOvr);
  const stages = rosterStagePreview(picks);

  return (
    <div className="flex flex-col min-h-[100dvh] px-5 py-10 max-w-lg mx-auto justify-between">
      <div>
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-[10px] uppercase tracking-[0.35em] text-gold/70">
            Roster Complete
          </p>
          <h2 className="font-display text-4xl text-white mt-2 tracking-wide">
            YOUR TEAM
          </h2>
        </motion.div>

        <motion.div
          className="mt-5 rounded-2xl glass-panel p-5 border-gold/10"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08 }}
        >
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/35">
                Team power
              </p>
              <p
                className="font-display text-4xl tabular-nums leading-none mt-1"
                style={{ color: ovrAccentColor(avgOvr) }}
              >
                {avgOvr.toFixed(0)}
                <span className="text-base text-white/30 ml-1.5">avg OVR</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-white/35">
                Win chance
              </p>
              <p className="font-display text-2xl text-gold tabular-nums mt-1">
                ~{oddsPct}%
              </p>
            </div>
          </div>
          <div className="h-2 rounded-full bg-white/8 overflow-hidden mb-4">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${meter}%` }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: `linear-gradient(90deg, ${ovrAccentColor(avgOvr)}, #c9a227)`,
              }}
            />
          </div>
          <GoldenRoadPath variant="full" className="mb-1" />
        </motion.div>

        <motion.div
          className="mt-4 rounded-2xl glass-panel p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12 }}
        >
          <p className="text-[10px] uppercase tracking-widest text-white/35 mb-3">
            Stage check preview
          </p>
          <div className="grid grid-cols-4 gap-2">
            {stages.map(({ label, power, needed, edge }) => (
              <div
                key={label}
                className={`rounded-xl p-2 text-center border ${
                  edge >= 2
                    ? 'border-emerald-500/25 bg-emerald-500/8'
                    : edge >= 0
                      ? 'border-gold/20 bg-gold/5'
                      : 'border-red-500/20 bg-red-500/5'
                }`}
              >
                <p className="text-[8px] uppercase tracking-wider text-white/35">{label}</p>
                <p
                  className="font-display text-lg tabular-nums mt-0.5"
                  style={{ color: ovrAccentColor(power) }}
                >
                  {power}
                </p>
                <p className="text-[8px] text-white/25 mt-0.5">
                  need ~{needed}
                </p>
                <p
                  className={`text-[9px] font-medium tabular-nums mt-0.5 ${
                    edge >= 0 ? 'text-emerald-400/80' : 'text-red-400/70'
                  }`}
                >
                  {edge >= 0 ? '+' : ''}
                  {edge}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="mt-5 space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.16 }}
        >
          {picks.map(({ role, player, team }, i) => (
            <motion.div
              key={role}
              className="flex items-center gap-3.5 p-3 rounded-2xl glass-panel"
              style={{
                background: `linear-gradient(90deg, ${team.accent}0a 0%, transparent 70%)`,
              }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.14 + i * 0.04 }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  background: `${team.accent}20`,
                  color: team.accent,
                  border: `1px solid ${team.accent}30`,
                }}
              >
                {player.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-white/35 uppercase tracking-widest">
                  {ROLE_LABELS[role]}
                </p>
                <p className="font-display text-base text-white truncate">{player.name}</p>
                <p className="text-[10px] text-white/30 truncate">
                  {team.year} {team.name}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span
                  className="font-display text-xl tabular-nums"
                  style={{ color: ovrAccentColor(cardOverall(player, team)) }}
                >
                  {cardOverall(player, team)}
                </span>
                {cardKda(player, team) != null && (
                  <p className="text-[9px] text-white/30 tabular-nums">
                    {formatKda(cardKda(player, team)!)} KDA
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-6">
          <SimulationGuide />
        </div>
      </div>

      <motion.div
        className="space-y-3 pb-4 pt-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          onClick={onAttempt}
          className="w-full h-16 text-lg font-semibold rounded-2xl bg-gold text-black hover:bg-gold/90 shadow-xl shadow-gold/20 animate-pulse-gold border-0"
        >
          Attempt Golden Road
        </Button>
        <button
          type="button"
          onClick={onEdit}
          className="w-full text-sm text-white/35 hover:text-white/55 py-2 transition-colors"
        >
          Redraft last pick
        </button>
      </motion.div>
    </div>
  );
}
