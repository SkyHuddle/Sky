import type { CodPlayer, DraftPick, SimulationResult, StageId } from '../core/types';
import { STAGE_LABELS } from '../core/types';
import { STAGE_FAILURE_LABELS } from '../core/constants';

function avgStat(players: CodPlayer[], key: keyof CodPlayer['ratings']): number {
  if (players.length === 0) return 0;
  return players.reduce((sum, p) => sum + p.ratings[key], 0) / players.length;
}

function isCloseLoss(outcome: string): boolean {
  return outcome === 'runner_up' || outcome === 'grand_final';
}

function stageStatWeakness(stage: StageId, players: CodPlayer[]): string | null {
  const snd = avgStat(players, 'snd');
  const respawn = avgStat(players, 'respawn');
  const lan = avgStat(players, 'lan');
  const leadership = avgStat(players, 'leadership');

  if (stage === 'champs') {
    if (snd < 86) return 'SnD maps fell apart at Champs.';
    if (lan < 84) return 'LAN pressure cracked the squad at Champs.';
    if (leadership < 85) return 'No one took control when Champs got loud.';
    return null;
  }

  const respawnMajor = stage === 'major2' || stage === 'major4';
  if (respawnMajor && respawn < 86) {
    return `Respawn maps cost you at ${STAGE_FAILURE_LABELS[stage]}.`;
  }

  if (!respawnMajor && snd < 85) {
    return `Search & Destroy slipped at ${STAGE_FAILURE_LABELS[stage]}.`;
  }

  if (leadership < 84) {
    return `No IGL stepped up at ${STAGE_FAILURE_LABELS[stage]}.`;
  }

  return null;
}

export function buildExplanation(
  result: Omit<SimulationResult, 'explanation' | 'footer'>,
  picks: DraftPick[]
): { explanation: string; footer: string } {
  const players = picks.map((p) => p.player);
  const { ringWon, perfectSeason, majorWins, failureStage, weakLink, chemistry, stages } = result;

  if (perfectSeason) {
    return {
      explanation: 'Perfect role balance. Untouchable all season.',
      footer: 'PERFECT SEASON',
    };
  }

  if (ringWon) {
    const line = chemistry.modifiers[0] ?? 'Championship DNA won out.';
    return { explanation: line, footer: 'RING WON' };
  }

  const failedStage = failureStage ? stages.find((s) => s.stage === failureStage) : null;

  if (!failedStage) {
    return {
      explanation: 'The run ended short of a ring.',
      footer: `Major wins: ${majorWins}`,
    };
  }

  const stageLabel = STAGE_FAILURE_LABELS[failedStage.stage];
  const close = isCloseLoss(failedStage.outcome);
  const coinFlip = failedStage.passChance >= 42 && failedStage.passChance <= 58;

  if (close && coinFlip) {
    return {
      explanation: `Coin-flip series at ${stageLabel} didn't break your way.`,
      footer: failedStage.outcome === 'grand_final' ? 'One map away.' : `Major wins: ${majorWins}`,
    };
  }

  if (close && weakLink) {
    return {
      explanation: `${weakLink.gamertag} got exposed in the ${stageLabel} finals.`,
      footer: failedStage.outcome === 'grand_final' ? 'One map away.' : `Major wins: ${majorWins}`,
    };
  }

  if (close) {
    return {
      explanation: `Fell one series short at ${stageLabel}.`,
      footer: failedStage.outcome === 'grand_final' ? 'One map away.' : `Major wins: ${majorWins}`,
    };
  }

  const statReason = stageStatWeakness(failedStage.stage, players);
  if (statReason) {
    return { explanation: statReason, footer: `Fell at ${stageLabel}` };
  }

  if (weakLink && failedStage.passChance < 40) {
    return {
      explanation: `${weakLink.gamertag} wasn't built for ${stageLabel} pressure.`,
      footer: `Fell at ${stageLabel}`,
    };
  }

  if (failedStage.passChance < 30) {
    return {
      explanation: `Roster rating wasn't high enough to hang at ${stageLabel}.`,
      footer: `Fell at ${stageLabel}`,
    };
  }

  return {
    explanation: `The run ended at ${STAGE_LABELS[failedStage.stage]}.`,
    footer: `Major wins: ${majorWins}`,
  };
}

export function formatPickLine(player: CodPlayer, teamName: string, season: number): string {
  return `${teamName.split(' ').pop()} ${season}: ${player.gamertag}`;
}
