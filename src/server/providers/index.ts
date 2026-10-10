import type { Db } from "../db/connect";
import { getSetting, setSetting } from "../clock";
import { DemoProvider } from "./demo/adapter";
import { PandaScoreProvider } from "./pandascore/adapter";
import type { ProviderAdapter } from "./types";

/**
 * Selects the data provider from DATA_PROVIDER. Credentials are read here, on the server only,
 * and never sent to the client.
 */
export async function getProvider(db: Db): Promise<ProviderAdapter> {
  const key = process.env.DATA_PROVIDER ?? "demo";
  if (key === "pandascore") {
    return new PandaScoreProvider(process.env.PANDASCORE_API_TOKEN ?? "");
  }
  if (key !== "demo") throw new Error(`Unknown DATA_PROVIDER "${key}"`);
  let anchor = await getSetting<{ iso: string }>(db, "demo_anchor");
  if (!anchor) {
    const d = new Date();
    d.setUTCMinutes(0, 0, 0);
    anchor = { iso: d.toISOString() };
    await setSetting(db, "demo_anchor", anchor);
  }
  return new DemoProvider(new Date(anchor.iso));
}
