import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { HistoricalCodTeam } from '../core/types';
import { cardCredentials } from '../engine/card-context';

const TIER_LABEL: Record<HistoricalCodTeam['tier'], string> = {
  legendary: 'Legendary',
  elite: 'Elite',
  strong: 'Strong',
  solid: 'Solid',
  underdog: 'Underdog',
};

interface TeamBannerProps {
  team: HistoricalCodTeam;
  rosterAvgOvr?: number;
}

export function TeamBanner({ team, rosterAvgOvr }: TeamBannerProps) {
  const creds = cardCredentials(team);

  return (
    <motion.div
      key={team.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 mb-5 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${team.accent}24 0%, ${team.accent}08 45%, rgba(255,255,255,0.02) 100%)`,
        border: `1px solid ${team.accent}35`,
        boxShadow: `0 12px 40px ${team.accent}12`,
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
              {team.region} · {team.gameTitle}
            </p>
            <span
              className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-medium ${
                team.tier === 'legendary'
                  ? 'bg-ring-gold/15 text-ring-gold border border-ring-gold/25'
                  : 'bg-white/8 text-white/55 border border-white/10'
              }`}
            >
              {TIER_LABEL[team.tier]}
            </span>
            {creds.ringsThisYear > 0 && (
              <span className="inline-flex items-center gap-1 text-[9px] uppercase px-2 py-0.5 rounded-full font-medium bg-ring-gold/10 text-ring-gold/90 border border-ring-gold/20">
                <Trophy className="w-3 h-3" />
                Ring
              </span>
            )}
          </div>
          <h3 className="font-display text-2xl sm:text-3xl text-white tracking-wide leading-none truncate">
            {team.teamName}
          </h3>
          <p className="text-sm mt-2 font-medium" style={{ color: team.accent }}>
            {team.eventContext}
          </p>
          <p className="text-[10px] text-white/35 mt-1">{creds.detail}</p>
          {rosterAvgOvr != null && rosterAvgOvr > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-black/25 border border-white/[0.06] px-2.5 py-1.5">
              <span className="text-[10px] uppercase tracking-wider text-white/35">Card avg</span>
              <span className="font-display text-xl tabular-nums leading-none text-ring-gold">
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
          {team.season}
        </span>
      </div>
    </motion.div>
  );
}
