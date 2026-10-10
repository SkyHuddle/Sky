import type { NormTournament, ProviderAdapter } from "../types";

/**
 * PandaScore adapter: NOT YET CONNECTED.
 *
 * This session's network policy blocks pandascore.co, so no request has ever been made or verified.
 * The adapter exists so the provider boundary is real: implementing `fetchTournaments` (map PandaScore
 * tournaments/stages/matches/games and per-game player stats onto the Norm* types) is the only change
 * needed to switch the whole app to licensed data. Until then it fails loudly rather than returning
 * anything that could be mistaken for real data.
 *
 * Open questions before implementing (docs/08): which CS2 fields the licensed plan includes (opening
 * kills, multi-kill rounds, clutches → otherwise contests must pin the cs2-basic rule set), and whether
 * the "non-betting" stats plan covers fantasy with sponsored prizes.
 */
export class PandaScoreProvider implements ProviderAdapter {
  readonly key = "pandascore";
  readonly isDemo = false;

  constructor(private readonly token: string) {}

  async fetchTournaments(_now: Date): Promise<NormTournament[]> {
    if (!this.token) throw new Error("PANDASCORE_API_TOKEN is not set");
    throw new Error("The PandaScore adapter is not implemented yet. Use DATA_PROVIDER=demo.");
  }
}
