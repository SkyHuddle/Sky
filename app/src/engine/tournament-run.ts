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
  power: number,
  threshold: number,
  rng: () => number
): number {
  if (passed) return STAGE_RUN_BEATS[stage].length;

  const gap = threshold - power;
  const beats = STAGE_RUN_BEATS[stage].length;

  if (stage === 'worlds') {
    if (gap > 8) return 1;
    if (gap > 5) return 2;
    if (gap > 2) return 3;
    return beats;
  }

  if (stage === 'msi') {
    if (gap > 7) return 1;
    if (gap > 4) return 2;
    if (gap > 1) return 3;
    return beats;
  }

  // Domestic splits — fail later in bracket on close losses
  if (gap > 6) return 1;
  if (gap > 3) return 2;
  if (gap > 1 || rng() < 0.55) return 3;
  return beats;
}

export function buildTournamentRun(
  stage: StageId,
  passed: boolean,
  power: number,
  threshold: number,
  rng: () => number
): TournamentRunStep[] {
  const labels = STAGE_RUN_BEATS[stage];
  const failAt = failIndexForStage(stage, passed, power, threshold, rng);

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
    outcome.roll,
    outcome.threshold,
    rng
  );
  return { ...outcome, run };
}
