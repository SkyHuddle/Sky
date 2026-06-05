/** That-year team result — used to tune OVR beyond raw split stats */

export type TeamYearAccomplishment =
  | 'worlds_champion'
  | 'worlds_finalist'
  | 'msi_champion'
  | 'worlds_semis'
  | 'msi_finalist'
  | 'domestic'
  | 'standard';

export interface AccomplishmentTuning {
  /** Added to stat-based OVR */
  bonus: number;
  /** Minimum OVR for any player on this team-year */
  floor: number;
  /** Extra international rating */
  intlBonus: number;
}

export const ACCOMPLISHMENT_TUNING: Record<TeamYearAccomplishment, AccomplishmentTuning> = {
  worlds_champion: { bonus: 5, floor: 74, intlBonus: 4 },
  worlds_finalist: { bonus: 3, floor: 72, intlBonus: 3 },
  msi_champion: { bonus: 2, floor: 71, intlBonus: 2 },
  worlds_semis: { bonus: 1, floor: 69, intlBonus: 2 },
  msi_finalist: { bonus: 1, floor: 68, intlBonus: 1 },
  domestic: { bonus: 0, floor: 65, intlBonus: 0 },
  standard: { bonus: 0, floor: 52, intlBonus: 0 },
};

export function accomplishmentFromTagline(tagline: string): TeamYearAccomplishment {
  const t = tagline.toLowerCase();

  if (/world champion|back-to-back worlds/.test(t)) return 'worlds_champion';
  if (/world finalist/.test(t)) return 'worlds_finalist';
  if (/msi champion/.test(t)) return 'msi_champion';
  if (/world semifinal|worlds semifinal/.test(t)) return 'worlds_semis';
  if (/msi finalist|msi runners-up|msi runner-up/.test(t)) return 'msi_finalist';
  if (
    /world quarterfinal|fourth at worlds|lec dynasty|lck runners-up|playoff bubble/.test(t)
  ) {
    return 'domestic';
  }

  return 'standard';
}

export const ACCOMPLISHMENT_LABEL: Record<TeamYearAccomplishment, string> = {
  worlds_champion: 'World Champions',
  worlds_finalist: 'World Finalists',
  msi_champion: 'MSI Champions',
  worlds_semis: 'World Semifinalists',
  msi_finalist: 'MSI Finalists',
  domestic: 'International Contenders',
  standard: '',
};
