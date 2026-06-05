import type { StageId, StageOutcome, StageOutcomeLabel, TournamentRunStep } from '../core/types';

export const STAGE_RUN_BEATS: Record<StageId, string[]> = {
  major1: ['Pool Play', 'Winners Round 2', 'Semifinal', 'Major I Final'],
  major2: ['Pool Play', 'Winners Round 2', 'Semifinal', 'Major II Final'],
  major3: ['Pool Play', 'Winners Round 2', 'Semifinal', 'Major III Final'],
  major4: ['Pool Play', 'Winners Round 2', 'Semifinal', 'Major IV Final'],
  champs: ['Group Stage', 'Quarterfinal', 'Semifinal', 'Grand Final'],
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

  if (stage === 'champs') {
    if (miss > 0.75) return 1;
    if (miss > 0.55) return 2;
    if (miss > 0.35) return 3;
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
  const run = buildTournamentRun(outcome.stage, outcome.passed, outcome.passChance, rng);
  return { ...outcome, run };
}

export function stageFailureHeadline(stage: StageId, outcome: StageOutcomeLabel): string {
  if (stage === 'champs') {
    if (outcome === 'grand_final') return 'Lost Champs Grand Final';
    if (outcome === 'missed') return 'Missed Champs';
    return 'Eliminated at Champs';
  }
  if (outcome === 'runner_up') {
    return `Lost ${stage === 'major1' ? 'Major I' : stage === 'major2' ? 'Major II' : stage === 'major3' ? 'Major III' : 'Major IV'} Final`;
  }
  return `Eliminated at ${stage === 'major1' ? 'Major I' : stage === 'major2' ? 'Major II' : stage === 'major3' ? 'Major III' : 'Major IV'}`;
}
