import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Share2, RotateCcw, Home } from 'lucide-react';
import type { DraftPick, SimulationResult, GameMode } from '@/core/types';
import { ShareCard } from './ShareCard';
import { DailyLeaderboard } from './DailyLeaderboard';
import { Button } from '@/components/ui/button';
import { addShareHistory } from '@/features/storage';

interface ResultScreenProps {
  picks: DraftPick[];
  result: SimulationResult;
  mode: GameMode;
  dailyTitle?: string;
  dailyPercentile: number | null;
  onPlayAgain: () => void;
  onHome: () => void;
}

export function ResultScreen({
  picks,
  result,
  mode,
  dailyTitle,
  dailyPercentile,
  onPlayAgain,
  onHome,
}: ResultScreenProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleShare = useCallback(async () => {
    addShareHistory({
      goldenRoad: result.goldenRoad,
      score: result.rosterScore,
      rosterNames: picks.map((p) => p.player.name),
    });

    const text = result.goldenRoad
      ? `🏆 GOLDEN ROAD!\n${picks.map((p) => p.player.name).join(' · ')}\nScore: ${result.rosterScore}`
      : `${result.failureMessage}\n${picks.map((p) => p.player.name).join(' · ')}\nScore: ${result.rosterScore}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Golden Road', text });
        return;
      } catch {
        /* fall through */
      }
    }

    await navigator.clipboard.writeText(text);
  }, [picks, result]);

  return (
    <div className="min-h-[100dvh] px-4 py-10 pb-14 max-w-lg mx-auto overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <p className="text-center text-[10px] uppercase tracking-[0.35em] text-white/30 mb-5">
          Your result
        </p>
        <div ref={cardRef} className="flex justify-center">
          <ShareCard
            picks={picks}
            result={result}
            mode={mode}
            dailyTitle={dailyTitle}
          />
        </div>
        <p className="text-center text-white/25 text-xs mt-4">
          Screenshot to share on X, Reddit, or Discord
        </p>
      </motion.div>

      {mode === 'daily' && dailyPercentile != null && (
        <motion.div
          className="mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <DailyLeaderboard percentile={dailyPercentile} score={result.rosterScore} />
        </motion.div>
      )}

      <motion.div
        className="space-y-2.5 mt-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          onClick={handleShare}
          variant="outline"
          className="w-full h-12 rounded-2xl border-white/12 bg-white/[0.03] text-white hover:bg-white/[0.06] hover:text-white"
        >
          <Share2 className="w-4 h-4 mr-2 text-gold" />
          Share Result
        </Button>
        <Button
          onClick={onPlayAgain}
          className="w-full h-12 rounded-2xl bg-gold text-black hover:bg-gold/90 border-0 shadow-lg shadow-gold/15"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          One More Run
        </Button>
        <button
          type="button"
          onClick={onHome}
          className="w-full flex items-center justify-center gap-2 text-white/35 text-sm py-3.5 hover:text-white/55 transition-colors"
        >
          <Home className="w-4 h-4" />
          Home
        </button>
      </motion.div>
    </div>
  );
}
