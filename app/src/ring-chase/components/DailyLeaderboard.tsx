import { motion } from 'framer-motion';
import { Trophy, Medal } from 'lucide-react';
import type { DailyBoardEntry } from '../features/daily-board';
import { KbCard } from './KbCard';

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
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
      <KbCard accent="amber">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Medal className="w-4 h-4 text-kb-amber" />
            <span className="text-[10px] uppercase tracking-widest text-kb-amber/90 font-semibold">
              Today&apos;s board
            </span>
          </div>
          {yourRank > 0 && (
            <span className="text-[10px] text-kb-mute tabular-nums kb-mono">
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
                  ? 'bg-kb-amber/12 border border-kb-amber/25'
                  : 'bg-kb-glass border border-transparent'
              }`}
            >
              <span
                className={`w-5 text-center font-display tabular-nums shrink-0 ${
                  i === 0 ? 'text-kb-gold' : 'text-kb-mute'
                }`}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-kb-fg truncate font-medium">
                  {entry.isYou ? 'You' : entry.rosterNames.slice(0, 2).join(' · ')}
                  {!entry.isYou && entry.rosterNames.length > 2 ? '…' : ''}
                </p>
                <p className="text-[10px] text-kb-mute truncate">{entry.headline}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-display text-sm tabular-nums text-kb-fg">{entry.record}</p>
                {entry.perfectSeason && <Trophy className="w-3 h-3 text-kb-gold ml-auto mt-0.5" />}
              </div>
            </div>
          ))}
        </div>

        <p className="text-[9px] text-kb-faint mt-3 text-center">
          Ranked by ring → majors → season record → score
        </p>
      </KbCard>
    </motion.div>
  );
}
