import type { NormMatch } from "../providers/types";

/**
 * Validator (docs/06 "Ingestion pipeline"). A match that fails is not stored or scored;
 * the previous valid version stays in place and the failure is logged for an administrator.
 */
export function validateMatch(m: NormMatch): string[] {
  const problems: string[] = [];
  const teams = new Set([m.teamAExternalId, m.teamBExternalId]);
  if (m.teamAExternalId === m.teamBExternalId) problems.push("a team can't play itself");
  if (m.winnerTeamExternalId && !teams.has(m.winnerTeamExternalId)) problems.push("winner is not in the match");
  if (m.maps.length > m.format) problems.push(`more maps (${m.maps.length}) than the format allows (BO${m.format})`);

  for (const g of m.maps) {
    const label = `map ${g.number}`;
    const rounds = Object.values(g.roundsByTeam).reduce((a, b) => a + b, 0);
    if (rounds !== g.roundsPlayed) problems.push(`${label}: rounds played don't match the score`);
    if (!teams.has(g.winnerTeamExternalId)) problems.push(`${label}: winner is not in the match`);
    const won = g.roundsByTeam[g.winnerTeamExternalId] ?? 0;
    const lost = rounds - won;
    if (won <= lost) problems.push(`${label}: winner has fewer rounds than the loser`);
    for (const team of teams) {
      const other = team === m.teamAExternalId ? m.teamBExternalId : m.teamAExternalId;
      const kills = g.stats.filter((x) => x.teamId === team).reduce((a, x) => a + x.kills, 0);
      const deaths = g.stats.filter((x) => x.teamId === other).reduce((a, x) => a + x.deaths, 0);
      if (kills !== deaths) problems.push(`${label}: ${team} kills (${kills}) ≠ opponent deaths (${deaths})`);
      const lineup = g.stats.filter((x) => x.teamId === team).length;
      if (lineup !== 5) problems.push(`${label}: ${team} has ${lineup} players with stats`);
    }
    for (const x of g.stats) {
      const nums = [x.kills, x.deaths, x.assists, x.openingKills];
      if (nums.some((n) => !Number.isInteger(n) || n < 0)) problems.push(`${label}: invalid stat values for ${x.playerId}`);
    }
  }
  if (m.status === "completed") {
    const need = Math.ceil(m.format / 2);
    const wins = new Map<string, number>();
    for (const g of m.maps) wins.set(g.winnerTeamExternalId, (wins.get(g.winnerTeamExternalId) ?? 0) + 1);
    if (!m.winnerTeamExternalId || (wins.get(m.winnerTeamExternalId) ?? 0) !== need) {
      problems.push("completed match result doesn't match its maps");
    }
  }
  return problems;
}
