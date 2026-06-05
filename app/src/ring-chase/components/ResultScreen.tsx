import { useRef, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home } from 'lucide-react';
import type { DraftPick, GameMode, SimulationResult } from '../core/types';
import { ShareCard } from './ShareCard';
import { SeasonRecordCard } from './SeasonRecordCard';
import { DailyLeaderboard } from './DailyLeaderboard';
import { RingCtaButton } from './RingCtaButton';
import { addShareHistory } from '../features/storage';
import { loadDailyBoard } from '../features/daily-board';
import { getDateKey } from '../features/daily';
import { formatDailyShareLine, formatShareText } from '../features/share';
import { hapticSuccess } from '../utils/haptics';

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
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(false);
    hapticSuccess();
    const t = setTimeout(() => setRevealed(true), 900);
    return () => clearTimeout(t);
  }, [result]);

  const rosterLine = picks.map((p) => `${p.team.season} ${p.player.gamertag}`).join(' · ');

  const handleShare = useCallback(async () => {
    addShareHistory({
      ringWon: result.ringWon,
      perfectSeason: result.perfectSeason,
      score: result.rosterScore,
      rosterNames: picks.map((p) => p.player.gamertag),
    });

    const text = formatShareText(result, rosterLine, mode === 'daily');

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ring Chase',
          text: mode === 'daily' ? formatDailyShareLine(result) : text,
        });
        return;
      } catch {
        /* fall through */
      }
    }
    await navigator.clipboard.writeText(
      mode === 'daily' ? formatDailyShareLine(result) : text
    );
  }, [picks, result, mode, rosterLine]);

  return (
    <div className="min-h-[100dvh] px-4 py-10 pb-14 max-w-lg mx-auto overflow-y-auto">
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.button
            key="reveal"
            type="button"
            className="min-h-[70dvh] flex flex-col items-center justify-center w-full"
            onClick={() => setRevealed(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
          >
            <p className="text-[10px] uppercase tracking-[0.4em] text-kb-mute mb-4">Your season</p>
            <motion.p
              className={`font-display text-7xl sm:text-8xl tabular-nums leading-none ${
                result.ringWon || result.perfectSeason ? 'text-ring-gold glow-ring' : 'text-kb-fg'
              }`}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            >
              {result.seasonSummary.record}
            </motion.p>
            <p className="text-kb-soft text-sm mt-4 text-center max-w-[260px]">
              {result.seasonSummary.headline}
            </p>
            <p className="text-kb-faint text-[10px] uppercase tracking-widest mt-8">Tap to continue</p>
          </motion.button>
        ) : (
          <motion.div
            key="full"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-center text-[10px] uppercase tracking-[0.35em] text-kb-mute mb-4">
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

            <div ref={cardRef} className="flex justify-center">
              <ShareCard picks={picks} result={result} mode={mode} dailyTitle={dailyTitle} />
            </div>
            <p className="text-center text-kb-faint text-xs mt-4">
              Screenshot to share on X, Reddit, or Discord
            </p>

            {mode === 'daily' && dailyBoard.length > 0 && (
              <motion.div className="mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <DailyLeaderboard
                  board={dailyBoard}
                  yourEntryId={dailyBoardEntryId ?? `you-${getDateKey()}`}
                />
              </motion.div>
            )}

            <motion.div className="space-y-2.5 mt-8">
              <RingCtaButton onClick={handleShare} variant="glass">
                Share Result
              </RingCtaButton>
              {mode === 'free' ? (
                <RingCtaButton onClick={onPlayAgain} variant="gold">
                  Run It Back
                </RingCtaButton>
              ) : (
                <p className="text-center text-[11px] text-kb-mute py-2">
                  Daily locked — one official attempt per day
                </p>
              )}
              <button
                type="button"
                onClick={onHome}
                className="w-full flex items-center justify-center gap-2 text-kb-mute text-sm py-3.5 hover:text-kb-soft transition-colors"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
