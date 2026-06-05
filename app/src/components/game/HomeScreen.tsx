import { motion } from 'framer-motion';
import { Trophy, Flame, Target, Calendar, Sparkles } from 'lucide-react';
import type { DailyConstraint, DailyRunResult, PlayerStats } from '@/core/types';
import { Button } from '@/components/ui/button';
import { GoldenRoadPath } from './GoldenRoadPath';
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
  const teamYearMeta = getTeamYearMeta();

  return (
    <div className="flex flex-col min-h-[100dvh] px-5 pb-10 pt-14 max-w-lg mx-auto">
      <motion.header
        className="text-center mb-8"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gold/25 bg-gold/8 mb-7 shadow-lg shadow-gold/5">
          <Trophy className="w-3.5 h-3.5 text-gold" />
          <span className="text-[10px] uppercase tracking-[0.22em] text-gold/90 font-medium">
            LoL Esports
          </span>
        </div>

        <h1 className="font-display text-[3.25rem] sm:text-6xl tracking-wide text-white leading-[0.95]">
          GOLDEN
          <br />
          <span className="text-gold glow-gold">ROAD</span>
        </h1>

        <p className="text-white/50 text-sm mt-5 max-w-[300px] mx-auto leading-relaxed">
          Draft five pros across five rounds. Clear all four stages to complete the Golden Road.
        </p>

        {teamYearMeta && (
          <div className="inline-flex items-center gap-1.5 mt-5 px-3 py-1.5 rounded-full glass-panel">
            <Sparkles className="w-3 h-3 text-gold/70" />
            <span className="text-[9px] uppercase tracking-wider text-white/45">
              {teamYearMeta.count} pro season cards · live stats
            </span>
          </div>
        )}
      </motion.header>

      <motion.div
        className="rounded-2xl glass-panel p-4 mb-6 border-gold/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <p className="text-[10px] uppercase tracking-widest text-white/35 mb-3 text-center">
          The path
        </p>
        <GoldenRoadPath variant="full" />
        <p className="text-[10px] text-white/30 text-center mt-3 leading-relaxed">
          Spring → MSI → Summer → Worlds
        </p>
      </motion.div>

      <motion.div
        className="space-y-3 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.45 }}
      >
        <Button
          onClick={onStartFree}
          className="w-full h-[3.75rem] text-base font-semibold rounded-2xl bg-gold text-black hover:bg-gold/90 shadow-xl shadow-gold/20 border-0"
        >
          Start Golden Road
        </Button>

        <button
          type="button"
          onClick={onStartDaily}
          className="w-full h-[3.75rem] rounded-2xl glass-panel hover:bg-white/[0.06] transition-all flex flex-col items-center justify-center gap-0.5 px-4 active:scale-[0.99]"
        >
          <span className="flex items-center gap-2 text-white font-medium text-sm">
            <Calendar className="w-4 h-4 text-gold" />
            Daily Challenge
          </span>
          <span className="text-[11px] text-white/40">{dailyConstraint.title}</span>
        </button>
      </motion.div>

      <motion.div
        className="rounded-2xl glass-panel p-4 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-[10px] uppercase tracking-widest text-gold/70 mb-1.5">
          Today&apos;s challenge
        </p>
        <p className="text-white font-medium">{dailyConstraint.title}</p>
        <p className="text-white/45 text-xs mt-1.5 leading-relaxed">
          {dailyConstraint.description}
        </p>
        {dailyPlayed && (
          <p className="text-gold/80 text-xs mt-3 font-medium">
            Played today · Score {dailyPlayed.score.toFixed(1)}
            {dailyPlayed.percentile != null &&
              ` · Top ${(100 - dailyPlayed.percentile).toFixed(0)}%`}
          </p>
        )}
      </motion.div>

      <HowItWorks />

      <StatsGrid stats={stats} />
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { n: '1', text: 'Spin a team & year — respin once if you want' },
    { n: '2', text: 'Pick the highest OVR for open roles' },
    { n: '3', text: 'Check stage preview, then run the road' },
  ];

  return (
    <motion.div
      className="mb-6 space-y-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.28 }}
    >
      <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2 px-1">
        How it works
      </p>
      {steps.map(({ n, text }) => (
        <div
          key={n}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-white/[0.02] border border-white/[0.04]"
        >
          <span className="w-6 h-6 rounded-lg bg-gold/15 text-gold text-xs font-display flex items-center justify-center shrink-0">
            {n}
          </span>
          <span className="text-xs text-white/50 leading-relaxed">{text}</span>
        </div>
      ))}
    </motion.div>
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
      className="grid grid-cols-3 gap-2.5 mt-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.35 }}
    >
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="rounded-xl glass-panel p-3 text-center">
          <Icon className="w-4 h-4 text-gold/55 mx-auto mb-2" />
          <p className="font-display text-xl text-white tabular-nums">{value}</p>
          <p className="text-[8px] uppercase tracking-wider text-white/30 mt-1 leading-tight">
            {label}
          </p>
        </div>
      ))}
    </motion.div>
  );
}
