import type { HistoricalCodTeam } from '../core/types';

export type TeamYearAccomplishment =
  | 'champs_winner'
  | 'champs_finalist'
  | 'major_winner'
  | 'major_finalist'
  | 'contender'
  | 'standard';

export interface AccomplishmentTuning {
  ovrBonus: number;
  floor: number;
}

export const ACCOMPLISHMENT_TUNING: Record<TeamYearAccomplishment, AccomplishmentTuning> = {
  champs_winner: { ovrBonus: 2, floor: 82 },
  champs_finalist: { ovrBonus: 1, floor: 80 },
  major_winner: { ovrBonus: 1, floor: 78 },
  major_finalist: { ovrBonus: 0, floor: 76 },
  contender: { ovrBonus: 0, floor: 74 },
  standard: { ovrBonus: 0, floor: 72 },
};

export function accomplishmentFromTeam(team: HistoricalCodTeam): TeamYearAccomplishment {
  if (team.isChampsWinner) return 'champs_winner';

  const placement = team.placement.toLowerCase();
  const champs = team.champsPlacement.toLowerCase();

  if (champs.includes('grand final') || champs.includes('runner')) return 'champs_finalist';
  if (placement.includes('champs winner')) return 'champs_winner';
  if (team.majorWins > 0 || placement.includes('major winner')) return 'major_winner';
  if (placement.includes('finalist')) return 'major_finalist';
  if (champs.includes('top 4') || champs.includes('top 3') || champs.includes('top 6')) {
    return 'contender';
  }
  if (
    placement.includes('missed') ||
    champs.includes('top 8') ||
    champs.includes('top 10') ||
    champs.includes('top 12')
  ) {
    return 'standard';
  }

  return 'standard';
}

export function getAccomplishmentTuning(team: HistoricalCodTeam): AccomplishmentTuning {
  return ACCOMPLISHMENT_TUNING[accomplishmentFromTeam(team)];
}

export interface CardCredentials {
  season: number;
  ringsThisYear: number;
  majorsThisYear: number;
  headline: string;
  detail: string;
}

/** That-year rings + placement — not career totals */
export function getCardCredentials(team: HistoricalCodTeam): CardCredentials {
  const ringsThisYear = team.isChampsWinner ? 1 : 0;
  const majorsThisYear = team.majorWins;

  let headline: string;
  if (team.isChampsWinner) {
    headline = `${team.season} Champs Winner`;
  } else if (team.majorWins > 0) {
    headline = `${team.season} · ${team.majorWins} Major${team.majorWins > 1 ? 's' : ''} Won`;
  } else {
    headline = `${team.season} · ${team.placement}`;
  }

  const detail =
    team.isChampsWinner
      ? 'Won Champs'
      : team.majorWins > 0
        ? `${team.majorWins} major${team.majorWins > 1 ? 's' : ''} · ${team.champsPlacement}`
        : team.champsPlacement;

  return { season: team.season, ringsThisYear, majorsThisYear, headline, detail };
}
