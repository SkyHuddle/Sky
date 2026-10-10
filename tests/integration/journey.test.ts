import { beforeAll, describe, expect, it } from "vitest";
import { and, asc, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { createDatabase, type Db } from "@/server/db/connect";
import * as s from "@/server/db/schema";
import { setSetting } from "@/server/clock";
import { createSession, signIn, signUp, userForToken } from "@/server/auth/session";
import { demoTick, ensureBots } from "@/server/services/demo";
import { saveEntry } from "@/server/services/entries";
import { createLeague, getInvite, joinLeague } from "@/server/services/leagues";
import { getBoard } from "@/server/services/leaderboards";
import { rescoreStage } from "@/server/ingest/score";
import { builderData, entryDashboard } from "@/server/queries/contest";
import { profileByUsername } from "@/server/queries/people";
import { isAppError } from "@/server/errors";

/**
 * End-to-end gameplay through the real services and pipeline on an in-memory PostgreSQL (PGlite).
 * Covers docs/09's acceptance journey at the service level, including the edge cases from
 * docs/04: lock enforcement, transfers, Autopilot, a stats correction and settlement.
 */

const H = 3_600_000;
const ANCHOR = new Date("2030-03-01T00:00:00Z");
let db: Db;
let alice: string;
let bob: string;
const FULL_RUN = "demo-meridian-major--full-run";

async function expectCode(p: Promise<unknown>, code: string) {
  try {
    await p;
  } catch (e) {
    expect(isAppError(e) ? e.code : String(e)).toBe(code);
    return e;
  }
  throw new Error(`expected ${code}`);
}

async function stages() {
  return db.select().from(s.stages).where(eq(s.stages.tournamentId, "demo-meridian-major")).orderBy(asc(s.stages.position));
}

/** A valid, cheap-ish roster from a window pool, avoiding given players. */
async function pickRoster(windowId: string, avoid: string[] = [], maxPerTeam = 2) {
  const pool = await db.select().from(s.windowPool).where(eq(s.windowPool.windowId, windowId));
  const sorted = pool.filter((p) => !avoid.includes(p.playerId)).sort((a, b) => a.price - b.price || a.playerId.localeCompare(b.playerId));
  const picks: typeof pool = [];
  const per = new Map<string, number>();
  for (const p of sorted) {
    if (picks.length === 5) break;
    if ((per.get(p.teamId) ?? 0) >= maxPerTeam) continue;
    picks.push(p);
    per.set(p.teamId, (per.get(p.teamId) ?? 0) + 1);
  }
  return picks;
}

beforeAll(async () => {
  process.env.DEMO_MODE = "true";
  process.env.DATA_PROVIDER = "demo";
  db = await createDatabase({ pgliteDir: "memory", migrate: true });
  await setSetting(db, "demo_anchor", { iso: ANCHOR.toISOString() });
  await ensureBots(db, 30);
  await demoTick(db, ANCHOR);
}, 180_000);

describe("accounts", () => {
  it("signs up, signs in and resolves a session", async () => {
    alice = await signUp(db, { username: "alice", email: "alice@example.com", password: "correct horse" });
    bob = await signUp(db, { username: "bob_cs", email: "bob@example.com", password: "battery staple" });
    await expectCode(signUp(db, { username: "ALICE", email: "x@example.com", password: "12345678" }), "CONFLICT");
    await expectCode(signIn(db, { login: "alice", password: "wrong password" }), "UNAUTHENTICATED");
    expect(await signIn(db, { login: "Alice@Example.com", password: "correct horse" })).toBe(alice);
    const { token } = await createSession(db, alice);
    expect((await userForToken(db, token))?.id).toBe(alice);
    expect(await userForToken(db, "not-a-token")).toBeNull();
  });
});

describe("tournament fantasy journey", () => {
  it("opens Full Run before Stage 1 with a frozen 80-player pool; Main Event waits for Stage 3 teams", async () => {
    const ws = await db.select().from(s.contestWindows).where(eq(s.contestWindows.contestId, FULL_RUN)).orderBy(asc(s.contestWindows.position));
    expect(ws.map((w) => w.status)).toEqual(["open", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming"]);
    // Playoff windows: one strategic transfer each; the Grand Final allows three from one team.
    expect(ws.map((w) => w.transfersAllowed)).toEqual([null, null, null, 1, 1, 1]);
    expect(ws.map((w) => w.maxPerTeam)).toEqual([null, null, null, null, null, 3]);
    expect(await db.select().from(s.windowPool).where(eq(s.windowPool.windowId, ws[0]!.id))).toHaveLength(80);
    const me = await db.select().from(s.contestWindows).where(eq(s.contestWindows.contestId, "demo-meridian-major--main-event"));
    expect(me.every((w) => w.status === "upcoming")).toBe(true);
    const data = await builderData(db, FULL_RUN, alice, ANCHOR);
    expect(data?.state).toBe("open");
    expect(data?.pool.length).toBe(80);
  });

  it("enforces cap, team limit and captain on the server", async () => {
    const w1 = `${FULL_RUN}--w1`;
    const pool = await db.select().from(s.windowPool).where(eq(s.windowPool.windowId, w1));
    const expensive = [...pool].sort((a, b) => b.price - a.price);
    const overCap: string[] = [];
    const seen = new Map<string, number>();
    for (const p of expensive) {
      if (overCap.length === 5) break;
      if ((seen.get(p.teamId) ?? 0) >= 2) continue;
      overCap.push(p.playerId);
      seen.set(p.teamId, (seen.get(p.teamId) ?? 0) + 1);
    }
    const e1 = await expectCode(saveEntry(db, { userId: alice, contestId: FULL_RUN, playerIds: overCap, captainId: overCap[0]! }, ANCHOR), "ROSTER_INVALID");
    expect(JSON.stringify((e1 as { details: unknown }).details)).toContain("OVER_CAP");

    const team = pool[0]!.teamId;
    const three = pool.filter((p) => p.teamId === team).slice(0, 3).map((p) => p.playerId);
    const cheap = (await pickRoster(w1, three)).slice(0, 2).map((p) => p.playerId);
    const e2 = await expectCode(saveEntry(db, { userId: alice, contestId: FULL_RUN, playerIds: [...three, ...cheap], captainId: three[0]! }, ANCHOR), "ROSTER_INVALID");
    expect(JSON.stringify((e2 as { details: unknown }).details)).toContain("TEAM_LIMIT");

    const ok = (await pickRoster(w1)).map((p) => p.playerId);
    await expectCode(saveEntry(db, { userId: alice, contestId: FULL_RUN, playerIds: ok, captainId: null }, ANCHOR), "ROSTER_INVALID");
  });

  it("saves, edits and keeps one entry per user", async () => {
    const w1 = `${FULL_RUN}--w1`;
    const roster = (await pickRoster(w1)).map((p) => p.playerId);
    const r1 = await saveEntry(db, { userId: alice, contestId: FULL_RUN, playerIds: roster, captainId: roster[0]!, autopilot: false }, ANCHOR);
    expect(r1.created).toBe(true);
    const r2 = await saveEntry(db, { userId: alice, contestId: FULL_RUN, playerIds: roster, captainId: roster[1]! }, ANCHOR);
    expect(r2.created).toBe(false);
    expect(r2.entryId).toBe(r1.entryId);
    const versions = await db.select().from(s.rosterVersions).where(eq(s.rosterVersions.entryId, r1.entryId));
    expect(versions.map((v) => v.version).sort()).toEqual([1, 2]);
    const bobRoster = (await pickRoster(w1, roster.slice(0, 2))).map((p) => p.playerId);
    await saveEntry(db, { userId: bob, contestId: FULL_RUN, playerIds: bobRoster, captainId: bobRoster[0]!, autopilot: true }, ANCHOR);
  });

  it("joins a private league with an existing entry (no second roster)", async () => {
    const league = await createLeague(db, alice, { contestId: FULL_RUN, name: "Office League" });
    const invite = await getInvite(db, league.inviteCode, ANCHOR);
    expect(invite.league.members).toBe(1);
    const joined = await joinLeague(db, bob, league.inviteCode, ANCHOR);
    expect(joined.entryAttached).toBe(true);
    const entries = await db.select().from(s.entries).where(eq(s.entries.userId, bob));
    expect(entries).toHaveLength(1);
    const le = await db.select().from(s.leagueEntries).where(eq(s.leagueEntries.leagueId, league.id));
    expect(le).toHaveLength(2);
  });

  it("rejects changes after the lock, server-side", async () => {
    const [w1] = await db.select().from(s.contestWindows).where(eq(s.contestWindows.id, `${FULL_RUN}--w1`));
    const after = new Date(w1!.lockAt.getTime() + 1000);
    const roster = (await pickRoster(w1!.id)).map((p) => p.playerId);
    await expectCode(saveEntry(db, { userId: alice, contestId: FULL_RUN, playerIds: roster, captainId: roster[0]! }, after), "LOCKED");
  });

  it("scores maps as they finish, then records a correction without double counting", async () => {
    const [s1] = await stages();
    // Partway into Stage 1: the first BO1s are in, the correction isn't released yet.
    await demoTick(db, new Date(s1!.beginAt.getTime() + 1.5 * H));
    const early = await db.select().from(s.scoringEvents).where(eq(s.scoringEvents.stageId, s1!.id));
    expect(early.length).toBeGreaterThan(0);
    const [w1] = await db.select().from(s.contestWindows).where(eq(s.contestWindows.id, `${FULL_RUN}--w1`));
    expect(w1!.status).toBe("locked");

    await demoTick(db, new Date(s1!.beginAt.getTime() + 5 * H));
    const corrections = await db.select().from(s.scoreCorrections);
    expect(corrections).toHaveLength(1);
    expect((corrections[0]!.changes as Array<{ field: string }>)[0]!.field).toBe("assists");
    const superseded = await db.select().from(s.scoringEvents).where(isNotNull(s.scoringEvents.supersededById));
    expect(superseded.length).toBeGreaterThan(0);

    // Idempotency: rescoring unchanged data writes nothing.
    const again = await rescoreStage(db, s1!.id);
    expect(again.inserted).toBe(0);
    const current = await db.select().from(s.scoringEvents).where(and(eq(s.scoringEvents.stageId, s1!.id), isNull(s.scoringEvents.supersededById)));
    const keys = current.map((e) => `${e.ruleSetId}|${e.kind}|${e.matchId}|${e.playerId}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("finishes Stage 1: entry totals equal the sum of the ledger, with the captain multiplier", async () => {
    const [s1] = await stages();
    await demoTick(db, new Date(s1!.endAt.getTime() + H));
    const [e] = await db.select().from(s.entries).where(and(eq(s.entries.userId, alice), eq(s.entries.contestId, FULL_RUN)));
    expect(e!.rank).not.toBeNull();
    const dash = await entryDashboard(db, e!.id, alice, new Date(s1!.endAt.getTime() + H));
    const w = dash!.windows.find((x) => x.position === 1)!;
    const sum = w.players.reduce((a, p) => a + p.points, 0);
    expect(sum).toBeCloseTo(e!.totalPoints, 6);
    const cap = w.players.find((p) => p.isCaptain)!;
    expect(cap.points).toBeCloseTo(cap.basePoints * 1.5, 9);
    // Every series event's total matches its own breakdown.
    for (const p of w.players)
      for (const ev of p.events) if (ev.kind === "series") expect(ev.points).toBeCloseTo((ev.breakdown as { total: number }).total, 9);
    const board = await getBoard(db, FULL_RUN, { kind: "global" }, { viewerId: alice });
    expect(board.me?.userId).toBe(alice);
    expect(board.total).toBeGreaterThan(10);
  });

  it("window 2: eliminated players are free to replace; more than 2 other changes is rejected", async () => {
    const [, s2] = await stages();
    const [w2] = await db.select().from(s.contestWindows).where(eq(s.contestWindows.id, `${FULL_RUN}--w2`));
    expect(w2!.status).toBe("open");
    const at = new Date(w2!.lockAt.getTime() - H);
    const data = await builderData(db, FULL_RUN, alice, at);
    expect(data!.state).toBe("open");
    const prev = data!.previous!.playerIds;
    const poolIds = new Set(data!.pool.map((p) => p.id));
    const alive = prev.filter((id) => poolIds.has(id));
    const dead = prev.filter((id) => !poolIds.has(id));
    expect(alive.length + dead.length).toBe(5);

    const pool = await db.select().from(s.windowPool).where(eq(s.windowPool.windowId, w2!.id));
    const build = (keepIds: string[]) => {
      const out = [...keepIds];
      const per = new Map<string, number>();
      let spent = 0;
      for (const id of out) {
        const p = pool.find((x) => x.playerId === id)!;
        per.set(p.teamId, (per.get(p.teamId) ?? 0) + 1);
        spent += p.price;
      }
      for (const p of [...pool].sort((a, b) => a.price - b.price)) {
        if (out.length === 5) break;
        if (out.includes(p.playerId) || prev.includes(p.playerId) || (per.get(p.teamId) ?? 0) >= 2) continue;
        if (spent + p.price > 1_000_000 - (4 - out.length) * 100_000) continue;
        out.push(p.playerId);
        per.set(p.teamId, (per.get(p.teamId) ?? 0) + 1);
        spent += p.price;
      }
      return out;
    };
    if (alive.length >= 3) {
      const tooMany = build(alive.slice(0, alive.length - 3));
      await expectCode(saveEntry(db, { userId: alice, contestId: FULL_RUN, playerIds: tooMany, captainId: tooMany[0]! }, at), "TRANSFER_LIMIT");
    }
    const legal = build(alive);
    const res = await saveEntry(db, { userId: alice, contestId: FULL_RUN, playerIds: legal, captainId: legal[0]! }, at);
    expect(res.transfers.discretionary).toHaveLength(0);
    expect(res.transfers.free.sort()).toEqual(dead.sort());
    // Kept players stay at the price paid in window 1; new signings cost the window-2 price.
    const [prevV] = await db.select().from(s.rosterVersions).where(and(eq(s.rosterVersions.entryId, res.entryId), eq(s.rosterVersions.windowId, `${FULL_RUN}--w1`))).orderBy(desc(s.rosterVersions.version)).limit(1);
    const prevSel = await db.select().from(s.rosterSelections).where(eq(s.rosterSelections.rosterVersionId, prevV!.id));
    const newSel = await db.select().from(s.rosterSelections).where(eq(s.rosterSelections.rosterVersionId, res.rosterVersionId));
    for (const id of alive) expect(newSel.find((x) => x.playerId === id)!.price).toBe(prevSel.find((x) => x.playerId === id)!.price);
    for (const x of newSel.filter((x) => !alive.includes(x.playerId))) expect(x.price).toBe(pool.find((p) => p.playerId === x.playerId)!.price);
    void s2;
  });

  it("Autopilot replaces eliminated players at the lock for entries that didn't act", async () => {
    const [, s2] = await stages();
    await demoTick(db, new Date(s2!.endAt.getTime() + H));
    const [bobEntry] = await db.select().from(s.entries).where(and(eq(s.entries.userId, bob), eq(s.entries.contestId, FULL_RUN)));
    const auto = await db.select().from(s.transfers).where(and(eq(s.transfers.entryId, bobEntry!.id), eq(s.transfers.kind, "autopilot")));
    const audits = await db.select().from(s.adminAuditLog).where(and(eq(s.adminAuditLog.action, "autopilot.replace"), eq(s.adminAuditLog.targetId, bobEntry!.id)));
    // Bob may have had no eliminated players; if he did, they were replaced with an audit trail.
    expect(auto.length > 0).toBe(audits.length > 0);
    const v = await db.select().from(s.rosterVersions).where(and(eq(s.rosterVersions.entryId, bobEntry!.id), eq(s.rosterVersions.windowId, `${FULL_RUN}--w2`)));
    if (auto.length) expect(v.some((x) => x.source === "autopilot")).toBe(true);
  });

  it("plays to the end, settles, and records the result on the profile", async () => {
    const st = await stages();
    // Stage 3 is all BO3: one hour in, first maps are scored provisionally (no series result yet).
    await demoTick(db, new Date(st[2]!.beginAt.getTime() + 1.2 * H));
    const provisional = await db.select().from(s.scoringEvents).where(and(eq(s.scoringEvents.stageId, st[2]!.id), eq(s.scoringEvents.state, "provisional"), isNull(s.scoringEvents.supersededById)));
    expect(provisional.length).toBeGreaterThan(0);
    expect(provisional.every((e) => (e.breakdown as { seriesWinPoints: number }).seriesWinPoints === 0)).toBe(true);
    for (const x of st.slice(2)) await demoTick(db, new Date(x.endAt.getTime() + H));
    const stillProvisional = await db.select().from(s.scoringEvents).where(and(eq(s.scoringEvents.state, "provisional"), isNull(s.scoringEvents.supersededById)));
    expect(stillProvisional).toHaveLength(0);
    await demoTick(db, new Date(st[st.length - 1]!.endAt.getTime() + 26 * H));
    const [c] = await db.select().from(s.contests).where(eq(s.contests.id, FULL_RUN));
    expect(c!.status).toBe("completed");
    expect(c!.settledAt).not.toBeNull();
    const settled = await db.select().from(s.scoringEvents).where(and(eq(s.scoringEvents.state, "settled"), isNull(s.scoringEvents.supersededById)));
    expect(settled.length).toBeGreaterThan(0);
    const finals = await db.select().from(s.standingsSnapshots).where(and(eq(s.standingsSnapshots.contestId, FULL_RUN), eq(s.standingsSnapshots.isFinal, true)));
    expect(finals.length).toBeGreaterThan(0);
    const profile = await profileByUsername(db, "alice");
    const h = profile!.history.find((x) => x.contestId === FULL_RUN)!;
    expect(h.settled).toBe(true);
    expect(h.rank).toBeGreaterThan(0);
    expect(profile!.stats.completed).toBeGreaterThanOrEqual(1);
  });
});
