/** External Esports games site (Ring Chase, Golden Road). Set VITE_ESPORTS_URL on Vercel. */
export const ESPORTS_URL =
  import.meta.env.VITE_ESPORTS_URL ?? 'https://github.com/SkyHuddle/Esports';

export const RING_CHASE_URL = `${ESPORTS_URL.replace(/\/$/, '')}/ring-chase`;
export const GOLDEN_ROAD_URL = `${ESPORTS_URL.replace(/\/$/, '')}/golden-road`;
