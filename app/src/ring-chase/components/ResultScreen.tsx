import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Share2, RotateCcw, Home } from 'lucide-react';
import type { DraftPick, GameMode, SimulationResult } from '../core/types';
import { ShareCard } from './ShareCard';
import { Button } from '@/components/ui/button';
import { addShareHistory } from '../features/storage';

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
  onPlayAgain,
  onHome,
}: ResultScreenProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleShare = useCallback(async () => {
    addShareHistory({
      ringWon: result.ringWon,
      perfectSeason: result.perfectSeason,
      score: result.rosterScore,
      rosterNames: picks.map((p) => p.player.gamertag),
    });

    const headline = result.perfectSeason ? 'PERFECT SEASON' : result.ringWon ? 'RING WON' : 'NO RING';
    const text = `${headline}\n${picks.map((p) => `${p.team.season} ${p.player.gamertag}`).join('\n')}\n${result.explanation}\nScore: ${result.rosterScore}`;

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
        <p className="text-center text-[10px] uppercase tracking-[0.35em] text-white/30 mb-5">
          Your result
        </p>
        <div ref={cardRef} className="flex justify-center">
          <ShareCard picks={picks} result={result} mode={mode} dailyTitle={dailyTitle} />
        </div>
        <p className="text-center text-white/25 text-xs mt-4">
          Screenshot to share on X, Reddit, or Discord
        </p>
      </motion.div>

      {mode === 'daily' && (
        <motion.div
          className="mt-6 rounded-2xl glass-panel p-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <p className="text-[10px] uppercase tracking-widest text-ring-gold/70">Daily score</p>
          <p className="font-display text-2xl text-white mt-1 tabular-nums">
            {result.rosterScore.toFixed(1)}
          </p>
        </motion.div>
      )}

      <motion.div className="space-y-2.5 mt-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="rounded-2xl glass-panel p-4 mb-2">
          <p className="text-[10px] uppercase tracking-widest text-white/35 mb-2">Why</p>
          <p className="text-sm text-white/70">{result.explanation}</p>
          <p className="text-xs text-ring-gold/60 mt-2">{result.footer}</p>
        </div>

        <Button
          onClick={handleShare}
          variant="outline"
          className="w-full h-12 rounded-2xl border-white/12 bg-white/[0.03] text-white hover:bg-white/[0.06]"
        >
          <Share2 className="w-4 h-4 mr-2 text-ring-gold" />
          Share Result
        </Button>
        <Button
          onClick={onPlayAgain}
          className="w-full h-12 rounded-2xl bg-ring-gold text-black hover:bg-ring-gold/90 border-0"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          One More Run
        </Button>
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
