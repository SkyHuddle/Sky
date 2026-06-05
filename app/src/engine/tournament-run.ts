import type { StageId, StageOutcome, TournamentRunStep } from '@/core/types';

/** Bracket-style beats shown during the sim animation */
export const STAGE_RUN_BEATS: Record<StageId, string[]> = {
  spring: [
    'Regular Season — Week 3',
    'Regular Season — Week 7',
    'Playoffs — Semifinals',
    'Spring Final',
  ],
  msi: [
    'Group Stage',
    'Quarterfinal',
    'Semifinal',
    'MSI Final',
  ],
  summer: [
    'Regular Season — Week 3',
    'Regular Season — Week 7',
    'Playoffs — Semifinals',
    'Summer Final',
  ],
  worlds: [
    'Swiss Stage',
    'Quarterfinal',
    'Semifinal',
    'Grand Final',
  ],
};

function failIndexForStage(
  stage: StageId,
  passed: boolean,
  passChancePct: number,
  rng: () => number
): number {
  if (passed) return STAGE_RUN_BEATS[stage].length;

  const miss = 1 - passChancePct / 100;
  const beats = STAGE_RUN_BEATS[stage].length;

  if (stage === 'worlds') {
    if (miss > 0.75) return 1;
    if (miss > 0.55) return 2;
    if (miss > 0.35) return 3;
    return beats;
  }

  if (stage === 'msi') {
    if (miss > 0.7) return 1;
    if (miss > 0.5) return 2;
    if (miss > 0.3) return 3;
    return beats;
  }

  if (miss > 0.65) return 1;
  if (miss > 0.45) return 2;
  if (miss > 0.25 || rng() < 0.55) return 3;
  return beats;
}

export function buildTournamentRun(
  stage: StageId,
  passed: boolean,
  passChancePct: number,
  rng: () => number
): TournamentRunStep[] {
  const labels = STAGE_RUN_BEATS[stage];
  const failAt = failIndexForStage(stage, passed, passChancePct, rng);

  return labels.map((label, i) => ({
    label,
    passed: i < failAt,
  }));
}

export function enrichStageWithRun(
  outcome: Omit<StageOutcome, 'run'>,
  rng: () => number
): StageOutcome {
  const run = buildTournamentRun(
    outcome.stage,
    outcome.passed,
    outcome.threshold,
    rng
  );
  return { ...outcome, run };
}
