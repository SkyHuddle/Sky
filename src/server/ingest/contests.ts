import { and, asc, desc, eq, inArray, isNull, min } from "drizzle-orm";
import { runAutopilot } from "@/domain/autopilot";
import { CS2_DEFAULT_RULES } from "@/domain/scoring/cs2";
import { DEFAULT_CS2_CONTEST_RULES, type ContestRules } from "@/domain/types";
import type { Db } from "../db/connect";
import * as s from "../db/schema";
import { newId } from "../ids";
import { computePrices } from "./pricing";
import { ruleSetById } from "./score";

/**
 * Contest lifecycle (docs/04 "Majors: two contests", docs/09 CO-1, CO-5..CO-8):
 *   ensureContests  — creates contests, windows and prices for each tournament (once)
 *   advanceContests — time-driven transitions: open a window (freeze pool, carry rosters forward),
 *                     lock a window (Autopilot first), complete, settle.
 * Every transition is decided by the server clock passed in as `now`.
 */

const DAY = 86_400_000;
const SETTLE_DELAY = DAY; // settle 24 h after the last stage ends (docs/04 score states)

interface ContestPlan {
  slug: string;
  name: string;
  tagline: string;
  kind: "main_event" | "full_run" | "standard";
  stagePositions: number[];
}

function plansFor(tier: string): ContestPlan[] {
  if (tier === "major") {
    return [
      {
        slug: "main-event",
        name: "Main Event",
        tagline: "The 16 Stage 3 teams through to the final. All the stars, about a week.",
        kind: "main_event",
        stagePositions: [3, 4],
      },
      {
        slug: "full-run",
        name: "Full Run",
        tagline: "Every stage from Stage 1. More transfers, more decisions, for the dedicated.",
        kind: "full_run",
        stagePositions: [1, 2, 3, 4],
      },
    ];
  }
  return [
    {
      slug: "tournament",
      name: "Tournament Fantasy",
      tagline: "One team for the whole event, with transfers between stages.",
      kind: "standard",
      stagePositions: [1, 2, 3, 4],
    },
  ];
}

export async function ensureContests(db: Db): Promise<string[]> {
  const created: string[] = [];
  const ts = await db.select().from(s.tournaments);
  for (const t of ts) {
    const stageRows = await db.select().from(s.stages).where(eq(s.stages.tournamentId, t.id)).orderBy(asc(s.stages.position));
    if (stageRows.length === 0) continue;
    for (const plan of plansFor(t.tier)) {
      const id = `${t.id}--${plan.slug}`;
      const [exists] = await db.select({ id: s.contests.id }).from(s.contests).where(eq(s.contests.id, id));
      if (exists) continue;
      const rules: ContestRules = DEFAULT_CS2_CONTEST_RULES;
      await db.insert(s.contests).values({
        id,
        tournamentId: t.id,
        slug: plan.slug,
        name: plan.name,
        tagline: plan.tagline,
        kind: plan.kind,
        ruleSetId: CS2_DEFAULT_RULES.id,
        rules,
        status: "upcoming",
        // Entries open two weeks before the event starts.
        opensAt: new Date(t.beginAt.getTime() - 14 * DAY),
      });
      for (const [i, pos] of plan.stagePositions.entries()) {
        const stage = stageRows.find((x) => x.position === pos);
        if (!stage) continue;
        await db.insert(s.contestWindows).values({
          id: `${id}--w${i + 1}`,
          contestId: id,
          stageId: stage.id,
          position: i + 1,
          lockAt: stage.beginAt,
          status: "upcoming",
        });
      }
      const prices = await computePrices(db, t.id, ruleSetById(CS2_DEFAULT_RULES.id));
      if (prices.length) {
        await db.insert(s.playerPrices).values(prices.map((p) => ({ contestId: id, ...p })));
      }
      created.push(id);
    }
  }
  return created;
}

/** Latest roster version for an entry in a window. */
export async function currentRoster(db: Db, entryId: string, windowId: string) {
  const [v] = await db
    .select()
    .from(s.rosterVersions)
    .where(and(eq(s.rosterVersions.entryId, entryId), eq(s.rosterVersions.windowId, windowId)))
    .orderBy(desc(s.rosterVersions.version))
    .limit(1);
  if (!v) return null;
  const sel = await db.select().from(s.rosterSelections).where(eq(s.rosterSelections.rosterVersionId, v.id)).orderBy(asc(s.rosterSelections.slot));
  return { version: v, playerIds: sel.map((x) => x.playerId), prices: new Map(sel.map((x) => [x.playerId, x.price])) };
}

