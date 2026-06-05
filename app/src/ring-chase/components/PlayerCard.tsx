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
import { CardStatBreakdown } from './CardStatBreakdown';
import { PlayerHeadshot } from './PlayerHeadshot';
import { cn } from '@/lib/utils';

interface PlayerCardProps {
  player: CodPlayer;
  team: HistoricalCodTeam;
  teamSlot: RosterSlot;
  selected?: boolean;
  disabled?: boolean;
  compact?: boolean;
  onSelect: () => void;
}

function ovrAccent(overall: number): string {
  if (overall >= 94) return 'var(--kb-gold)';
  if (overall >= 90) return 'var(--kb-gold-deep)';
  if (overall >= 86) return 'var(--kb-fg-soft)';
  return 'var(--kb-mute)';
}

export function PlayerCard({
  player,
  team,
  teamSlot,
  selected,
  disabled,
  compact,
  onSelect,
}: PlayerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const overall = cardOverall(player, team);
  const creds = cardCredentials(team);
  const stats = cardStatBreakdown(player, team);
  const confidence = cardStatConfidence(player, team);
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
        'kb-card relative w-full rounded-[var(--kb-r-md)] overflow-hidden transition-all duration-200',
        selected
          ? 'border-kb-gold/50 ring-1 ring-kb-gold/25 shadow-lg'
          : disabled
            ? 'border-kb-hairline opacity-40'
            : 'border-kb-border hover:border-kb-border-strong'
      )}
      style={{
        background: selected
          ? `linear-gradient(135deg, ${team.accent}20 0%, rgba(232,184,66,0.08) 40%, var(--kb-bg-card) 100%)`
          : `linear-gradient(135deg, ${team.accent}14 0%, var(--kb-glass) 50%, var(--kb-bg-card) 100%)`,
        boxShadow: selected ? 'var(--kb-shadow-gold)' : undefined,
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
              background: `linear-gradient(145deg, ${accent}35 0%, ${accent}08 100%)`,
              border: `1px solid ${accent}40`,
              color: accent,
            }}
          >
            <PlayerHeadshot
              player={player}
              team={team}
              fallbackClassName="text-sm font-bold"
            />
          </div>

          <div className="flex-1 min-w-0">
            {!compact && (
              <p className="text-[10px] uppercase tracking-[0.2em] text-kb-gold/80 font-semibold">
                {SLOT_LABELS[teamSlot]}
              </p>
            )}
            <p className="font-display text-lg text-kb-fg truncate leading-tight">{player.gamertag}</p>
            <p className="text-[10px] text-kb-mute mt-0.5 truncate">
              {compact ? `${team.season} · ${team.teamName}` : creds.headline}
            </p>
            {!compact && (
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {creds.ringsThisYear > 0 && (
                  <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-ring-gold/15 text-ring-gold/90">
                    <Trophy className="w-3 h-3" />
                    Ring
                  </span>
                )}
                {creds.majorsThisYear > 0 && creds.ringsThisYear === 0 && (
                  <span className="inline-block text-[9px] px-2 py-0.5 rounded-full bg-kb-glass text-kb-soft">
                    {creds.majorsThisYear} Major{creds.majorsThisYear > 1 ? 's' : ''}
                  </span>
                )}
                {stats && (stats.source === 'bp-stats' || stats.source === 'curated-audit') && (
                  <span className="text-[9px] text-kb-mute tabular-nums kb-mono">
                    {stats.kd.toFixed(2)} K/D
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="text-right shrink-0">
            <p className="text-[9px] uppercase tracking-[0.2em] text-kb-mute mb-0.5">OVR</p>
            <span
              className="font-display text-2xl tabular-nums leading-none"
              style={{ color: ovrColor }}
            >
              {confidence === 'estimated' ? '~' : ''}
              {overall}
            </span>
            <p className="text-[9px] text-kb-faint mt-0.5 kb-mono">{team.season}</p>
          </div>
        </div>
      </button>

      {stats && !disabled && !compact && (
        <div className="px-4 pb-3 -mt-1">
          <button
            type="button"
            onClick={handleExpand}
            className="flex items-center gap-1 text-[10px] text-kb-mute hover:text-kb-soft transition-colors py-1"
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
