import { motion } from 'framer-motion';
import { Trophy, Flame, Target, Calendar, Database } from 'lucide-react';
import type { DailyConstraint, DailyRunResult, PlayerStats } from '@/core/types';
import { Button } from '@/components/ui/button';
import { getGolDataMeta } from '@/data';
import { getTeamYearMeta } from '@/data/merge-team-year-ratings';

interface HomeScreenProps {
  stats: PlayerStats;
  dailyConstraint: DailyConstraint;
  dailyPlayed: DailyRunResult | null;
  onStartFree: () => void;
  onStartDaily: () => void;
}

export function HomeScreen({
  stats,
  dailyConstraint,
  dailyPlayed,
  onStartFree,
  onStartDaily,
}: HomeScreenProps) {
  const golMeta = getGolDataMeta();
  const teamYearMeta = getTeamYearMeta();

  return (
    <div className="flex flex-col min-h-[100dvh] px-5 pb-8 pt-12 max-w-lg mx-auto">
      <motion.header
        className="text-center mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/20 bg-gold/5 mb-6">
          <Trophy className="w-3.5 h-3.5 text-gold" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-gold/80">
            LoL Esports
          </span>
        </div>
        <h1 className="font-display text-5xl sm:text-6xl tracking-wide text-white leading-none">
          GOLDEN
          <br />
          <span className="text-gold">ROAD</span>
        </h1>
        <p className="text-white/50 text-sm mt-4 max-w-[320px] mx-auto leading-relaxed">
          Spin a team & year each round — Spring, MSI, Summer, Worlds. Pick one pro per round for their role. Fill all five slots. Chase the Golden Road.
        </p>
        {(teamYearMeta ?? golMeta) && (
          <div className="inline-flex items-center gap-1.5 mt-4 px-2.5 py-1 rounded-full border border-emerald-500/25 bg-emerald-500/10">
            <Database className="w-3 h-3 text-emerald-400/90" />
            <span className="text-[9px] uppercase tracking-wider text-emerald-300/80">
              {teamYearMeta
                ? `Gol.gg OVR · ${teamYearMeta.count} team-year cards`
                : `Gol.gg · ${golMeta!.count} players`}
            </span>
          </div>
        )}
      </motion.header>

      <motion.div
        className="space-y-3 mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.45 }}
      >
        <Button
          onClick={onStartFree}
          className="w-full h-14 text-base font-semibold rounded-2xl bg-gold text-black hover:bg-gold/90 shadow-lg shadow-gold/20"
        >
          Start Golden Road
        </Button>

        <button
          type="button"
          onClick={onStartDaily}
          className="w-full h-14 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-colors flex flex-col items-center justify-center gap-0.5 px-4"
        >
          <span className="flex items-center gap-2 text-white font-medium text-sm">
            <Calendar className="w-4 h-4 text-gold" />
            Daily Golden Road
          </span>
          <span className="text-[11px] text-white/40">{dailyConstraint.title}</span>
        </button>
      </motion.div>

      <motion.div
        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <p className="text-[10px] uppercase tracking-widest text-gold/60 mb-1">Today&apos;s challenge</p>
        <p className="text-white font-medium">{dailyConstraint.title}</p>
        <p className="text-white/45 text-xs mt-1">{dailyConstraint.description}</p>
        {dailyPlayed && (
          <p className="text-gold/70 text-xs mt-3">
            Played today · Score {dailyPlayed.score.toFixed(1)}
            {dailyPlayed.percentile != null && ` · Top ${(100 - dailyPlayed.percentile).toFixed(0)}%`}
          </p>
        )}
      </motion.div>

      <StatsGrid stats={stats} />
    </div>
  );
}

function StatsGrid({ stats }: { stats: PlayerStats }) {
  const items = [
    { icon: Trophy, label: 'Golden Roads', value: stats.goldenRoads },
    { icon: Flame, label: 'Win Streak', value: stats.winStreak },
    { icon: Target, label: 'Best Score', value: stats.bestRosterScore.toFixed(1) },
  ];

  return (
    <motion.div
      className="grid grid-cols-3 gap-3 mt-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.35 }}
    >
      {items.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center"
        >
          <Icon className="w-4 h-4 text-gold/60 mx-auto mb-2" />
          <p className="font-display text-xl text-white tabular-nums">{value}</p>
          <p className="text-[9px] uppercase tracking-wider text-white/35 mt-1">{label}</p>
        </div>
      ))}
    </motion.div>
  );
}
