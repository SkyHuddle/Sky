import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles } from 'lucide-react';
import type { HistoricalTeam, Player, Role } from '@/core/types';
import { ROLE_LABELS } from '@/core/types';
import {
  cardKda,
  cardOverall,
  cardStatBreakdown,
  cardStatConfidence,
  formatKda,
} from '@/engine/player-power';
import { getOvrTier, ovrAccentColor } from '@/engine/ovr-display';
import { StatBreakdown } from './StatBreakdown';
import { cn } from '@/lib/utils';

interface TeamRosterCardProps {
  player: Player;
  team: HistoricalTeam;
  teamRole: Role;
  onSelect: () => void;
  disabled?: boolean;
  roleTaken?: boolean;
  recommended?: boolean;
}

export function TeamRosterCard({
  player,
  team,
  teamRole,
  onSelect,
  disabled,
  roleTaken,
  recommended,
}: TeamRosterCardProps) {
  const [expanded, setExpanded] = useState(false);
  const kda = cardKda(player, team);
  const overall = cardOverall(player, team);
  const stats = cardStatBreakdown(player, team);
  const confidence = cardStatConfidence(player, team);
  const ovrColor = ovrAccentColor(overall);
  const tier = getOvrTier(overall);
  const initials = player.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((v) => !v);
  };

  return (
    <motion.div
      layout
      className={cn(
        'relative w-full rounded-2xl overflow-hidden border transition-all duration-200',
        recommended && !disabled
          ? 'border-gold/45 ring-1 ring-gold/20 shadow-lg shadow-gold/10'
          : 'border-white/[0.08]',
        !disabled && !recommended && 'hover:border-white/18',
        roleTaken && 'opacity-35',
        disabled && 'opacity-40 pointer-events-none'
      )}
      style={{
        background: recommended
          ? `linear-gradient(135deg, ${player.accent}18 0%, rgba(201,162,39,0.06) 40%, rgba(6,6,8,0.95) 100%)`
          : `linear-gradient(135deg, ${player.accent}12 0%, rgba(255,255,255,0.02) 50%, rgba(6,6,8,0.95) 100%)`,
      }}
    >
      {recommended && !disabled && (
        <div className="absolute top-0 right-0 z-10">
          <span className="inline-flex items-center gap-1 rounded-bl-xl rounded-tr-2xl bg-gold/90 text-black text-[9px] font-bold uppercase tracking-wider px-2.5 py-1">
            <Sparkles className="w-3 h-3" />
            Best pick
          </span>
        </div>
      )}

      <div
        className="absolute inset-y-0 left-0 w-1 rounded-l-2xl"
        style={{ backgroundColor: player.accent }}
      />

      <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        className="w-full text-left p-3.5 pl-4 pt-3.5 active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
            style={{
              background: `linear-gradient(145deg, ${player.accent}35 0%, ${player.accent}08 100%)`,
              border: `1px solid ${player.accent}40`,
              color: player.accent,
            }}
          >
            {initials}
          </div>

          <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span
                className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{
                  color: player.accent,
                  backgroundColor: `${player.accent}15`,
                  border: `1px solid ${player.accent}25`,
                }}
              >
                {ROLE_LABELS[teamRole]}
              </span>
              <span
                className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-full border"
                style={{
                  color: ovrColor,
                  borderColor: `${ovrColor}40`,
                  backgroundColor: `${ovrColor}12`,
                }}
              >
                {tier}
              </span>
            </div>
            <p className="font-display text-lg text-white truncate leading-tight tracking-wide">
              {player.name}
            </p>
            <p className="text-[10px] text-white/35 mt-0.5">
              {team.year} {team.name}
            </p>
          </div>

          <div className="text-right shrink-0 pl-1">
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 mb-0.5">
              OVR
            </p>
            <span
              className="font-display text-3xl tabular-nums leading-none"
              style={{ color: ovrColor }}
            >
              {confidence === 'estimated' ? '~' : ''}
              {overall}
            </span>
            {kda != null && (
              <p className="text-[10px] text-white/30 tabular-nums mt-1">
                {formatKda(kda)} KDA
              </p>
            )}
          </div>
        </div>
      </button>

      {stats && (
        <div className="px-4 pb-3 -mt-0.5">
          <button
            type="button"
            onClick={handleExpand}
            className="flex items-center gap-1 text-[10px] text-white/35 hover:text-white/55 transition-colors"
          >
            <ChevronDown
              className={cn('w-3 h-3 transition-transform', expanded && 'rotate-180')}
            />
            {expanded ? 'Hide stats' : 'View stats'}
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <StatBreakdown stats={stats} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

interface TeamBannerProps {
  team: HistoricalTeam;
  rosterAvgOvr?: number;
}

const TIER_BADGE: Record<string, string> = {
  legend: 'Legend',
  contender: 'Contender',
  average: 'Average',
  weak: 'Underdog',
};

export function TeamBanner({ team, rosterAvgOvr }: TeamBannerProps) {
  return (
    <motion.div
      key={team.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 mb-4 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${team.accent}22 0%, ${team.accent}06 45%, rgba(255,255,255,0.02) 100%)`,
        border: `1px solid ${team.accent}35`,
        boxShadow: `0 12px 40px ${team.accent}10`,
      }}
    >
      <div
        className="absolute -right-10 -top-10 w-36 h-36 rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{ backgroundColor: team.accent }}
      />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/45">
              {team.region} · {team.year}
            </p>
            <span
              className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-medium ${
                team.tier === 'weak'
                  ? 'bg-red-500/15 text-red-300/90 border border-red-500/20'
                  : team.tier === 'legend'
                    ? 'bg-gold/15 text-gold border border-gold/25'
                    : 'bg-white/8 text-white/55 border border-white/10'
              }`}
            >
              {TIER_BADGE[team.tier]}
            </span>
          </div>
          <h3 className="font-display text-3xl text-white tracking-wide leading-none truncate">
            {team.name}
          </h3>
          <p className="text-sm mt-2 font-medium" style={{ color: team.accent }}>
            {team.tagline}
          </p>
          {rosterAvgOvr != null && rosterAvgOvr > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-black/20 border border-white/[0.06] px-2.5 py-1.5">
              <span className="text-[10px] uppercase tracking-wider text-white/35">
                Roster avg
              </span>
              <span
                className="font-display text-xl tabular-nums leading-none"
                style={{ color: ovrAccentColor(rosterAvgOvr) }}
              >
                {Math.round(rosterAvgOvr)}
              </span>
              <span className="text-[10px] text-white/25">OVR</span>
            </div>
          )}
        </div>
        <span
          className="text-4xl font-display tabular-nums shrink-0 opacity-90"
          style={{ color: team.accent }}
        >
          {team.year}
        </span>
      </div>
    </motion.div>
  );
}
