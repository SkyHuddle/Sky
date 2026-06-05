import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import type { DraftPick, GameMode, SimulationResult } from '../core/types';
import { ShareCard } from './ShareCard';
import { SeasonRecordCard } from './SeasonRecordCard';
import { HistoricalCompare } from './HistoricalCompare';
import { DailyLeaderboard } from './DailyLeaderboard';
import { SisterCtaButton } from './SisterCtaButton';
import { KbCard } from './KbCard';
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
    <div className="min-h-[calc(100dvh-4rem)] px-4 py-8 pb-14 max-w-lg mx-auto overflow-y-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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

        <div className="mb-6">
          <HistoricalCompare comparison={result.historicalComparison} />
        </div>

        <div ref={cardRef} className="flex justify-center">
          <ShareCard picks={picks} result={result} mode={mode} dailyTitle={dailyTitle} />
        </div>
        <p className="text-center text-kb-faint text-xs mt-4">
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
        <KbCard className="mb-2">
          <p className="text-[10px] uppercase tracking-widest text-kb-mute mb-2">Tape review</p>
          <p className="text-sm text-kb-soft leading-relaxed">{result.explanation}</p>
          {result.chemistry.modifiers[0] && (
            <p className="text-xs text-kb-mute mt-2">{result.chemistry.modifiers[0]}</p>
          )}
        </KbCard>

        <SisterCtaButton onClick={handleShare} variant="glass">
          Share Result
        </SisterCtaButton>
        {mode === 'free' ? (
          <SisterCtaButton onClick={onPlayAgain} variant="gold">
            Run It Back
          </SisterCtaButton>
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
    </div>
  );
}
