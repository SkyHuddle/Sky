import type { CodPlayer, StageId } from '../core/types';

function avg(players: CodPlayer[], key: keyof CodPlayer['ratings']): number {
  if (players.length === 0) return 0;
  return players.reduce((s, p) => s + p.ratings[key], 0) / players.length;
}

function compress(raw: number): number {
  const knee = 78;
  if (raw <= knee) return raw;
  return knee + (raw - knee) * 0.6;
}

export function computeRosterScore(players: CodPlayer[]): number {
  if (players.length === 0) return 0;
  const raw =
    avg(players, 'overall') * 0.3 +
    avg(players, 'slaying') * 0.15 +
    avg(players, 'snd') * 0.15 +
    avg(players, 'respawn') * 0.15 +
    avg(players, 'objective') * 0.1 +
    avg(players, 'clutch') * 0.08 +
    avg(players, 'leadership') * 0.07;
  return Math.round(Math.min(99.9, raw) * 10) / 10;
}

export function stageTeamPower(players: CodPlayer[], stage: StageId, chemistryBonus: number): number {
  const base = avg(players, 'overall');
  const snd = avg(players, 'snd');
  const respawn = avg(players, 'respawn');
  const clutch = avg(players, 'clutch');
  const lan = avg(players, 'lan');
  const leadership = avg(players, 'leadership');
  const champ = avg(players, 'championshipFactor');

  let raw: number;
  if (stage === 'champs') {
    raw = base * 0.25 + snd * 0.2 + respawn * 0.2 + clutch * 0.15 + lan * 0.1 + leadership * 0.05 + champ * 0.05;
  } else {
    const majorIdx = stage === 'major1' ? 0 : stage === 'major2' ? 1 : stage === 'major3' ? 2 : 3;
    const respawnWeight = majorIdx % 2 === 0 ? 0.25 : 0.2;
    const sndWeight = majorIdx % 2 === 1 ? 0.25 : 0.2;
    raw =
      base * 0.3 +
      respawn * respawnWeight +
      snd * sndWeight +
      avg(players, 'objective') * 0.12 +
      clutch * 0.08 +
      leadership * 0.05;
  }

  const weakest = Math.min(...players.map((p) => p.ratings.overall));
  // 82-0 / 20-0 weak-link drag: one trap-card pick tanks the whole run.
  const weakDrag =
    weakest < 80 ? (80 - weakest) * 0.7 : weakest < 84 ? (84 - weakest) * 0.35 : 0;

  return compress(raw + chemistryBonus - weakDrag);
}

export function findMvp(players: CodPlayer[]): CodPlayer {
  return players.reduce((best, p) => (p.ratings.overall > best.ratings.overall ? p : best));
}

export function findWeakLink(players: CodPlayer[]): CodPlayer | null {
  if (players.length < 2) return null;
  const sorted = [...players].sort((a, b) => a.ratings.overall - b.ratings.overall);
  const weakest = sorted[0];
  if (weakest.ratings.overall >= 88) return null;
  return weakest;
}
