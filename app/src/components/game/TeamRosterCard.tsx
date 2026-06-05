import { motion } from 'framer-motion';
import type { HistoricalTeam, Player, Role } from '@/core/types';
import { ROLE_LABELS } from '@/core/types';
import {
  cardKda,
  cardOverall,
  formatKda,
  golStatSource,
  hasGolCardStats,
} from '@/engine/player-power';
import { cn } from '@/lib/utils';

interface TeamRosterCardProps {
  player: Player;
  team: HistoricalTeam;
  teamRole: Role;
  onSelect: () => void;
  disabled?: boolean;
  roleTaken?: boolean;
}

export function TeamRosterCard({
  player,
  team,
  teamRole,
  onSelect,
  disabled,
  roleTaken,
}: TeamRosterCardProps) {
  const kda = cardKda(player, team);
  const overall = cardOverall(player, team);
  const hasGol = hasGolCardStats(player, team);
  const source = golStatSource(player, team);
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
        'group relative w-full text-left rounded-2xl p-0 transition-all overflow-hidden',
        'border border-white/[0.08]',
        'active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none',
        !disabled && 'hover:border-gold/40 hover:shadow-lg hover:shadow-gold/5',
        roleTaken && 'opacity-35'
      )}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      style={{
        background: `linear-gradient(135deg, ${player.accent}14 0%, rgba(255,255,255,0.02) 55%, rgba(6,6,8,0.9) 100%)`,
      }}
    >
      <div
        className="absolute inset-y-0 left-0 w-1 rounded-l-2xl opacity-80"
        style={{ backgroundColor: player.accent }}
      />

      <div className="flex items-center gap-3 p-3.5 pl-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 shadow-inner"
          style={{
            background: `linear-gradient(145deg, ${player.accent}40 0%, ${player.accent}10 100%)`,
            border: `1px solid ${player.accent}50`,
            color: player.accent,
            boxShadow: `0 0 24px ${player.accent}18`,
          }}
        >
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{
                color: player.accent,
                backgroundColor: `${player.accent}18`,
                border: `1px solid ${player.accent}30`,
              }}
            >
              {ROLE_LABELS[teamRole]}
            </span>
            {hasGol && (
              <span className="text-[8px] uppercase tracking-wider text-emerald-400/80">
                Gol.gg
              </span>
            )}
          </div>
          <p className="font-display text-lg text-white truncate leading-tight tracking-wide">
            {player.name}
          </p>
          <p className="text-[10px] text-white/35 mt-0.5">
            {team.year} {team.name}
            {source === 'team-roster' ? ' · roster stats' : hasGol ? ' · season' : ''}
          </p>
        </div>

        <div className="text-right shrink-0 pl-2">
          <p className="text-[9px] uppercase tracking-[0.2em] text-white/35 mb-0.5">
            OVR
          </p>
          <span className="font-display text-3xl text-gold tabular-nums leading-none">
            {overall}
          </span>
          {kda != null && (
            <p className="text-[10px] text-white/35 tabular-nums mt-1">
              {formatKda(kda)} KDA
            </p>
          )}
        </div>
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
      className="rounded-2xl p-5 mb-5 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${team.accent}22 0%, ${team.accent}08 40%, rgba(255,255,255,0.02) 100%)`,
        border: `1px solid ${team.accent}40`,
        boxShadow: `0 8px 32px ${team.accent}12`,
      }}
    >
      <div
        className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ backgroundColor: team.accent }}
      />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/45">
              {team.region} · {team.year}
            </p>
            <span
              className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-medium ${
                team.tier === 'weak'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/25'
                  : team.tier === 'legend'
                    ? 'bg-gold/20 text-gold border border-gold/30'
                    : 'bg-white/10 text-white/55 border border-white/10'
              }`}
            >
              {TIER_BADGE[team.tier]}
            </span>
            <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300/90 border border-emerald-500/25">
              Gol.gg OVR
            </span>
          </div>
          <h3 className="font-display text-3xl text-white tracking-wide leading-none">
            {team.name}
          </h3>
          <p className="text-sm mt-2 font-medium" style={{ color: team.accent }}>
            {team.tagline}
          </p>
        </div>
        <span
          className="text-4xl font-display tabular-nums shrink-0 opacity-95 drop-shadow-sm"
          style={{ color: team.accent }}
        >
          {team.year}
        </span>
      </div>
    </motion.div>
  );
}