export async function insertRosterVersion(
  db: Db,
  args: {
    entryId: string;
    windowId: string;
    playerIds: string[];
    captainId: string | null;
    source: "user" | "autopilot" | "carry_forward";
    /** Price paid per player (purchase price for kept players, current price for new ones). */
    prices: ReadonlyMap<string, number>;
  },
): Promise<string> {
  const [last] = await db
    .select({ version: s.rosterVersions.version })
    .from(s.rosterVersions)
    .where(and(eq(s.rosterVersions.entryId, args.entryId), eq(s.rosterVersions.windowId, args.windowId)))
    .orderBy(desc(s.rosterVersions.version))
    .limit(1);
  const id = newId();
  await db.insert(s.rosterVersions).values({
    id,
    entryId: args.entryId,
    windowId: args.windowId,
    version: (last?.version ?? 0) + 1,
    captainPlayerId: args.captainId,
    source: args.source,
  });
  if (args.playerIds.length) {
    await db.insert(s.rosterSelections).values(args.playerIds.map((playerId, slot) => ({ rosterVersionId: id, playerId, slot, price: args.prices.get(playerId) ?? 0 })));
  }
  return id;
}

export interface AdvanceSummary {
  opened: string[];
  locked: string[];
  autopilotChanges: number;
  completed: string[];
  settled: string[];
  touchedContests: string[];
}

export async function advanceContests(db: Db, now: Date): Promise<AdvanceSummary> {
  const sum: AdvanceSummary = { opened: [], locked: [], autopilotChanges: 0, completed: [], settled: [], touchedContests: [] };
  // Repeat until stable so a large clock jump processes windows in order.
  for (let pass = 0; pass < 12; pass++) {
    const before = sum.opened.length + sum.locked.length + sum.completed.length + sum.settled.length;
    const contestRows = await db.select().from(s.contests);
    for (const c of contestRows) await advanceContest(db, c, now, sum);
    const after = sum.opened.length + sum.locked.length + sum.completed.length + sum.settled.length;
    if (after === before) break;
  }
  sum.touchedContests = [...new Set(sum.touchedContests)];
  return sum;
}

async function advanceContest(db: Db, c: typeof s.contests.$inferSelect, now: Date, sum: AdvanceSummary) {
  const windows = await db.select().from(s.contestWindows).where(eq(s.contestWindows.contestId, c.id)).orderBy(asc(s.contestWindows.position));
  const stageRows = await db.select().from(s.stages).where(inArray(s.stages.id, windows.map((w) => w.stageId)));
  const stageOf = new Map(stageRows.map((x) => [x.id, x]));
  const rules = c.rules as ContestRules;

  for (const [i, w] of windows.entries()) {
    const stage = stageOf.get(w.stageId)!;
    // Lock time follows the schedule: the earliest scheduled match of the stage (docs/09 CO-5).
    if (w.status === "upcoming" || w.status === "open") {
      const [{ first } = { first: null }] = await db
        .select({ first: min(s.matches.scheduledAt) })
        .from(s.matches)
        .where(eq(s.matches.stageId, stage.id));
      const lockAt = first ? new Date(first) : stage.beginAt;
      if (lockAt.getTime() !== w.lockAt.getTime()) {
        await db.update(s.contestWindows).set({ lockAt }).where(eq(s.contestWindows.id, w.id));
        w.lockAt = lockAt;
      }
    }

    if (w.status === "upcoming") {
      const prev = windows[i - 1];
      const prevDone = !prev || (stageOf.get(prev.stageId)!.status === "completed" && prev.status !== "upcoming" && prev.status !== "open");
      const teamRows = await db.select().from(s.stageTeams).where(eq(s.stageTeams.stageId, stage.id));
      const expected = stage.kind === "swiss" ? 16 : 8;
      if (c.opensAt <= now && prevDone && teamRows.length === expected) {
        await openWindow(db, c, w, teamRows.map((t) => t.teamId), windows[i - 1], now);
        sum.opened.push(w.id);
        sum.touchedContests.push(c.id);
        w.status = "open";
      } else {
        break; // later windows can't open before this one
      }
    }

    if (w.status === "open" && w.lockAt <= now) {
      sum.autopilotChanges += await runWindowAutopilot(db, c, w, rules);
      await db.update(s.contestWindows).set({ status: "locked" }).where(eq(s.contestWindows.id, w.id));
      sum.locked.push(w.id);
      sum.touchedContests.push(c.id);
      w.status = "locked";
    }

    if (w.status === "locked" && stage.status === "completed") {
      await db.update(s.contestWindows).set({ status: "completed" }).where(eq(s.contestWindows.id, w.id));
      sum.completed.push(w.id);
      sum.touchedContests.push(c.id);
      w.status = "completed";
    }
  }

  // Contest status.
  const statuses = windows.map((w) => w.status);
  let status = c.status;
  if (statuses.every((x) => x === "completed")) status = "completed";
  else if (statuses.some((x) => x === "locked" || x === "completed")) status = "live";
  else if (statuses.some((x) => x === "open")) status = "open";
  else status = "upcoming";
  if (status === "completed" && !c.settledAt) {
    const lastStage = stageOf.get(windows[windows.length - 1]!.stageId)!;
    if (now.getTime() >= lastStage.endAt.getTime() + SETTLE_DELAY) {
      await settleContest(db, c.id, now);
      sum.settled.push(c.id);
      sum.touchedContests.push(c.id);
    }
  }
  if (status !== c.status) {
    await db.update(s.contests).set({ status }).where(eq(s.contests.id, c.id));
    sum.touchedContests.push(c.id);
  }
}

