import type { DraftTournamentPhase, HistoricalTeam, TeamTier } from '@/core/types';
import { DRAFT_PHASE_ORDER } from '@/core/types';

const ALL = [...DRAFT_PHASE_ORDER];

const LEGEND_IDS = new Set([
  'skt-2016',
  't1-2017',
  't1-2023',
  'dk-2020',
  'ig-2018',
  'fpx-2019',
  'edg-2021',
  'drx-2022',
  'ssg-2017',
]);

const WEAK_AVERAGE_IDS: Record<string, TeamTier> = {
  'mad-2021': 'average',
  'we-2017': 'average',
  'c9-2018': 'contender',
  'g2-2024': 'contender',
  'rng-2021': 'contender',
  'fnc-2020': 'average',
};

type RawTeam = Omit<HistoricalTeam, 'tier' | 'phases'>;

export function withTeamMeta(team: RawTeam): HistoricalTeam {
  const tier: TeamTier =
    LEGEND_IDS.has(team.id)
      ? 'legend'
      : WEAK_AVERAGE_IDS[team.id] ?? 'contender';

  const phases: DraftTournamentPhase[] =
    tier === 'legend' ? ALL : tier === 'contender' ? ALL : ALL;

  return { ...team, tier, phases };
}
