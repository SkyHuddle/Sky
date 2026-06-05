import { motion } from 'framer-motion';
import { Trophy, Medal } from 'lucide-react';
import type { DailyBoardEntry } from '../features/daily-board';

interface DailyLeaderboardProps {
  board: DailyBoardEntry[];
  yourEntryId?: string;
}

export function DailyLeaderboard({ board, yourEntryId }: DailyLeaderboardProps) {
  const sorted = [...board].sort((a, b) => b.rankScore - a.rankScore).slice(0, 8);
  const yourRank = yourEntryId
    ? sorted.findIndex((e) => e.id === yourEntryId) + 1 || board.findIndex((e) => e.id === yourEntryId) + 1
    : 0;

  return (
    <motion.div
      className="rounded-2xl border border-ring-gold/20 bg-ring-gold/[0.04] p-4"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Medal className="w-4 h-4 text-ring-gold" />
          <span className="text-[10px] uppercase tracking-widest text-ring-gold/80">
            Today&apos;s board
          </span>
        </div>
        {yourRank > 0 && (
          <span className="text-[10px] text-white/45 tabular-nums">
            You: #{yourRank} / {board.length}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {sorted.map((entry, i) => (
          <div
            key={entry.id}
            className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs ${
              entry.isYou
                ? 'bg-ring-gold/12 border border-ring-gold/25'
                : 'bg-white/[0.02] border border-transparent'
            }`}
          >
            <span
              className={`w-5 text-center font-display tabular-nums shrink-0 ${
                i === 0 ? 'text-ring-gold' : 'text-white/35'
              }`}
            >
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 truncate font-medium">
                {entry.isYou ? 'You' : entry.rosterNames.slice(0, 2).join(' · ')}
                {!entry.isYou && entry.rosterNames.length > 2 ? '…' : ''}
              </p>
              <p className="text-[10px] text-white/35 truncate">{entry.headline}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-display text-sm tabular-nums text-white/90">{entry.record}</p>
              {entry.perfectSeason && <Trophy className="w-3 h-3 text-ring-gold ml-auto mt-0.5" />}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[9px] text-white/25 mt-3 text-center">
        Ranked by ring → majors → season record → score
      </p>
    </motion.div>
  );
}