async function openWindow(
  db: Db,
  c: typeof s.contests.$inferSelect,
  w: typeof s.contestWindows.$inferSelect,
  teamIds: string[],
  prev: typeof s.contestWindows.$inferSelect | undefined,
  now: Date,
) {
  // Freeze the eligible pool: active, non-stand-in players of the stage's teams, priced across the
  // full range within this pool using history up to now (docs/10, "per-window prices").
  const members = await db
    .select({ playerId: s.playerTeamMemberships.playerId, teamId: s.playerTeamMemberships.teamId })
    .from(s.playerTeamMemberships)
    .innerJoin(s.players, eq(s.players.id, s.playerTeamMemberships.playerId))
    .where(and(isNull(s.playerTeamMemberships.validTo), inArray(s.playerTeamMemberships.teamId, teamIds), eq(s.players.isStandIn, false)));
  const priced = await computePrices(db, c.tournamentId, ruleSetById(c.ruleSetId), { teamIds, before: now });
  const priceOf = new Map(priced.map((p) => [p.playerId, p.price]));
  const pool = members.filter((m) => priceOf.has(m.playerId)).map((m) => ({ playerId: m.playerId, teamId: m.teamId, price: priceOf.get(m.playerId)! }));
  if (pool.length) {
    await db.insert(s.windowPool).values(pool.map((p) => ({ windowId: w.id, ...p }))).onConflictDoNothing();
  }
  // Keep the contest's reference prices current (latest price, recent average) for display,
  // Autopilot tie-breaks and research. Prices paid stay on roster selections.
  for (const p of priced) {
    await db
      .insert(s.playerPrices)
      .values({ contestId: c.id, playerId: p.playerId, price: p.price, avgPoints: p.avgPoints, mapsSampled: p.mapsSampled })
      .onConflictDoUpdate({
        target: [s.playerPrices.contestId, s.playerPrices.playerId],
        set: { price: p.price, avgPoints: p.avgPoints, mapsSampled: p.mapsSampled },
      });
  }
  await db.update(s.contestWindows).set({ status: "open", poolFrozenAt: new Date() }).where(eq(s.contestWindows.id, w.id));

  // Carry every entry's roster forward unchanged; eliminated players stay until replaced.
  if (prev) {
    const es = await db.select().from(s.entries).where(eq(s.entries.contestId, c.id));
    for (const e of es) {
      const r = await currentRoster(db, e.id, prev.id);
      if (!r) continue;
      await insertRosterVersion(db, { entryId: e.id, windowId: w.id, playerIds: r.playerIds, captainId: r.version.captainPlayerId, source: "carry_forward", prices: r.prices });
    }
  }
}

