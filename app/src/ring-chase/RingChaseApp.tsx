import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRingChaseGame } from './hooks/useRingChaseGame';
import { HomeScreen } from './components/HomeScreen';
import { DraftScreen } from './components/DraftScreen';
import { ReadyScreen } from './components/ReadyScreen';
import { SimulationScreen } from './components/SimulationScreen';
import { ResultScreen } from './components/ResultScreen';
import { loadStats, loadDailyResult } from './features/storage';
import { getDateKey } from './features/daily';
import type { DailyRunResult, PlayerStats } from './core/types';

export function RingChaseApp() {
  const game = useRingChaseGame();
  const [stats, setStats] = useState<PlayerStats>(() => loadStats());
  const [dailyPlayed, setDailyPlayed] = useState<DailyRunResult | null>(() =>
    loadDailyResult(getDateKey())
  );

  useEffect(() => {
    if (game.phase === 'home') {
      setStats(loadStats());
      setDailyPlayed(loadDailyResult(getDateKey()));
    }
  }, [game.phase]);

  return (
    <div className="min-h-[100dvh] bg-[#060608] text-foreground antialiased relative overflow-x-hidden ring-chase-theme">
      <div className="fixed inset-0 mesh-bg-ring pointer-events-none z-0" />
      <div className="fixed inset-0 grid-bg pointer-events-none z-0 opacity-60" />

      <AnimatePresence mode="wait">
        {game.phase === 'home' && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10">
            <HomeScreen
              stats={stats}
              dailyConstraint={game.dailyConstraint}
              dailyPlayed={dailyPlayed}
              onStartFree={() => game.startGame('free')}
              onStartDaily={() => game.startGame('daily')}
            />
          </motion.div>
        )}

        {game.phase === 'draft' && game.currentRound && (
          <motion.div key={`draft-${game.roundIndex}-${game.draftSubphase}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10">
            <DraftScreen
              currentRound={game.currentRound}
              draftSubphase={game.draftSubphase}
              picks={game.picks}
              openRoles={game.openRoles}
              spinGeneration={game.spinGeneration}
              respinsLeft={game.respinsLeft}
              dailyConstraint={game.dailyConstraint}
              isDaily={game.mode === 'daily'}
              onSpinComplete={game.finishSpin}
              onRespinTeam={game.respinTeam}
              onSelectPlayer={game.selectPlayer}
              onBack={game.resetToHome}
            />
          </motion.div>
        )}

        {game.phase === 'ready' && (
          <motion.div key="ready" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative z-10">
            <ReadyScreen
              picks={game.picks}
              isDaily={game.mode === 'daily'}
              onAttempt={game.startSimulation}
              onEdit={game.redraftLast}
            />
          </motion.div>
        )}

        {game.phase === 'simulation' && game.result && (
          <motion.div key="sim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10">
            <SimulationScreen
              result={game.result}
              picks={game.picks}
              simSeed={game.mode === 'daily' ? `${game.dateKey}-${game.picks.map((p) => p.player.id).sort().join('-')}` : game.runSeed}
              onComplete={game.finishSimulation}
            />
          </motion.div>
        )}

        {game.phase === 'result' && game.result && (
          <motion.div key="result" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
            <ResultScreen
              picks={game.picks}
              result={game.result}
              mode={game.mode}
              dailyTitle={game.dailyConstraint.title}
              dailyPercentile={game.dailyPercentile}
              dailyBoardEntryId={game.dailyBoardEntryId}
              onPlayAgain={game.playAgain}
              onHome={game.resetToHome}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
