import { eq } from "drizzle-orm";
import type { Db } from "./db/connect";
import { appSettings } from "./db/schema";

/**
 * The server's notion of "now". In demo mode an offset (moved forward by the demo controls)
 * is added to real time so a whole tournament can be played through in minutes. Every lock,
 * window and scoring decision uses this clock; the client never decides what time it is.
 */

export const isDemoMode = (): boolean => (process.env.DEMO_MODE ?? "true") === "true";

export async function getClockOffset(db: Db): Promise<number> {
  if (!isDemoMode()) return 0;
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, "demo_clock"));
  const v = row?.value as { offsetMs?: number } | undefined;
  return v?.offsetMs ?? 0;
}

export async function now(db: Db): Promise<Date> {
  return new Date(Date.now() + (await getClockOffset(db)));
}

export async function setClockOffset(db: Db, offsetMs: number): Promise<void> {
  await db
    .insert(appSettings)
    .values({ key: "demo_clock", value: { offsetMs } })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: { offsetMs } } });
}

export async function getSetting<T>(db: Db, key: string): Promise<T | undefined> {
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, key));
  return row?.value as T | undefined;
}

export async function setSetting(db: Db, key: string, value: unknown): Promise<void> {
  await db
    .insert(appSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: appSettings.key, set: { value } });
}
