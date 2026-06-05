/**
 * Curated team-year stats for slots where BreakingPoint has no season data.
 * Audited against known placements / era strength — re-run ETL after edits.
 */
export interface EstimatedSlotOverride {
  kd: number;
  bpRating: number;
  maps: number;
  overall?: number;
  note: string;
}

export const ESTIMATED_SLOT_OVERRIDES: Record<string, EstimatedSlotOverride> = {
  'eunited-2019:sib': { kd: 1.04, bpRating: 1.02, maps: 95, note: 'BO4 bench → starter mid-season' },
  'col-2014:aches': { kd: 1.08, bpRating: 1.06, maps: 180, note: 'Ghosts coL dynasty AR' },
  'col-2014:teepee': { kd: 1.05, bpRating: 1.04, maps: 180, note: 'Ghosts OBJ anchor' },
  'col-2014:crimsix-col': { kd: 1.12, bpRating: 1.08, maps: 180, note: 'Ghosts coL flex' },
  'col-2014:proofy': { kd: 1.02, bpRating: 1.0, maps: 160, note: 'Ghosts coL AR' },
  'fariko-2013:crowder': { kd: 0.98, bpRating: 0.98, maps: 120, note: 'BO2 Fariko coach/IGL' },
  'fariko-2013:parasite': { kd: 1.0, bpRating: 0.99, maps: 120, note: 'BO2 Champs IGL' },
  'fariko-2013:xposed': { kd: 1.06, bpRating: 1.03, maps: 120, note: 'BO2 SMG slayer' },
  'fariko-2013:apathy': { kd: 1.04, bpRating: 1.02, maps: 115, note: 'BO2 flex' },
  'envy-2016:formal-envy': { kd: 1.1, bpRating: 1.07, maps: 200, note: 'BO3 Envy AR' },
  'envy-2016:karma-envy': { kd: 1.02, bpRating: 1.01, maps: 200, note: 'BO3 Envy flex' },
  'envy-2016:scump-envy': { kd: 1.08, bpRating: 1.05, maps: 200, note: 'BO3 Envy SMG' },
  'envy-2016:apathy': { kd: 1.03, bpRating: 1.01, maps: 195, note: 'BO3 Envy flex' },
  'rise-2018:hicksy': { kd: 1.01, bpRating: 1.0, maps: 140, note: 'WWII Rise SMG' },
  'rise-2018:diamondcon': { kd: 0.99, bpRating: 0.98, maps: 130, note: 'WWII Rise SMG' },
  'ultra-2021:hicksy': { kd: 0.97, bpRating: 0.98, maps: 80, note: 'CW Ultra fill' },
  '100t-2019:nadeshot': { kd: 0.92, bpRating: 0.94, maps: 60, note: 'BO4 100T founder AR' },
  'splyce-2017:abe': { kd: 0.98, bpRating: 0.97, maps: 200, note: 'IW Splyce flex' },
  'optic-2014:formal': { kd: 1.06, bpRating: 1.04, maps: 170, note: 'Ghosts OpTic AR' },
  'optic-2014:crimsix': { kd: 1.08, bpRating: 1.05, maps: 170, note: 'Ghosts OpTic flex' },
  'optic-2014:scump': { kd: 1.1, bpRating: 1.06, maps: 170, note: 'Ghosts OpTic SMG' },
  'optic-2014:bigt': { kd: 0.96, bpRating: 0.97, maps: 150, note: 'Ghosts OpTic flex' },
  'optic-2016:formal': { kd: 1.08, bpRating: 1.05, maps: 220, note: 'BO3 OpTic AR' },
  'optic-2016:crimsix': { kd: 1.06, bpRating: 1.04, maps: 220, note: 'BO3 OpTic flex' },
  'optic-2016:scump': { kd: 1.12, bpRating: 1.07, maps: 220, note: 'BO3 OpTic SMG peak' },
  'optic-2016:karma': { kd: 1.0, bpRating: 1.0, maps: 220, note: 'BO3 OpTic flex' },
  'faze-2018:replays': { kd: 0.97, bpRating: 0.98, maps: 140, note: 'WWII FaZe flex' },
  'seattle-2023:lunarz': { kd: 0.95, bpRating: 0.96, maps: 45, note: 'MWII Surge fill' },
  'toronto-2022:feelo': { kd: 0.96, bpRating: 0.97, maps: 40, note: 'VG Ultra SMG' },
  'minnesota-2020:ghosty': { kd: 1.0, bpRating: 1.0, maps: 90, note: 'MW ROKKR SMG' },
  'optic-2015:formal': { kd: 1.07, bpRating: 1.05, maps: 190, note: 'AW OpTic AR' },
  'optic-2015:crimsix': { kd: 1.05, bpRating: 1.03, maps: 190, note: 'AW OpTic flex' },
  'optic-2015:scump': { kd: 1.11, bpRating: 1.06, maps: 190, note: 'AW OpTic SMG' },
  'optic-2015:morph': { kd: 1.02, bpRating: 1.0, maps: 180, note: 'AW OpTic SMG' },
  'london-2024:nexus': { kd: 0.94, bpRating: 0.95, maps: 50, note: 'MWIII Ravens flex' },
  'london-2024:reality': { kd: 0.93, bpRating: 0.94, maps: 55, note: 'MWIII Ravens AR' },
  'optic-2022:enable': { kd: 1.0, bpRating: 1.0, maps: 100, note: 'VG OpTic flex' },
  'lg-2016:classic': { kd: 1.04, bpRating: 1.03, maps: 200, note: 'BO3 LG Champs AR' },
  'lg-2016:slasher': { kd: 1.02, bpRating: 1.01, maps: 200, note: 'BO3 LG Champs flex' },
  'lg-2016:tjhaly': { kd: 1.05, bpRating: 1.03, maps: 200, note: 'BO3 LG Champs SMG' },
  'lg-2016:john': { kd: 1.03, bpRating: 1.02, maps: 200, note: 'BO3 LG Champs flex' },
  'rise-2016:gunless': { kd: 1.04, bpRating: 1.02, maps: 180, note: 'BO3 Rise AR' },
  'rise-2016:loony': { kd: 1.0, bpRating: 0.99, maps: 180, note: 'BO3 Rise IGL' },
  'rise-2016:slacked': { kd: 1.01, bpRating: 1.0, maps: 180, note: 'BO3 Rise SMG' },
  'rise-2016:ricky': { kd: 0.98, bpRating: 0.98, maps: 175, note: 'BO3 Rise flex' },
};
