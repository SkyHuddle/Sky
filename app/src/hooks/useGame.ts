import { useCallback, useMemo, useState } from 'react';
import type {
  DraftPick,
  GameMode,
  GamePhase,
  Player,
  Role,
  SimulationResult,
} from '@/core/types';
import { ROLE_ORDER } from '@/core/constants';
import { generateDraftPool, createRunSeed } from '@/engine/draft';
import { simulateGoldenRoad } from '@/engine/simulation';
import {
  getDailyConstraint,
  getDateKey,
  estimatePercentile,
  isOnePerOrgDay,
  orgConstraintViolated,
} from '@/features/daily';
import { recordAttempt, saveDailyResult } from '@/features/storage';

export function useGame() {
  const [phase, setPhase] = useState<GamePhase>('home');
  const [mode, setMode] = useState<GameMode>('free');
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const [runSeed, setRunSeed] = useState('');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [dailyPercentile, setDailyPercentile] = useState<number | null>(null);

  const dateKey = getDateKey();
  const dailyConstraint = useMemo(() => getDailyConstraint(), []);

  const currentRole: Role | null =
    currentRoleIndex < ROLE_ORDER.length ? ROLE_ORDER[currentRoleIndex] : null;

  const filter = mode === 'daily' ? dailyConstraint.filter : undefined;

  const draftPool = useMemo(() => {
    if (!currentRole || !runSeed) return [];
    return generateDraftPool(
      currentRole,
      runSeed,
      currentRoleIndex,
      filter,
      picks.map((p) => p.player.id)
    );
  }, [currentRole, runSeed, currentRoleIndex, filter, picks]);

  const startGame = useCallback((gameMode: GameMode) => {
    const seed = createRunSeed(gameMode, gameMode === 'daily' ? dateKey : undefined);
    setMode(gameMode);
    setRunSeed(seed);
    setPicks([]);
    setCurrentRoleIndex(0);
    setResult(null);
    setDailyPercentile(null);
    setPhase('draft');
  }, [dateKey]);

  const selectPlayer = useCallback(
    (player: Player) => {
      if (!currentRole) return;

      if (
        mode === 'daily' &&
        isOnePerOrgDay(dailyConstraint.id) &&
        orgConstraintViolated(
          picks.map((p) => p.player),
          player
        )
      ) {
        return;
      }

      const pick: DraftPick = { role: currentRole, player };
      const nextPicks = [...picks, pick];
      setPicks(nextPicks);

      if (currentRoleIndex >= ROLE_ORDER.length - 1) {
        setPhase('ready');
      } else {
        setCurrentRoleIndex((i) => i + 1);
      }
    },
    [currentRole, currentRoleIndex, picks, mode, dailyConstraint.id]
  );

  const startSimulation = useCallback(() => {
    const roster = picks.map((p) => p.player);
    const simSeed =
      mode === 'daily'
        ? `${dateKey}-${roster.map((p) => p.id).sort().join('-')}`
        : undefined;
    const sim = simulateGoldenRoad(roster, { seed: simSeed });
    setResult(sim);
    setPhase('simulation');

    const stats = recordAttempt(sim.goldenRoad, sim.rosterScore, mode === 'daily');

    if (mode === 'daily') {
      const percentile = estimatePercentile(sim.rosterScore, sim.goldenRoad);
      setDailyPercentile(percentile);
      saveDailyResult({
        date: dateKey,
        score: sim.rosterScore,
        goldenRoad: sim.goldenRoad,
        percentile,
      });
    }

    return { sim, stats };
  }, [picks, mode, dateKey]);

  const finishSimulation = useCallback(() => {
    setPhase('result');
  }, []);

  const resetToHome = useCallback(() => {
    setPhase('home');
    setPicks([]);
    setCurrentRoleIndex(0);
    setResult(null);
    setRunSeed('');
  }, []);

  const playAgain = useCallback(() => {
    startGame(mode);
  }, [mode, startGame]);

  const redraftLast = useCallback(() => {
    if (picks.length === 0) return;
    setPicks((prev) => prev.slice(0, -1));
    setCurrentRoleIndex(picks.length - 1);
    setPhase('draft');
  }, [picks]);

  return {
    phase,
    mode,
    picks,
    currentRole,
    currentRoleIndex,
    draftPool,
    result,
    dailyConstraint,
    dailyPercentile,
    dateKey,
    startGame,
    selectPlayer,
    startSimulation,
    finishSimulation,
    resetToHome,
    playAgain,
    redraftLast,
    setPhase,
  };
}
