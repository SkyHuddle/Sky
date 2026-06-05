import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Trophy } from 'lucide-react';
import type { CodPlayer, HistoricalCodTeam, RosterSlot } from '../core/types';
import { SLOT_LABELS } from '../core/types';
import {
  cardCredentials,
  cardOverall,
  cardStatBreakdown,
  cardStatConfidence,
} from '../engine/card-context';
import { getPlayerHeadshot } from '../data/team-year-ratings';
import { CardStatBreakdown } from './CardStatBreakdown';
import { cn } from '@/lib/utils';

interface PlayerCardProps {
  player: CodPlayer;
  team: HistoricalCodTeam;
  teamSlot: RosterSlot;
  selected?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

function ovrAccent(overall: number): string {
  if (overall >= 94) return '#e8c547';
  if (overall >= 90) return '#c9a227';
  if (overall >= 86) return '#a8b4c4';
  return '#8b929e';
}

export function PlayerCard({
  player,
  team,
  teamSlot,
  selected,
  disabled,
  onSelect,
}: PlayerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const overall = cardOverall(player, team);
  const creds = cardCredentials(team);
  const stats = cardStatBreakdown(player, team);
  const confidence = cardStatConfidence(player, team);
  const headshot = getPlayerHeadshot(player, team);
  const accent = player.accent || team.accent;
  const ovrColor = ovrAccent(overall);

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((v) => !v);
  };

  return (
    <motion.div
      layout
      className={cn(
        'relative w-full rounded-2xl overflow-hidden border transition-all duration-200',
        selected
          ? 'border-ring-gold/50 ring-1 ring-ring-gold/25 shadow-lg shadow-ring-gold/15'
          : disabled
            ? 'border-white/[0.04] opacity-40'
            : 'border-white/[0.08] hover:border-white/15'
      )}
      style={{
        background: selected
          ? `linear-gradient(135deg, ${team.accent}20 0%, rgba(201,162,39,0.08) 40%, rgba(6,6,8,0.96) 100%)`
          : `linear-gradient(135deg, ${team.accent}14 0%, rgba(255,255,255,0.02) 50%, rgba(6,6,8,0.96) 100%)`,
      }}
    >
      <div
        className="absolute inset-y-0 left-0 w-1 rounded-l-2xl"
        style={{ backgroundColor: team.accent }}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) onSelect();
        }}
        style={{ touchAction: 'manipulation' }}
        className="w-full text-left p-4 pl-4 active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden"
            style={{
              background: headshot
                ? `linear-gradient(145deg, ${accent}25 0%, rgba(0,0,0,0.4) 100%)`
                : `linear-gradient(145deg, ${accent}35 0%, ${accent}08 100%)`,
              border: `1px solid ${accent}40`,
              color: accent,
            }}
          >
            {headshot ? (
              <img
                src={headshot}
                alt=""
                className="w-full h-full object-cover object-top"
                loading="lazy"
              />
            ) : (
              player.gamertag.slice(0, 2).toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-ring-gold/70 font-medium">
              {SLOT_LABELS[teamSlot]}
            </p>
            <p className="font-display text-lg text-white truncate leading-tight">{player.gamertag}</p>
            <p className="text-[10px] text-white/40 mt-0.5 truncate">{creds.headline}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {creds.ringsThisYear > 0 && (
                <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-ring-gold/15 text-ring-gold/90">
                  <Trophy className="w-3 h-3" />
                  Ring
                </span>
              )}
              {creds.majorsThisYear > 0 && creds.ringsThisYear === 0 && (
                <span className="inline-block text-[9px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/55">
                  {creds.majorsThisYear} Major{creds.majorsThisYear > 1 ? 's' : ''}
                </span>
              )}
              {stats && stats.source === 'bp-stats' && (
                <span className="text-[9px] text-white/35 tabular-nums">
                  {stats.kd.toFixed(2)} K/D
                </span>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 mb-0.5">OVR</p>
            <span
              className="font-display text-2xl tabular-nums leading-none"
              style={{ color: ovrColor }}
            >
              {confidence === 'estimated' ? '~' : ''}
              {overall}
            </span>
            <p className="text-[9px] text-white/25 mt-0.5">{team.season}</p>
          </div>
        </div>
      </button>

      {stats && !disabled && (
        <div className="px-4 pb-3 -mt-1">
          <button
            type="button"
            onClick={handleExpand}
            className="flex items-center gap-1 text-[10px] text-white/35 hover:text-white/55 transition-colors py-1"
          >
            <ChevronDown
              className={cn('w-3 h-3 transition-transform', expanded && 'rotate-180')}
            />
            {expanded ? 'Hide scout report' : 'Scout report'}
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
                <CardStatBreakdown stats={stats} team={team} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
