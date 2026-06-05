import { useCallback, useMemo, useState } from 'react';
import type {
  CodPlayer,
  DraftPick,
  DraftRound,
  DraftSubphase,
  GameMode,
  GamePhase,
  RosterSlot,
  SimulationResult,
} from '../core/types';
import { SLOT_ORDER } from '../core/constants';
import {
  createRunSeed,
  generateDailyRounds,
  generateDraftRounds,
  rerollRound,
} from '../engine/draft';
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
  const [draftSubphase, setDraftSubphase] = useState<DraftSubphase>('spin');
  const [spinGeneration, setSpinGeneration] = useState(0);
  const [respinsLeft, setRespinsLeft] = useState(1);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [dailyPercentile, setDailyPercentile] = useState<number | null>(null);

  const dateKey = getDateKey();
  const dailyConstraint = useMemo(() => getDailyConstraint(), []);

  const currentRound: DraftRound | null = draftRounds[roundIndex] ?? null;

  const filledRoles = useMemo(() => new Set(picks.map((p) => p.role)), [picks]);

  const openRoles = useMemo(
    () => SLOT_ORDER.filter((slot) => !filledRoles.has(slot)),
    [filledRoles]
  );

  const startGame = useCallback(
    (gameMode: GameMode) => {
      const constraint = getDailyConstraint();
      const teamFilter =
        gameMode === 'daily' && constraint.filter
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
      setDraftSubphase('spin');
      setSpinGeneration(0);
      setRespinsLeft(1);
      setResult(null);
      setDailyPercentile(null);
      setPhase('draft');
    },
    [dateKey]
  );

  const finishSpin = useCallback(() => {
    setDraftSubphase('pick');
  }, []);

  const respinTeam = useCallback(() => {
    if (respinsLeft <= 0 || draftSubphase !== 'pick') return;

    const usedIds = draftRounds
      .filter((_, i) => i !== roundIndex)
      .map((r) => r.team.id);
    const teamFilter =
      mode === 'daily' && dailyConstraint.filter
        ? (team: Parameters<typeof teamPassesFilter>[0]) =>
            teamPassesFilter(team, resolveTeamRoster(team), dailyConstraint)
        : undefined;

    const next = rerollRound(runSeed, roundIndex, usedIds, teamFilter);
    setDraftRounds((prev) => {
      const copy = [...prev];
      copy[roundIndex] = next;
      return copy;
    });
    setRespinsLeft((s) => s - 1);
    setSpinGeneration((g) => g + 1);
    setDraftSubphase('spin');
  }, [respinsLeft, draftSubphase, draftRounds, roundIndex, runSeed, mode, dailyConstraint]);

  const selectPlayer = useCallback(
    (player: CodPlayer, naturalRole: RosterSlot) => {
      const round = draftRounds[roundIndex];
      if (!round || !openRoles.includes(naturalRole)) return;
      if (picks.some((p) => p.player.id === player.id)) return;
      if (mode === 'daily' && !playerPassesFilter(player, picks, dailyConstraint)) return;

      const pick: DraftPick = {
        roundIndex,
        role: naturalRole,
        naturalRole,
        player,
        team: round.team,
      };
      const nextPicks = [...picks, pick];
      setPicks(nextPicks);

      if (roundIndex >= SLOT_ORDER.length - 1) {
        setPhase('ready');
      } else {
        setRoundIndex((i) => i + 1);
        setDraftSubphase('spin');
        setSpinGeneration((g) => g + 1);
      }
    },
    [draftRounds, roundIndex, picks, mode, dailyConstraint, openRoles]
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
    setDraftSubphase('spin');
    setSpinGeneration(0);
    setRespinsLeft(1);
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
    spinGeneration,
    respinsLeft,
    openRoles,
    result,
    dailyConstraint,
    dailyPercentile,
    dateKey,
    runSeed,
    startGame,
    finishSpin,
    respinTeam,
    selectPlayer,
    startSimulation,
    finishSimulation,
    resetToHome,
    playAgain,
    redraftLast,
  };
}
