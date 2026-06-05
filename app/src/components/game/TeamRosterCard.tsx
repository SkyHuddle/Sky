import { motion } from 'framer-motion';
import type { HistoricalTeam, Player, Role } from '@/core/types';
import { ROLE_LABELS } from '@/core/types';
import { cn } from '@/lib/utils';

interface TeamRosterCardProps {
  player: Player;
  teamRole: Role;
  onSelect: () => void;
  disabled?: boolean;
  roleTaken?: boolean;
}

export function TeamRosterCard({
  player,
  teamRole,
  onSelect,
  disabled,
  roleTaken,
}: TeamRosterCardProps) {
  const initials = player.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'relative w-full text-left rounded-xl p-3 transition-all',
        'border border-white/[0.08] bg-white/[0.03]',
        'active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none',
        !disabled && 'hover:border-gold/35 hover:bg-white/[0.06]',
        roleTaken && 'opacity-35'
      )}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
          style={{
            background: `linear-gradient(135deg, ${player.accent}35 0%, ${player.accent}12 100%)`,
            border: `1px solid ${player.accent}45`,
            color: player.accent,
          }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg text-white truncate leading-tight">
            {player.name}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-white/35 mt-0.5">
            {ROLE_LABELS[teamRole]} on team
          </p>
        </div>
        <span className="font-display text-xl text-gold tabular-nums shrink-0">
          {player.ratings.overall}
        </span>
      </div>
    </motion.button>
  );
}

interface TeamBannerProps {
  team: HistoricalTeam;
}

const TIER_BADGE: Record<string, string> = {
  legend: 'Legend',
  contender: 'Contender',
  average: 'Average',
  weak: 'Underdog',
};

export function TeamBanner({ team }: TeamBannerProps) {
  return (
    <motion.div
      key={team.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 mb-4 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${team.accent}18 0%, rgba(255,255,255,0.02) 100%)`,
        border: `1px solid ${team.accent}35`,
      }}
    >
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">
              {team.region} · {team.year}
            </p>
            <span
              className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${
                team.tier === 'weak'
                  ? 'bg-red-500/20 text-red-300'
                  : team.tier === 'legend'
                    ? 'bg-gold/20 text-gold'
                    : 'bg-white/10 text-white/50'
              }`}
            >
              {TIER_BADGE[team.tier]}
            </span>
          </div>
          <h3 className="font-display text-2xl text-white tracking-wide">
            {team.name}
          </h3>
          <p className="text-sm mt-1" style={{ color: team.accent }}>
            {team.tagline}
          </p>
        </div>
        <span
          className="text-3xl font-display tabular-nums shrink-0 opacity-90"
          style={{ color: team.accent }}
        >
          {team.year}
        </span>
      </div>
    </motion.div>
  );
}
