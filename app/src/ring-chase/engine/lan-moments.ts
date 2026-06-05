import type { CodPlayer, DraftPick, StageId, TournamentRunStep } from '../core/types';
import { STAGE_LABELS } from '../core/types';
import { hashString, mulberry32 } from './rng';

const MAP_NAMES = ['Map 1', 'Map 2', 'Map 3', 'Map 4', 'Map 5'];

const PASS_TEMPLATES = [
  '{player} closes {map} on {mode}.',
  '{player} drops a 30 on {mode}.',
  '{stage} — {player} takes over.',
  '{player} wins the {mode} series.',
  'LAN {player} shows up on {map}.',
  '{player} hits the clutch on {mode}.',
];

const FAIL_TEMPLATES = [
  '{player} chokes {map} on {mode}.',
  '{stage} slips — {player} goes negative.',
  '{player} loses the {mode} breaker.',
  'Momentum dies on {map}. {player} can\'t close.',
  '{player} gets fried on {mode}.',
];

const MODE_BY_STAGE: Record<StageId, string[]> = {
  major1: ['Hardpoint', 'S&D', 'Control'],
  major2: ['S&D', 'Hardpoint', 'Control'],
  major3: ['Hardpoint', 'Control', 'S&D'],
  major4: ['Control', 'Hardpoint', 'S&D'],
  champs: ['S&D', 'Hardpoint', 'Control'],
};

function pickPlayer(players: CodPlayer[], rng: () => number): CodPlayer {
  return players[Math.floor(rng() * players.length)] ?? players[0]!;
}

function fillTemplate(
  template: string,
  player: CodPlayer,
  stage: StageId,
  beatIndex: number,
  mode: string
): string {
  return template
    .replace('{player}', player.gamertag)
    .replace('{stage}', STAGE_LABELS[stage])
    .replace('{map}', MAP_NAMES[beatIndex % MAP_NAMES.length] ?? 'Map 5')
    .replace('{mode}', mode);
}

export function lanMomentForBeat(
  picks: DraftPick[],
  stage: StageId,
  beat: TournamentRunStep,
  beatIndex: number,
  seed: string
): string | null {
  const players = picks.map((p) => p.player);
  if (players.length === 0) return null;

  const rng = mulberry32(hashString(`${seed}-${stage}-${beatIndex}-${beat.label}`));
  const player = pickPlayer(players, rng);
  const modes = MODE_BY_STAGE[stage];
  const mode = modes[beatIndex % modes.length] ?? 'Hardpoint';
  const templates = beat.passed ? PASS_TEMPLATES : FAIL_TEMPLATES;
  const template = templates[Math.floor(rng() * templates.length)] ?? templates[0]!;

  return fillTemplate(template, player, stage, beatIndex, mode);
}
