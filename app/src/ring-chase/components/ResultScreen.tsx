import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Share2, RotateCcw, Home } from 'lucide-react';
import type { DraftPick, GameMode, SimulationResult } from '../core/types';
import { ShareCard } from './ShareCard';
import { SeasonRecordCard } from './SeasonRecordCard';
import { HistoricalCompare } from './HistoricalCompare';
import { DailyLeaderboard } from './DailyLeaderboard';
import { Button } from '@/components/ui/button';
import { addShareHistory } from '../features/storage';
import { loadDailyBoard } from '../features/daily-board';
import { getDateKey } from '../features/daily';

interface ResultScreenProps {
  picks: DraftPick[];
  result: SimulationResult;
  mode: GameMode;
  dailyTitle?: string;
  dailyPercentile: number | null;
  dailyBoardEntryId?: string | null;
  onPlayAgain: () => void;
  onHome: () => void;
}

export function ResultScreen({
  picks,
  result,
  mode,
  dailyTitle,
  dailyBoardEntryId,
  onPlayAgain,
  onHome,
}: ResultScreenProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const dailyBoard = mode === 'daily' ? loadDailyBoard(getDateKey()) : [];

  const handleShare = useCallback(async () => {
    addShareHistory({
      ringWon: result.ringWon,
      perfectSeason: result.perfectSeason,
      score: result.rosterScore,
      rosterNames: picks.map((p) => p.player.gamertag),
    });

    const { seasonSummary, historicalComparison } = result;
    const text = `${seasonSummary.headline}\n${seasonSummary.narrative}\n\n${historicalComparison.anchorLine}\n\n${picks.map((p) => `${p.team.season} ${p.player.gamertag}`).join(' · ')}\nScore: ${result.rosterScore.toFixed(1)}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Ring Chase', text });
        return;
      } catch {
        /* fall through */
      }
    }
    await navigator.clipboard.writeText(text);
  }, [picks, result]);

  return (
    <div className="min-h-[100dvh] px-4 py-10 pb-14 max-w-lg mx-auto overflow-y-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-center text-[10px] uppercase tracking-[0.35em] text-white/30 mb-4">
          Final standings
        </p>

        <div className="mb-5">
          <SeasonRecordCard
            summary={result.seasonSummary}
            variant="result"
            perfectSeason={result.perfectSeason}
            ringWon={result.ringWon}
          />
        </div>

        <div className="mb-6">
          <HistoricalCompare comparison={result.historicalComparison} />
        </div>

        <div ref={cardRef} className="flex justify-center">
          <ShareCard picks={picks} result={result} mode={mode} dailyTitle={dailyTitle} />
        </div>
        <p className="text-center text-white/25 text-xs mt-4">
          Screenshot to share on X, Reddit, or Discord
        </p>
      </motion.div>

      {mode === 'daily' && dailyBoard.length > 0 && (
        <motion.div className="mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <DailyLeaderboard board={dailyBoard} yourEntryId={dailyBoardEntryId ?? `you-${getDateKey()}`} />
        </motion.div>
      )}

      <motion.div
        className="space-y-2.5 mt-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="rounded-2xl glass-panel p-4 mb-2 border border-white/[0.06]">
          <p className="text-[10px] uppercase tracking-widest text-white/35 mb-2">Tape review</p>
          <p className="text-sm text-white/70 leading-relaxed">{result.explanation}</p>
          {result.chemistry.modifiers[0] && (
            <p className="text-xs text-white/40 mt-2">{result.chemistry.modifiers[0]}</p>
          )}
        </div>

        <Button
          onClick={handleShare}
          variant="outline"
          className="w-full h-12 rounded-2xl border-white/12 bg-white/[0.03] text-white hover:bg-white/[0.06]"
        >
          <Share2 className="w-4 h-4 mr-2 text-ring-gold" />
          Share Result
        </Button>
        {mode === 'free' ? (
          <Button
            onClick={onPlayAgain}
            className="w-full h-12 rounded-2xl bg-ring-gold text-black hover:bg-ring-gold/90 border-0 shadow-lg shadow-ring-gold/15"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Run It Back
          </Button>
        ) : (
          <p className="text-center text-[11px] text-white/35 py-2">
            Daily locked — one official attempt per day
          </p>
        )}
        <button
          type="button"
          onClick={onHome}
          className="w-full flex items-center justify-center gap-2 text-white/35 text-sm py-3.5 hover:text-white/55"
        >
          <Home className="w-4 h-4" />
          Home
        </button>
      </motion.div>
    </div>
  );
}
