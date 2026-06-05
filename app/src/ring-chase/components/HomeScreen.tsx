import { motion } from 'framer-motion';
import { Trophy, Flame, Target, Calendar, Circle } from 'lucide-react';
import type { DailyConstraint, DailyRunResult, PlayerStats } from '../core/types';
import { Button } from '@/components/ui/button';
import { RingPath } from './RingPath';
import { getDailyChallengeNumber } from '../features/daily';

interface HomeScreenProps {
  stats: PlayerStats;
  dailyConstraint: DailyConstraint;
  dailyPlayed: DailyRunResult | null;
  onStartFree: () => void;
  onStartDaily: () => void;
}

const COMMUNITY_RESULTS = [
  'Scump + Simp + Shotzzy + Cellium lost Champs Final',
  'HyDra + FormaL + aBeZy + Scrap won Ring',
  'Clayster + Karma + Dashy + Pred — Perfect Season',
  'Simp + aBeZy + HyDra + Envoy — NO RING',
];

export function HomeScreen({
  stats,
  dailyConstraint,
  dailyPlayed,
  onStartFree,
  onStartDaily,
}: HomeScreenProps) {
  const dailyNum = getDailyChallengeNumber();

  return (
    <div className="flex flex-col min-h-[100dvh] px-5 pb-10 pt-14 max-w-lg mx-auto">
      <motion.header
        className="text-center mb-8"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-ring-gold/25 bg-ring-gold/8 mb-7">
          <Circle className="w-3.5 h-3.5 text-ring-gold fill-ring-gold/30" />
          <span className="text-[10px] uppercase tracking-[0.22em] text-ring-gold/90 font-medium">
            Call of Duty Esports
          </span>
        </div>

        <h1 className="font-display text-[3.25rem] sm:text-6xl tracking-wide text-white leading-[0.95]">
          RING
          <br />
          <span className="text-ring-gold glow-ring">CHASE</span>
        </h1>

        <p className="text-white/50 text-sm mt-5 max-w-[300px] mx-auto leading-relaxed">
          Draft history. Chase the ring. Can your roster win Champs?
        </p>
      </motion.header>

      <motion.div
        className="rounded-2xl glass-panel p-4 mb-6 border-ring-gold/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <p className="text-[10px] uppercase tracking-widest text-white/35 mb-3 text-center">
          The path
        </p>
        <RingPath variant="full" />
        <p className="text-[10px] text-white/30 text-center mt-3">
          Major I → II → III → IV → Champs
        </p>
      </motion.div>

      <motion.div
        className="space-y-3 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <Button
          onClick={onStartFree}
          className="w-full h-[3.75rem] text-base font-semibold rounded-2xl bg-ring-gold text-black hover:bg-ring-gold/90 shadow-xl shadow-ring-gold/20 border-0 animate-pulse-ring"
        >
          Start Ring Chase
        </Button>

        <button
          type="button"
          onClick={onStartDaily}
          className="w-full h-[3.75rem] rounded-2xl glass-panel hover:bg-white/[0.06] transition-all flex flex-col items-center justify-center gap-0.5"
        >
          <span className="flex items-center gap-2 text-white font-medium text-sm">
            <Calendar className="w-4 h-4 text-ring-gold" />
            Daily Ring Chase #{dailyNum}
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
        <p className="text-[10px] uppercase tracking-widest text-ring-gold/70 mb-1.5">
          Today&apos;s challenge
        </p>
        <p className="text-white font-medium">{dailyConstraint.title}</p>
        <p className="text-white/45 text-xs mt-1.5 leading-relaxed">{dailyConstraint.description}</p>
        {dailyPlayed && (
          <p className="text-ring-gold/80 text-xs mt-3 font-medium">
            Played today · Score {dailyPlayed.score.toFixed(1)}
            {dailyPlayed.percentile != null && ` · Top ${(100 - dailyPlayed.percentile).toFixed(0)}%`}
          </p>
        )}
      </motion.div>

      <motion.div
        className="mb-6 space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Community</p>
        {COMMUNITY_RESULTS.map((line) => (
          <p key={line} className="text-xs text-white/40 leading-relaxed px-1">
            {line}
          </p>
        ))}
      </motion.div>

      <StatsGrid stats={stats} />
    </div>
  );
}

function StatsGrid({ stats }: { stats: PlayerStats }) {
  const items = [
    { icon: Trophy, label: 'Rings Won', value: stats.ringsWon },
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
          <Icon className="w-4 h-4 text-ring-gold/55 mx-auto mb-2" />
          <p className="font-display text-xl text-white tabular-nums">{value}</p>
          <p className="text-[8px] uppercase tracking-wider text-white/30 mt-1">{label}</p>
        </div>
      ))}
    </motion.div>
  );
}
