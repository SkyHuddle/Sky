import type { CodPlayer, ChemistryReport, DraftPick } from '../core/types';

function hasLeader(players: CodPlayer[]): boolean {
  return players.some((p) => p.ratings.leadership >= 88);
}

function hasEliteSnd(players: CodPlayer[]): boolean {
  return players.some((p) => p.ratings.snd >= 90);
}

function hasEliteRespawn(players: CodPlayer[]): boolean {
  return players.some((p) => p.ratings.respawn >= 90);
}

function teammateSynergy(players: CodPlayer[]): number {
  const orgs = players.map((p) => p.organization);
  const clusters = new Map<string, number>();
  for (const o of orgs) clusters.set(o, (clusters.get(o) ?? 0) + 1);
  const max = Math.max(...clusters.values());
  if (max >= 3) return 2;
  if (max >= 2) return 1;
  return 0;
}

/** Chemistry uses drafted lineup slots, not player card primary roles */
export function evaluateChemistry(picks: DraftPick[]): ChemistryReport {
  const modifiers: string[] = [];
  const issues: string[] = [];
  let score = 0;
  const players = picks.map((p) => p.player);

  if (picks.length < 4) {
    return { score: -5, modifiers, issues: ['Incomplete roster'] };
  }

  const hasMainAr = picks.some((p) => p.role === 'mainAR');
  const hasFlex = picks.some((p) => p.role === 'flex');
  const smgSlots = picks.filter((p) => p.role === 'smg' || p.role === 'smg2').length;

  if (hasMainAr) {
    score += 2;
    modifiers.push('True Main AR');
  } else {
    score -= 4;
    issues.push('No true Main AR');
  }

  if (hasFlex) {
    score += 1.5;
    modifiers.push('Flex presence');
  }

  if (smgSlots >= 2) {
    score += 2;
    modifiers.push('SMG duo pressure');
  } else {
    score -= 3;
    issues.push('No true SMG duo');
  }

  if (hasLeader(players)) {
    score += 2;
    modifiers.push('Proven leader');
  } else {
    score -= 2;
    issues.push('No leader');
  }

  if (hasEliteSnd(players)) {
    score += 1.5;
    modifiers.push('Elite SnD');
  } else {
    score -= 1;
    issues.push('No SnD presence');
  }

  if (hasEliteRespawn(players)) {
    score += 1.5;
    modifiers.push('Elite respawn');
  }

  const avgPace = players.reduce((s, p) => s + p.ratings.pace, 0) / players.length;
  if (avgPace >= 90) {
    score += 1;
    modifiers.push('High pace');
  } else if (avgPace < 82) {
    score -= 1.5;
    issues.push('Too slow');
  }

  const avgLan = players.reduce((s, p) => s + p.ratings.lan, 0) / players.length;
  if (avgLan >= 88) {
    score += 1;
    modifiers.push('LAN experience');
  } else if (avgLan < 80) {
    score -= 1;
    issues.push('Low LAN experience');
  }

  const ringCount = players.reduce((s, p) => s + p.rings, 0);
  if (ringCount >= 6) {
    score += 1.5;
    modifiers.push('Championship experience');
  }

  const synergy = teammateSynergy(players);
  if (synergy > 0) {
    score += synergy;
    modifiers.push('Org synergy');
  }

  const slayerCount = players.filter((p) => p.ratings.slaying >= 93).length;
  if (slayerCount >= 3 && !hasEliteSnd(players)) {
    score -= 2;
    issues.push('Too many ego slayers');
  }

  if (players.every((p) => p.rings === 0)) {
    score -= 0.5;
    issues.push('No ring experience');
  }

  return {
    score: Math.round(score * 10) / 10,
    modifiers,
    issues,
  };
}
