import type { CodPlayer, ChemistryReport, CodRole } from '../core/types';

function countRoles(players: CodPlayer[]): Record<CodRole, number> {
  const counts: Record<CodRole, number> = { mainAR: 0, flex: 0, smg: 0 };
  for (const p of players) {
    counts[p.primaryRole] += 1;
  }
  return counts;
}

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

export function evaluateChemistry(players: CodPlayer[]): ChemistryReport {
  const modifiers: string[] = [];
  const issues: string[] = [];
  let score = 0;

  if (players.length < 4) {
    return { score: -5, modifiers, issues: ['Incomplete roster'] };
  }

  const roles = countRoles(players);
  const smgCount = players.filter((p) => p.primaryRole === 'smg' || p.secondaryRole === 'smg').length;

  if (roles.mainAR >= 1) {
    score += 2;
    modifiers.push('True Main AR');
  } else {
    score -= 4;
    issues.push('No true Main AR');
  }

  if (roles.flex >= 1) {
    score += 1.5;
    modifiers.push('Flex presence');
  }

  if (smgCount >= 2) {
    score += 2;
    modifiers.push('SMG duo pressure');
  } else {
    score -= 3;
    issues.push('No true SMG duo');
  }

  if (roles.mainAR >= 3) {
    score -= 4;
    issues.push('Too many Main ARs');
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

  const eras = new Set(players.map((p) => (p.rings > 0 ? 'champ' : 'hungry')));
  if (eras.size === 1 && players.every((p) => p.rings === 0)) {
    score -= 0.5;
    issues.push('No ring experience');
  }

  return {
    score: Math.round(score * 10) / 10,
    modifiers,
    issues,
  };
}
