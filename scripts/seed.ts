/**
 * Seeds the demonstration world by replaying history through the REAL pipeline:
 *   1. Harbor Cup (Demo), a completed event 30 days ago, played window by window with bot managers,
 *      so prices, profiles and history come from actual scoring rather than fabricated numbers.
 *   2. The current clock: Meridian Major (Demo) opens for entries.
 * Usage: npm run db:seed   (DATABASE_URL selects Postgres; otherwise embedded PGlite in .data/)
 */
import path from "node:path";
import { asc, eq } from "drizzle-orm";
import { createDatabase } from "../src/server/db/connect";
import * as s from "../src/server/db/schema";
import { setClockOffset, setSetting } from "../src/server/clock";
import { demoTick, ensureBots, ensureDemoUser, runBots } from "../src/server/services/demo";
import { saveEntry } from "../src/server/services/entries";

const H = 3_600_000;

async function main() {
  process.env.DEMO_MODE ??= "true";
  const db = await createDatabase({
    url: process.env.DATABASE_URL,
    pgliteDir: path.join(process.cwd(), ".data", "pglite"),
    migrate: true,
  });
  const anchor = new Date();
  anchor.setUTCMinutes(0, 0, 0);
  await setSetting(db, "demo_anchor", { iso: anchor.toISOString() });
  await setClockOffset(db, 0);

  await ensureBots(db);
  const demoUserId = await ensureDemoUser(db);

  // 1. History: Harbor Cup. First tick creates everything; then step through its timeline.
  const t0 = Date.now();
  await demoTick(db, new Date(anchor.getTime() - 40 * 24 * H));
  const [harbor] = await db.select().from(s.tournaments).where(eq(s.tournaments.slug, "harbor-cup"));
  if (!harbor) throw new Error("Harbor Cup not ingested");
  const stages = await db.select().from(s.stages).where(eq(s.stages.tournamentId, harbor.id)).orderBy(asc(s.stages.position));

  // Before Stage 1: entries open. The demo account enters too, so its profile has real history.
  const beforeStart = new Date(harbor.beginAt.getTime() - 12 * H);
  await demoTick(db, beforeStart);
  await enterDemoUser(db, demoUserId, `${harbor.id}--tournament`, beforeStart);

  for (const st of stages) {
    const at = new Date(st.endAt.getTime() + H);
    await demoTick(db, at);
    await runBots(db, at);
    console.log(`  ${harbor.shortName}: ${st.name} played`);
  }
  await demoTick(db, new Date(stages[stages.length - 1]!.endAt.getTime() + 25 * H));
  console.log(`  ${harbor.shortName}: settled`);

  // 2. Present: the featured event opens for entries.
  await demoTick(db, new Date());
  const counts = await db.select({ id: s.entries.id }).from(s.entries);
  console.log(`Seeded in ${((Date.now() - t0) / 1000).toFixed(1)}s: ${counts.length} entries. Demo login: demo / lockin-demo`);
  process.exit(0);
}

async function enterDemoUser(db: Awaited<ReturnType<typeof createDatabase>>, userId: string, contestId: string, at: Date) {
  const [contest] = await db.select().from(s.contests).where(eq(s.contests.id, contestId));
  if (!contest) return;
  const w = await db.select().from(s.windowPool).where(eq(s.windowPool.windowId, `${contest.id}--w1`));
  // A sensible balanced team: two mid-priced players from different teams, three value picks.
  const byPrice = [...w].sort((a, b) => b.price - a.price);
  const picks: typeof w = [];
  const teamCount = new Map<string, number>();
  let budget = 1_000_000;
  for (const p of [...byPrice.slice(6, 40), ...byPrice.slice(40).reverse()]) {
    if (picks.length === 5) break;
    const left = 5 - picks.length - 1;
    if ((teamCount.get(p.teamId) ?? 0) >= 1 || budget - p.price < left * 100_000) continue;
    picks.push(p);
    teamCount.set(p.teamId, 1);
    budget -= p.price;
  }
  if (picks.length === 5) {
    await saveEntry(db, { userId, contestId: contest.id, playerIds: picks.map((p) => p.playerId), captainId: picks[0]!.playerId, autopilot: true }, at);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
