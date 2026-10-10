import { simulateTournament, type SimulatedTournament } from "./simulate";
import { demoUniverse } from "./universe";

/**
 * The demo tournament calendar, positioned relative to an anchor date (when the demo was seeded),
 * so the featured event is always "upcoming with entries open" on a fresh install.
 * All names are fictional and suffixed "(Demo)".
 */

const DAY = 24 * 3_600_000;

interface CatalogEntry {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  tier: "major" | "tier1" | "other";
  location: string;
  dayOffset: number;
  edgeCases: boolean;
}

export const DEMO_CATALOG: CatalogEntry[] = [
  { id: "demo-harbor-cup", slug: "harbor-cup", name: "Harbor Cup (Demo)", shortName: "Harbor Cup", tier: "tier1", location: "Rotterdam", dayOffset: -30, edgeCases: false },
  { id: "demo-meridian-major", slug: "meridian-major", name: "Meridian Major (Demo)", shortName: "Meridian Major", tier: "major", location: "Lisbon", dayOffset: 2, edgeCases: true },
  { id: "demo-coastline-open", slug: "coastline-open", name: "Coastline Open (Demo)", shortName: "Coastline Open", tier: "tier1", location: "Vancouver", dayOffset: 35, edgeCases: false },
  { id: "demo-winter-clash", slug: "winter-clash", name: "Winter Clash (Demo)", shortName: "Winter Clash", tier: "tier1", location: "Oslo", dayOffset: 60, edgeCases: false },
];

const cache = new Map<string, SimulatedTournament[]>();

export function demoCatalog(anchor: Date): SimulatedTournament[] {
  const key = anchor.toISOString();
  const hit = cache.get(key);
  if (hit) return hit;
  const u = demoUniverse();
  // Events start at 13:00 UTC on their start day.
  const base = new Date(anchor);
  base.setUTCHours(13, 0, 0, 0);
  const sims = DEMO_CATALOG.map((c) =>
    simulateTournament({
      id: c.id,
      slug: c.slug,
      name: c.name,
      shortName: c.shortName,
      tier: c.tier,
      location: c.location,
      seed: `lockin-${c.id}`,
      startAt: new Date(base.getTime() + c.dayOffset * DAY),
      teams: u.teams,
      players: u.players,
      edgeCases: c.edgeCases,
    }),
  );
  cache.set(key, sims);
  return sims;
}
