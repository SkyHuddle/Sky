import { useCallback, useMemo, useState } from 'react';
import type {
  DraftPick,
  DraftRound,
  DraftSubphase,
  GameMode,
  GamePhase,
  Player,
  Role,
  SimulationResult,
} from '@/core/types';
import { ROLE_ORDER } from '@/core/constants';
import {
  generateDraftRounds,
  createRunSeed,
  rerollRound,
} from '@/engine/draft';
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
  const [runSeed, setRunSeed] = useState('');
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [draftRounds, setDraftRounds] = useState<DraftRound[]>([]);
  const [draftSubphase, setDraftSubphase] = useState<DraftSubphase>('spin');
  const [spinGeneration, setSpinGeneration] = useState(0);
  const [respinsLeft, setRespinsLeft] = useState(1);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [dailyPercentile, setDailyPercentile] = useState<number | null>(null);

  const dateKey = getDateKey();
  const dailyConstraint = useMemo(() => getDailyConstraint(), []);

  const currentRound: DraftRound | null = draftRounds[roundIndex] ?? null;

  const filledRoles = useMemo(
    () => new Set(picks.map((p) => p.role)),
    [picks]
  );

  const openRoles = useMemo(
    () => ROLE_ORDER.filter((r) => !filledRoles.has(r)),
    [filledRoles]
  );

  const startGame = useCallback((gameMode: GameMode) => {
    const seed = createRunSeed(gameMode, gameMode === 'daily' ? dateKey : undefined);
    const filter = gameMode === 'daily' ? getDailyConstraint().filter : undefined;
    const rounds = generateDraftRounds(seed, filter);
    setMode(gameMode);
    setRunSeed(seed);
    setDraftRounds(rounds);
    setPicks([]);
    setRoundIndex(0);
    setDraftSubphase('spin');
    setSpinGeneration(0);
    setRespinsLeft(1);
    setResult(null);
    setDailyPercentile(null);
    setPhase('draft');
  }, [dateKey]);

  const finishSpin = useCallback(() => {
    setDraftSubphase('pick');
  }, []);

  /** One respin per game — after the spin lands and the roster is shown */
  const respinTeam = useCallback(() => {
    if (respinsLeft <= 0 || draftSubphase !== 'pick') return;

    const usedIds = draftRounds
      .filter((_, i) => i !== roundIndex)
      .map((r) => r.team.id);
    const filter = mode === 'daily' ? dailyConstraint.filter : undefined;
    const next = rerollRound(runSeed, roundIndex, usedIds, filter);

    setDraftRounds((prev) => {
      const copy = [...prev];
      copy[roundIndex] = next;
      return copy;
    });
    setRespinsLeft((s) => s - 1);
    setSpinGeneration((g) => g + 1);
    setDraftSubphase('spin');
  }, [
    respinsLeft,
    draftSubphase,
    draftRounds,
    roundIndex,
    runSeed,
    mode,
    dailyConstraint.filter,
  ]);

  const selectPlayer = useCallback(
    (player: Player, naturalRole: Role) => {
      if (!currentRound || !openRoles.includes(naturalRole)) return;

      if (
        mode === 'daily' &&
        isOnePerOrgDay(dailyConstraint.id) &&
        orgConstraintViolated(picks.map((p) => p.player), player)
      ) {
        return;
      }

      const pick: DraftPick = {
        role: naturalRole,
        naturalRole,
        player,
        team: currentRound.team,
        phase: currentRound.phase,
      };

      setPicks((prev) => [...prev, pick]);

      if (roundIndex >= ROLE_ORDER.length - 1) {
        setPhase('ready');
      } else {
        setRoundIndex((i) => i + 1);
        setDraftSubphase('spin');
        setSpinGeneration((g) => g + 1);
      }
    },
    [currentRound, openRoles, mode, dailyConstraint.id, picks, roundIndex]
  );

  const startSimulation = useCallback(() => {
    const simSeed =
      mode === 'daily'
        ? `${dateKey}-${picks.map((p) => p.player.id).sort().join('-')}`
        : undefined;
    const sim = simulateGoldenRoad(picks, { seed: simSeed });
    setResult(sim);
    setPhase('simulation');

    recordAttempt(sim.goldenRoad, sim.rosterScore, mode === 'daily');

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
  }, [picks, mode, dateKey]);

  const finishSimulation = useCallback(() => {
    setPhase('result');
  }, []);

  const resetToHome = useCallback(() => {
    setPhase('home');
    setPicks([]);
    setRoundIndex(0);
    setDraftRounds([]);
    setRunSeed('');
    setResult(null);
    setDraftSubphase('spin');
    setSpinGeneration(0);
  }, []);

  const playAgain = useCallback(() => {
    startGame(mode);
  }, [mode, startGame]);

  const redraftLast = useCallback(() => {
    if (picks.length === 0) return;
    setPicks((prev) => prev.slice(0, -1));
    setRoundIndex(picks.length - 1);
    setDraftSubphase('pick');
    setPhase('draft');
  }, [picks]);

  return {
    phase,
    mode,
    picks,
    roundIndex,
    currentRound,
    draftSubphase,
    spinGeneration,
    openRoles,
    filledRoles,
    respinsLeft,
    result,
    dailyConstraint,
    dailyPercentile,
    dateKey,
    startGame,
    finishSpin,
    respinTeam,
    selectPlayer,
    startSimulation,
    finishSimulation,
    resetToHome,
    playAgain,
    redraftLast,
    setPhase,
  };
}