async function runWindowAutopilot(db: Db, c: typeof s.contests.$inferSelect, w: typeof s.contestWindows.$inferSelect, rules: ContestRules): Promise<number> {
  if (w.position === 1) return 0; // first window: everyone built from this pool
  const pool = await db.select().from(s.windowPool).where(eq(s.windowPool.windowId, w.id));
  const prices = await db.select().from(s.playerPrices).where(eq(s.playerPrices.contestId, c.id));
  const avgOf = new Map(prices.map((p) => [p.playerId, p.avgPoints]));
  const es = await db.select().from(s.entries).where(and(eq(s.entries.contestId, c.id), eq(s.entries.autopilot, true)));

  // Ownership in this window (share of entries rostering each player), from current rosters.
  const rosters = new Map<string, { playerIds: string[]; captainId: string | null; prices: Map<string, number> }>();
  const allEntries = await db.select({ id: s.entries.id }).from(s.entries).where(eq(s.entries.contestId, c.id));
  const owned = new Map<string, number>();
  for (const e of allEntries) {
    const r = await currentRoster(db, e.id, w.id);
    if (!r) continue;
    rosters.set(e.id, { playerIds: r.playerIds, captainId: r.version.captainPlayerId, prices: r.prices });
    for (const p of r.playerIds) owned.set(p, (owned.get(p) ?? 0) + 1);
  }
  const total = Math.max(1, rosters.size);
  const candidates = pool.map((p) => ({
    id: p.playerId,
    teamId: p.teamId,
    price: p.price,
    ownership: (owned.get(p.playerId) ?? 0) / total,
    averagePoints: avgOf.get(p.playerId) ?? 0,
  }));

  let changes = 0;
  for (const e of es) {
    const r = rosters.get(e.id);
    if (!r) continue;
    const result = runAutopilot({ playerIds: r.playerIds, captainId: r.captainId, pool: candidates, rules, heldPrices: r.prices });
    if (!result.changed) continue;
    const poolPrice = new Map(pool.map((p) => [p.playerId, p.price]));
    const paid = new Map(result.playerIds.map((id) => [id, r.prices.get(id) ?? poolPrice.get(id) ?? 0]));
    await insertRosterVersion(db, { entryId: e.id, windowId: w.id, playerIds: result.playerIds, captainId: result.captainId, source: "autopilot", prices: paid });
    for (const rep of result.replacements) {
      await db.insert(s.transfers).values({
        id: newId(),
        entryId: e.id,
        windowId: w.id,
        outPlayerId: rep.outPlayerId,
        inPlayerId: rep.inPlayerId,
        kind: "autopilot",
        reason: rep.inPlayerId
          ? "Eliminated player replaced by Autopilot with the most-picked affordable player"
          : "Eliminated player could not be replaced legally; slot left empty",
      });
    }
    await db.insert(s.adminAuditLog).values({
      id: newId(),
      actor: "system",
      action: "autopilot.replace",
      targetType: "entry",
      targetId: e.id,
      reason: `Window ${w.position} locked`,
      before: { playerIds: r.playerIds, captainId: r.captainId },
      after: { playerIds: result.playerIds, captainId: result.captainId, replacements: result.replacements, unfilledSlots: result.unfilledSlots },
    });
    changes++;
  }
  return changes;
}

/** Final settlement: ledger rows for the contest's stages become "settled"; a final snapshot is kept. */
export async function settleContest(db: Db, contestId: string, now: Date): Promise<void> {
  const ws = await db.select().from(s.contestWindows).where(eq(s.contestWindows.contestId, contestId));
  const [c] = await db.select().from(s.contests).where(eq(s.contests.id, contestId));
  if (!c) return;
  await db
    .update(s.scoringEvents)
    .set({ state: "settled" })
    .where(and(eq(s.scoringEvents.ruleSetId, c.ruleSetId), inArray(s.scoringEvents.stageId, ws.map((w) => w.stageId)), isNull(s.scoringEvents.supersededById)));
  await db.update(s.contests).set({ settledAt: now, status: "completed" }).where(eq(s.contests.id, contestId));
  await db.update(s.entries).set({ scoreState: "settled" }).where(eq(s.entries.contestId, contestId));
  await db.insert(s.adminAuditLog).values({
    id: newId(),
    actor: "system",
    action: "contest.settle",
    targetType: "contest",
    targetId: contestId,
    reason: "24 hours after the final stage ended",
  });
}
