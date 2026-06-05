import type { CodPlayer, SimulationResult } from '../core/types';

const WIN_LINES = [
  'Perfect role balance.',
  'Elite SMG pressure carried the season.',
  'SnD closed every bracket.',
  'LAN nerves never showed.',
  'Championship DNA won out.',
];

const LOSS_LINES = [
  'SnD sold the run.',
  'Too many stars, not enough dirty work.',
  'No true leader.',
  'Champs pressure exposed the roster.',
  'Main AR gap won the Grand Final.',
  'Too many role conflicts.',
  'Respawn maps buried you.',
  'One map away from a ring.',
];

export function buildExplanation(result: Omit<SimulationResult, 'explanation' | 'footer'>): {
  explanation: string;
  footer: string;
} {
  const { ringWon, perfectSeason, chemistry, champsOutcome, majorWins } = result;

  if (perfectSeason) {
    return {
      explanation: 'Perfect role balance. Untouchable all season.',
      footer: 'PERFECT SEASON',
    };
  }

  if (ringWon) {
    const line = chemistry.modifiers.length > 0 ? chemistry.modifiers[0] : WIN_LINES[0];
    return { explanation: line, footer: 'RING WON' };
  }

  if (champsOutcome === 'grand_final') {
    return {
      explanation: chemistry.issues[0] ?? 'One map away from a ring.',
      footer: 'One map away.',
    };
  }

  if (chemistry.issues.includes('No SnD presence') || chemistry.issues.includes('SnD sold the run')) {
    return { explanation: 'SnD sold the run.', footer: `Major wins: ${majorWins}` };
  }

  if (chemistry.issues.includes('Too many role conflicts') || chemistry.issues.includes('Too many Main ARs')) {
    return { explanation: 'Too many role conflicts.', footer: `Major wins: ${majorWins}` };
  }

  if (chemistry.issues.includes('No leader')) {
    return { explanation: 'No true leader.', footer: `Major wins: ${majorWins}` };
  }

  if (chemistry.issues.includes('No true SMG duo')) {
    return { explanation: 'Elite SMG pressure never showed up.', footer: `Major wins: ${majorWins}` };
  }

  if (majorWins >= 2) {
    return {
      explanation: chemistry.issues[0] ?? 'Champs pressure exposed the roster.',
      footer: 'One map away.',
    };
  }

  const lossLine = chemistry.issues[0] ?? LOSS_LINES[Math.floor(majorWins) % LOSS_LINES.length];
  return { explanation: lossLine, footer: `Major wins: ${majorWins}` };
}

export function formatPickLine(player: CodPlayer, teamName: string, season: number): string {
  return `${teamName.split(' ').pop()} ${season}: ${player.gamertag}`;
}
