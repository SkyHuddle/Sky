import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

interface DailyLeaderboardProps {
  percentile: number;
  score: number;
}

export function DailyLeaderboard({ percentile, score }: DailyLeaderboardProps) {
  const topPercent = Math.max(1, Math.round(100 - percentile));
  const tier =
    topPercent <= 1 ? 'Top 1%' : topPercent <= 5 ? 'Top 5%' : topPercent <= 10 ? 'Top 10%' : 'Global';

  return (
    <motion.div
      className="rounded-2xl border border-gold/20 bg-gold/5 p-4"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-gold" />
        <span className="text-[10px] uppercase tracking-widest text-gold/80">
          Daily Leaderboard
        </span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="font-display text-3xl text-gold">{tier}</p>
          <p className="text-white/45 text-xs mt-1">vs today&apos;s global attempts</p>
        </div>
        <div className="text-right">
          <p className="text-white/40 text-[10px] uppercase">Your score</p>
          <p className="font-display text-2xl text-white tabular-nums">{score.toFixed(1)}</p>
        </div>
      </div>
      <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold"
          initial={{ width: 0 }}
          animate={{ width: `${percentile}%` }}
          transition={{ delay: 0.3, duration: 0.8 }}
        />
      </div>
    </motion.div>
  );
}
