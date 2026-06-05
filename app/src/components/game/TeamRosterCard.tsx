import { motion } from 'framer-motion';
import type { HistoricalTeam, Player, Role } from '@/core/types';
import { ROLE_LABELS } from '@/core/types';
import { cn } from '@/lib/utils';

interface TeamRosterCardProps {
  player: Player;
  teamRole: Role;
  draftRole: Role;
  onSelect: () => void;
  disabled?: boolean;
}

export function TeamRosterCard({
  player,
  teamRole,
  draftRole,
  onSelect,
  disabled,
}: TeamRosterCardProps) {
  const isNatural = teamRole === draftRole;
  const initials = player.name.slice(0, 2).toUpperCase();

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'relative w-full text-left rounded-xl p-3 transition-all',
        'border bg-white/[0.03]',
        isNatural ? 'border-gold/40 bg-gold/[0.06]' : 'border-white/[0.08]',
        'active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none',
        !disabled && 'hover:border-gold/35 hover:bg-white/[0.06]'
      )}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      {isNatural && (
        <span className="absolute -top-2 right-3 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold text-black font-semibold">
          {ROLE_LABELS[draftRole]}
        </span>
      )}

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
            {ROLE_LABELS[teamRole]}
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
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: team.accent }}
      />
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
              {team.region} · {team.year}
            </p>
            <h3 className="font-display text-2xl text-white tracking-wide mt-1">
              {team.name}
            </h3>
            <p className="text-sm mt-1" style={{ color: `${team.accent}` }}>
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
      </div>
    </motion.div>
  );
}
