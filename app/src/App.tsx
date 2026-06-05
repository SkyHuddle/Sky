import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '@/hooks/useGame';
import { HomeScreen } from '@/components/game/HomeScreen';
import { DraftScreen } from '@/components/game/DraftScreen';
import { ReadyScreen } from '@/components/game/ReadyScreen';
import { SimulationScreen } from '@/components/game/SimulationScreen';
import { ResultScreen } from '@/components/game/ResultScreen';
import { loadStats, loadDailyResult } from '@/features/storage';
import type { DailyRunResult, PlayerStats } from '@/core/types';
import { getDateKey } from '@/features/daily';

export default function App() {
  const game = useGame();
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

  const handleStartFree = useCallback(() => game.startGame('free'), [game]);
  const handleStartDaily = useCallback(() => game.startGame('daily'), [game]);
  const handleBack = useCallback(() => game.resetToHome(), [game]);
  const handleAttempt = useCallback(() => {
    game.startSimulation();
    game.setPhase('simulation');
  }, [game]);
  const handleSimulationComplete = useCallback(() => {
    game.finishSimulation();
  }, [game]);

  return (
    <div className="min-h-[100dvh] bg-[#060608] text-foreground antialiased">
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse 100% 80% at 50% -20%, rgba(201, 162, 39, 0.08) 0%, transparent 50%)',
        }}
      />

      <AnimatePresence mode="wait">
        {game.phase === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10"
          >
            <HomeScreen
              stats={stats}
              dailyConstraint={game.dailyConstraint}
              dailyPlayed={dailyPlayed}
              onStartFree={handleStartFree}
              onStartDaily={handleStartDaily}
            />
          </motion.div>
        )}

        {game.phase === 'draft' && game.currentRound && (
          <motion.div
            key={`draft-${game.roundIndex}-${game.draftSubphase}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10"
          >
            <DraftScreen
              roundIndex={game.roundIndex}
              currentRound={game.currentRound}
              draftSubphase={game.draftSubphase}
              picks={game.picks}
              openRoles={game.openRoles}
              skipsLeft={game.skipsLeft}
              dailyConstraint={game.dailyConstraint}
              isDaily={game.mode === 'daily'}
              pendingPlayer={game.pendingPlayer}
              pendingNaturalRole={game.pendingNaturalRole}
              onSpinComplete={game.finishSpin}
              onSkipTeam={game.skipTeam}
              onSelectPlayer={game.selectPlayer}
              onAssignRole={game.assignRole}
              onCancelAssign={game.cancelAssign}
              onBack={handleBack}
            />
          </motion.div>
        )}

        {game.phase === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10"
          >
            <ReadyScreen
              picks={game.picks}
              onAttempt={handleAttempt}
              onEdit={game.redraftLast}
            />
          </motion.div>
        )}

        {game.phase === 'simulation' && game.result && (
          <motion.div
            key="sim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10"
          >
            <SimulationScreen
              result={game.result}
              onComplete={handleSimulationComplete}
            />
          </motion.div>
        )}

        {game.phase === 'result' && game.result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10"
          >
            <ResultScreen
              picks={game.picks}
              result={game.result}
              mode={game.mode}
              dailyTitle={game.dailyConstraint.title}
              dailyPercentile={game.dailyPercentile}
              onPlayAgain={game.playAgain}
              onHome={game.resetToHome}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
