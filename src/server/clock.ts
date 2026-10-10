import { eq } from "drizzle-orm";
import type { Db } from "./db/connect";
import { appSettings } from "./db/schema";

/**
 * The server's notion of "now". In demo mode an offset (moved forward by the demo controls)
 * is added to real time so a whole tournament can be played through in minutes. Every lock,
 * window and scoring decision uses this clock; the client never decides what time it is.
 */

export const isDemoMode = (): boolean => (process.env.DEMO_MODE ?? "true") === "true";

interface DemoClock {
  offsetMs?: number;
  /** Replay speed (1 = real time). At 20× a 55-minute map plays out in under three minutes. */
  speed?: number;
  /** Real time (ms) when the speed took effect. */
  sinceReal?: number;
}

async function readClock(db: Db): Promise<DemoClock> {
  if (!isDemoMode()) return {};
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, "demo_clock"));
  return (row?.value as DemoClock | undefined) ?? {};
}

function demoTimeAt(c: DemoClock, real: number): number {
  const speed = c.speed ?? 1;
  const since = c.sinceReal ?? real;
  return real + (c.offsetMs ?? 0) + (speed > 1 ? (real - since) * (speed - 1) : 0);
}

export async function getClockOffset(db: Db): Promise<number> {
  const real = Date.now();
  return demoTimeAt(await readClock(db), real) - real;
}

export async function getClockSpeed(db: Db): Promise<number> {
  return (await readClock(db)).speed ?? 1;
}

export async function now(db: Db): Promise<Date> {
  const real = Date.now();
  return new Date(demoTimeAt(await readClock(db), real));
}

/** Sets the demo clock to `target` (demo time) right now, running at `speed` from here on. */
export async function setDemoClock(db: Db, target: Date, speed = 1): Promise<void> {
  const real = Date.now();
  const value: DemoClock = { offsetMs: target.getTime() - real, speed, sinceReal: real };
  await db
    .insert(appSettings)
    .values({ key: "demo_clock", value })
    .onConflictDoUpdate({ target: appSettings.key, set: { value } });
}

export async function setClockOffset(db: Db, offsetMs: number): Promise<void> {
  await setDemoClock(db, new Date(Date.now() + offsetMs), 1);
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
