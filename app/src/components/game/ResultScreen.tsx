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
      ? `🏆 GOLDEN ROAD ACHIEVED!\n${picks.map((p) => `${p.player.name}`).join(' · ')}\nScore: ${result.rosterScore}`
      : `${result.failureMessage}\n${picks.map((p) => p.player.name).join(' · ')}\nScore: ${result.rosterScore}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Golden Road',
          text,
        });
        return;
      } catch {
        /* fall through */
      }
    }

    await navigator.clipboard.writeText(text);
  }, [picks, result]);

  return (
    <div className="min-h-[100dvh] px-4 py-8 pb-12 max-w-lg mx-auto overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div ref={cardRef} className="flex justify-center">
          <ShareCard
            picks={picks}
            result={result}
            mode={mode}
            dailyTitle={dailyTitle}
          />
        </div>
        <p className="text-center text-white/30 text-xs mt-3">
          Screenshot to share · Built for X, Reddit & Discord
        </p>
      </motion.div>

      {mode === 'daily' && dailyPercentile != null && (
        <DailyLeaderboard percentile={dailyPercentile} score={result.rosterScore} />
      )}

      <motion.div
        className="space-y-3 mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          onClick={handleShare}
          variant="outline"
          className="w-full h-12 rounded-xl border-gold/30 text-gold hover:bg-gold/10"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share Result
        </Button>
        <Button
          onClick={onPlayAgain}
          className="w-full h-12 rounded-xl bg-gold text-black hover:bg-gold/90"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          One More Run
        </Button>
        <button
          type="button"
          onClick={onHome}
          className="w-full flex items-center justify-center gap-2 text-white/40 text-sm py-3 hover:text-white/60"
        >
          <Home className="w-4 h-4" />
          Home
        </button>
      </motion.div>
    </div>
  );
}
