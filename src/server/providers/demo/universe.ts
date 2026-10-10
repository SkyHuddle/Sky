import { Rng } from "@/domain/random";

/**
 * The demonstration universe: 32 FICTIONAL teams and 160 FICTIONAL players.
 * No real organisations, players or likenesses. Everything generated here is labelled
 * "Demo data" in the UI and must never be presented as official tournament information.
 */

export type DemoRole = "AWPer" | "Entry" | "Rifler" | "Support" | "IGL";

export interface DemoTeamSeed {
  id: string;
  name: string;
  acronym: string;
  color: string;
  country: string;
  /** Underlying strength used by the simulator only (never shown). */
  strength: number;
}

export interface DemoPlayerSeed {
  id: string;
  nickname: string;
  firstName: string;
  lastName: string;
  nationality: string;
  role: DemoRole;
  teamId: string;
  skill: number;
  isStandIn: boolean;
}

const TEAMS: Array<[string, string, string, string]> = [
  ["Northwind", "NWD", "#4F8CFF", "SE"],
  ["Vanta", "VNT", "#B9C3D3", "FR"],
  ["Ironclad", "IRC", "#E2655B", "PL"],
  ["Solstice", "SOL", "#F2B33D", "BR"],
  ["Kestrel", "KST", "#3FC1A5", "DK"],
  ["Halcyon", "HLC", "#8C7CF0", "UA"],
  ["Obsidian", "OBS", "#7E8AA0", "FI"],
  ["Meridian Five", "MRD", "#4DB6E8", "DE"],
  ["Cobalt Union", "CBU", "#3D6BE0", "US"],
  ["Ember Row", "EMR", "#F07A3C", "GB"],
  ["Polaris", "PLR", "#6FD3F2", "NO"],
  ["Ravenmark", "RVM", "#9A5BD6", "CZ"],
  ["Glasshouse", "GLH", "#7FD1C1", "NL"],
  ["Tidewater", "TDW", "#2FA4C9", "AU"],
  ["Quarry", "QRY", "#C8A26B", "RS"],
  ["Arclight", "ARC", "#E5D35A", "KZ"],
  ["Lumen", "LMN", "#F5E6A8", "PT"],
  ["Saltmarsh", "SLT", "#86B3A0", "EE"],
  ["Foxglove", "FXG", "#D1679B", "LV"],
  ["Brightline", "BRT", "#56C271", "AR"],
  ["Highmoor", "HMR", "#A3B86C", "SK"],
  ["Driftwood", "DFT", "#B98A5E", "CA"],
  ["Juniper", "JNP", "#5BAF8F", "LT"],
  ["Monolith", "MNL", "#9AA3AE", "TR"],
  ["Orchid", "ORC", "#C38DE0", "MN"],
  ["Wildcard", "WLD", "#E6614F", "CL"],
  ["Granite", "GRN", "#8F98A3", "BG"],
  ["Static Bloom", "STB", "#E88BC2", "JP"],
  ["Copperline", "CPL", "#D98952", "ZA"],
  ["Nova Reach", "NVR", "#6C8DFF", "IL"],
  ["Bluefin", "BFN", "#3E86C7", "MX"],
  ["Thornfield", "THF", "#7BAA5B", "HU"],
];

const HANDLE_A = ["ka", "ze", "vo", "ri", "mo", "sy", "lu", "da", "fe", "no", "ty", "qu", "bry", "sko", "ex", "ju", "pa", "ce", "vi", "or", "ha", "nim", "tal", "yu", "glo", "ark", "wen", "sol", "kip", "dre"];
const HANDLE_B = ["rn", "x", "ko", "va", "lt", "zy", "ro", "mi", "dk", "sh", "ne", "ra", "ix", "tu", "ly", "pe", "on", "ek", "ss", "do"];
const FIRST = ["Aleksi", "Bram", "Caio", "Dawid", "Emil", "Filip", "Gustav", "Hugo", "Ivan", "Jonas", "Kacper", "Lukas", "Marek", "Nikolai", "Oskar", "Pavel", "Rafael", "Sander", "Tomas", "Viktor", "Wiktor", "Yannick", "Zane", "Mateo", "Elias", "Noah", "Leon", "Arvid", "Milo", "Teo"];
const LAST = ["Halvorsen", "Kowal", "Duarte", "Lind", "Varga", "Novak", "Moreau", "Brandt", "Sato", "Petrov", "Ramos", "Eklund", "Horvat", "Nieminen", "Fischer", "Costa", "Jansen", "Kral", "Weiss", "Larsen", "Basu", "Olsen", "Ferreira", "Marin", "Szabo", "Lehto", "Quinn", "Adler", "Vidal", "Okafor"];
const ROLES: DemoRole[] = ["AWPer", "Entry", "Rifler", "Support", "IGL"];
const ROLE_SKILL: Record<DemoRole, number> = { AWPer: 0.05, Entry: 0.01, Rifler: 0.03, Support: -0.03, IGL: -0.06 };

export interface DemoUniverse {
  teams: DemoTeamSeed[];
  players: DemoPlayerSeed[];
}

let cached: DemoUniverse | null = null;

/** Deterministic: always produces the same universe. Teams are ordered by seed (index 0 = best). */
export function demoUniverse(): DemoUniverse {
  if (cached) return cached;
  const rng = new Rng("lockin-demo-universe-v1");
  const teams: DemoTeamSeed[] = TEAMS.map(([name, acronym, color, country], i) => ({
    id: `demo-team-${acronym.toLowerCase()}`,
    name,
    acronym,
    color,
    country,
    // Seed 1 ≈ 1.10, seed 32 ≈ 0.90, with a little noise so seeding isn't perfectly predictive.
    strength: 1.1 - (i / 31) * 0.2 + (rng.next() - 0.5) * 0.03,
  }));

  const used = new Set<string>();
  const players: DemoPlayerSeed[] = [];
  for (const team of teams) {
    for (const role of ROLES) {
      let nickname = "";
      do {
        nickname = rng.pick(HANDLE_A) + rng.pick(HANDLE_B) + (rng.chance(0.15) ? String(rng.int(1, 9)) : "");
      } while (used.has(nickname) || nickname.length < 3);
      used.add(nickname);
      players.push({
        id: `demo-player-${nickname}`,
        nickname,
        firstName: rng.pick(FIRST),
        lastName: rng.pick(LAST),
        nationality: rng.chance(0.7) ? team.country : rng.pick(TEAMS)[3],
        role,
        teamId: team.id,
        skill: team.strength + ROLE_SKILL[role] + (rng.next() - 0.5) * 0.08,
        isStandIn: false,
      });
    }
  }
  cached = { teams, players };
  return cached;
}
