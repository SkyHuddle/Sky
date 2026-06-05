import { useCallback, useMemo, useState } from 'react';
import type {
  CodPlayer,
  DraftPick,
  DraftRound,
  DraftSubphase,
  GameMode,
  GamePhase,
  SimulationResult,
} from '../core/types';
import { createRunSeed, generateDailyRounds, generateDraftRounds } from '../engine/draft';
import { simulateRingChase } from '../engine/simulation';
import {
  getDailyConstraint,
  getDateKey,
  estimatePercentile,
  playerPassesFilter,
  teamPassesFilter,
} from '../features/daily';
import { recordAttempt, saveDailyResult } from '../features/storage';
import { resolveTeamRoster } from '../data';

export function useRingChaseGame() {
  const [phase, setPhase] = useState<GamePhase>('home');
  const [mode, setMode] = useState<GameMode>('free');
  const [runSeed, setRunSeed] = useState('');
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [draftRounds, setDraftRounds] = useState<DraftRound[]>([]);
  const [draftSubphase, setDraftSubphase] = useState<DraftSubphase>('reveal');
  const [revealKey, setRevealKey] = useState(0);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [dailyPercentile, setDailyPercentile] = useState<number | null>(null);

  const dateKey = getDateKey();
  const dailyConstraint = useMemo(() => getDailyConstraint(), []);

  const currentRound: DraftRound | null = draftRounds[roundIndex] ?? null;

  const pickedPlayerIds = useMemo(() => new Set(picks.map((p) => p.player.id)), [picks]);

  const startGame = useCallback(
    (gameMode: GameMode) => {
      const constraint = getDailyConstraint();
      const teamFilter = constraint.filter
        ? (team: Parameters<typeof teamPassesFilter>[0]) =>
            teamPassesFilter(team, resolveTeamRoster(team), constraint)
        : undefined;

      const seed = createRunSeed(gameMode, gameMode === 'daily' ? dateKey : undefined);
      const rounds =
        gameMode === 'daily'
          ? generateDailyRounds(dateKey, teamFilter)
          : generateDraftRounds(seed, teamFilter);

      setMode(gameMode);
      setRunSeed(seed);
      setDraftRounds(rounds);
      setPicks([]);
      setRoundIndex(0);
      setDraftSubphase('reveal');
      setRevealKey(0);
      setResult(null);
      setDailyPercentile(null);
      setPhase('draft');
    },
    [dateKey]
  );

  const finishReveal = useCallback(() => {
    setDraftSubphase('pick');
  }, []);

  const selectPlayer = useCallback(
    (player: CodPlayer) => {
      if (!currentRound) return;
      if (pickedPlayerIds.has(player.id)) return;
      if (!playerPassesFilter(player, picks, dailyConstraint)) return;

      const pick: DraftPick = {
        roundIndex,
        player,
        team: currentRound.team,
      };

      const nextPicks = [...picks, pick];
      setPicks(nextPicks);

      if (roundIndex >= 3) {
        setPhase('ready');
      } else {
        setRoundIndex((i) => i + 1);
        setDraftSubphase('reveal');
        setRevealKey((k) => k + 1);
      }
    },
    [currentRound, pickedPlayerIds, picks, roundIndex, dailyConstraint]
  );

  const startSimulation = useCallback(() => {
    const simSeed =
      mode === 'daily'
        ? `${dateKey}-${picks.map((p) => p.player.id).sort().join('-')}`
        : undefined;
    const sim = simulateRingChase(picks, { seed: simSeed });
    setResult(sim);
    setPhase('simulation');

    recordAttempt(sim.ringWon, sim.perfectSeason, sim.rosterScore, mode === 'daily');

    if (mode === 'daily') {
      const percentile = estimatePercentile(sim.rosterScore, sim.ringWon, sim.perfectSeason);
      setDailyPercentile(percentile);
      saveDailyResult({
        date: dateKey,
        score: sim.rosterScore,
        ringWon: sim.ringWon,
        perfectSeason: sim.perfectSeason,
        percentile,
      });
    }
  }, [picks, mode, dateKey]);

  const finishSimulation = useCallback(() => setPhase('result'), []);

  const resetToHome = useCallback(() => {
    setPhase('home');
    setPicks([]);
    setRoundIndex(0);
    setDraftRounds([]);
    setRunSeed('');
    setResult(null);
    setDraftSubphase('reveal');
    setRevealKey(0);
  }, []);

  const playAgain = useCallback(() => startGame(mode), [mode, startGame]);

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
    revealKey,
    result,
    dailyConstraint,
    dailyPercentile,
    dateKey,
    runSeed,
    startGame,
    finishReveal,
    selectPlayer,
    startSimulation,
    finishSimulation,
    resetToHome,
    playAgain,
    redraftLast,
  };
}
