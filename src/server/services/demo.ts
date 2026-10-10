import { and, asc, eq, inArray } from "drizzle-orm";
import { addBlockReason } from "@/domain/rules";
import { Rng } from "@/domain/random";
import type { ContestRules, PoolPlayer } from "@/domain/types";
import { hashPassword } from "../auth/password";
import { isDemoMode, now as clockNow, setClockOffset } from "../clock";
import type { Db } from "../db/connect";
import * as s from "../db/schema";
import { AppError } from "../errors";
import { newInviteCode } from "../ids";
import { currentRoster } from "../ingest/contests";
import { runPipeline } from "../ingest/pipeline";
import { getProvider } from "../providers";
import { saveEntry, windowPoolMap } from "./entries";

/**
 * Demonstration mode. Fictional "bot" managers fill leaderboards and leagues so the product can be
 * experienced end to end without real users or licensed data. Bots go through exactly the same
 * entry service and rules as people. Everything here is disabled unless DEMO_MODE=true.
 */

const BOT_COUNT = 240;
const ADJ = ["swift", "quiet", "lucky", "brave", "frosty", "cosmic", "rapid", "silent", "golden", "rusty", "neon", "pixel", "turbo", "lazy", "clever", "stormy", "minty", "solar", "tiny", "grand"];
const NOUN = ["falcon", "otter", "eco", "flick", "smoke", "molly", "spray", "peek", "clutch", "rotate", "lurker", "anchor", "entry", "retake", "awp", "deagle", "bunny", "nade", "boost", "jiggle"];

export async function ensureBots(db: Db, botCount = BOT_COUNT): Promise<void> {
  const existing = await db.select({ id: s.users.id }).from(s.users).where(eq(s.users.isBot, true));
  if (existing.length >= botCount) return;
  const rng = new Rng("lockin-bots");
  const rows: (typeof s.users.$inferInsert)[] = [];
  const used = new Set<string>();
  for (let i = 1; i <= botCount; i++) {
    let name = "";
    do name = `${rng.pick(ADJ)}_${rng.pick(NOUN)}${rng.chance(0.5) ? rng.int(1, 99) : ""}`;
    while (used.has(name));
    used.add(name);
    rows.push({
      id: `bot-${String(i).padStart(3, "0")}`,
      username: name,
      email: `${name}@bots.lockin.invalid`,
      passwordHash: "!", // bots can never sign in
      displayName: name,
      avatarHue: rng.int(0, 359),
      isBot: true,
    });
  }
  await db.insert(s.users).values(rows).onConflictDoNothing();
}

/** A fixed demo account for screenshots and walkthroughs (demo mode only). */
export async function ensureDemoUser(db: Db): Promise<string> {
  const [u] = await db.select().from(s.users).where(eq(s.users.username, "demo"));
  if (u) return u.id;
  const id = "user-demo";
  await db.insert(s.users).values({
    id,
    username: "demo",
    email: "demo@lockin.invalid",
    passwordHash: await hashPassword("lockin-demo"),
    displayName: "demo",
    avatarHue: 172,
  });
  return id;
}

function botRoster(rng: Rng, pool: Map<string, PoolPlayer & { avg: number }>, rules: ContestRules): { playerIds: string[]; captainId: string } | null {
  const players = [...pool.values()];
  for (let attempt = 0; attempt < 40; attempt++) {
    const picks: string[] = [];
    const style = rng.next(); // stars-and-scrubs vs balanced
    const order = rng.shuffle(players).sort((a, b) => {
      const va = style < 0.4 ? a.price : a.avg + rng.next() * 12;
      const vb = style < 0.4 ? b.price : b.avg + rng.next() * 12;
      return vb - va;
    });
    for (const p of order) {
      if (picks.length === rules.rosterSize) break;
      if (rng.chance(0.45)) continue; // variety
      const slotsLeft = rules.rosterSize - picks.length - 1;
      const spent = picks.reduce((a, id) => a + pool.get(id)!.price, 0);
      if (rules.salaryCap - spent - p.price < slotsLeft * 100_000) continue;
      if (!addBlockReason(p, picks, pool, rules)) picks.push(p.id);
    }
    if (picks.length === rules.rosterSize) {
      const captainId = [...picks].sort((a, b) => pool.get(b)!.price - pool.get(a)!.price)[rng.chance(0.7) ? 0 : rng.int(1, 4)]!;
      return { playerIds: picks, captainId };
    }
  }
  return null;
}

/** Bots enter open contests and sometimes use transfers in later windows. */
export async function runBots(db: Db, now: Date): Promise<number> {
  const bots = await db.select({ id: s.users.id }).from(s.users).where(eq(s.users.isBot, true)).orderBy(asc(s.users.id));
  const openWindows = await db.select().from(s.contestWindows).where(eq(s.contestWindows.status, "open"));
  let actions = 0;
  for (const w of openWindows) {
    if (w.lockAt <= now) continue;
    const [c] = await db.select().from(s.contests).where(eq(s.contests.id, w.contestId));
    if (!c) continue;
    const rules = c.rules as ContestRules;
    const base = await windowPoolMap(db, w.id);
    const prices = await db.select().from(s.playerPrices).where(eq(s.playerPrices.contestId, c.id));
    const avg = new Map(prices.map((p) => [p.playerId, p.avgPoints]));
    const pool = new Map([...base].map(([id, p]) => [id, { ...p, avg: avg.get(id) ?? 0 }]));
    const entries = await db.select().from(s.entries).where(and(eq(s.entries.contestId, c.id), inArray(s.entries.userId, bots.map((b) => b.id))));
    const entryOf = new Map(entries.map((e) => [e.userId, e]));
    const participation = c.kind === "main_event" ? 0.95 : 0.8;

    for (const bot of bots) {
      const rng = new Rng(`${bot.id}|${w.id}`);
      const e = entryOf.get(bot.id);
      if (!e) {
        if (w.position > 1 && !rng.chance(0.1)) continue; // a few late entries
        if (!rng.chance(participation)) continue;
        const roster = botRoster(rng, pool, rules);
        if (!roster) continue;
        await saveEntry(db, { userId: bot.id, contestId: c.id, ...roster, autopilot: rng.chance(0.85) }, now);
        actions++;
        continue;
      }
      // Existing entry in a later window: replace eliminated players (unless on Autopilot) and maybe upgrade.
      const cur = await currentRoster(db, e.id, w.id);
      if (!cur || cur.version.source === "user") continue;
      const dead = cur.playerIds.filter((id) => !pool.has(id));
      const wantsTransfer = rng.chance(0.35);
      if ((dead.length === 0 || e.autopilot) && !wantsTransfer) continue;
      const keep = cur.playerIds.filter((id) => pool.has(id));
      const sold = wantsTransfer && keep.length > 0 ? [keep.sort((a, b) => pool.get(a)!.avg - pool.get(b)!.avg)[0]!] : [];
      const roster = keep.filter((id) => !sold.includes(id));
      const candidates = rng.shuffle([...pool.values()]).sort((a, b) => b.avg - a.avg);
      for (const p of candidates) {
        if (roster.length === rules.rosterSize) break;
        if (sold.includes(p.id)) continue;
        const spent = roster.reduce((a, id) => a + pool.get(id)!.price, 0);
        const slotsLeft = rules.rosterSize - roster.length - 1;
        if (rules.salaryCap - spent - p.price < slotsLeft * 100_000) continue;
        if (!addBlockReason(p, roster, pool, rules)) roster.push(p.id);
      }
      if (roster.length !== rules.rosterSize) continue;
      const captainId = cur.version.captainPlayerId && roster.includes(cur.version.captainPlayerId) ? cur.version.captainPlayerId : [...roster].sort((a, b) => pool.get(b)!.price - pool.get(a)!.price)[0]!;
      try {
        await saveEntry(db, { userId: bot.id, contestId: c.id, playerIds: roster, captainId }, now);
        actions++;
      } catch {
        // A bot making an illegal move is simply skipped; the server rules still apply to bots.
      }
    }
  }
  return actions;
}

/** Demo leagues: a public community league and a small private one, per demo contest. */
export async function ensureDemoLeagues(db: Db): Promise<void> {
  const contests = await db.select().from(s.contests);
  const bots = await db.select({ id: s.users.id }).from(s.users).where(eq(s.users.isBot, true)).orderBy(asc(s.users.id));
  if (bots.length === 0) return;
  for (const c of contests) {
    const existing = await db.select({ id: s.leagues.id }).from(s.leagues).where(eq(s.leagues.contestId, c.id));
    if (existing.length) continue;
    const defs = [
      { id: `${c.id}--community`, name: "Lockin Community", description: "Everyone's welcome. Demo league with fictional managers.", privacy: "public", members: bots.slice(0, Math.ceil(bots.length * 0.6)) },
      { id: `${c.id}--friday`, name: "Friday Night CS", description: "A small private league between friends (demo).", privacy: "private", members: bots.slice(Math.ceil(bots.length * 0.6), Math.ceil(bots.length * 0.6) + 11) },
    ];
    for (const d of defs) {
      await db.insert(s.leagues).values({ id: d.id, contestId: c.id, ownerId: d.members[0]!.id, name: d.name, description: d.description, privacy: d.privacy, inviteCode: newInviteCode() });
      await db.insert(s.leagueMembers).values(d.members.map((m, i) => ({ leagueId: d.id, userId: m.id, role: i === 0 ? "owner" : "member" })));
      const es = await db.select({ id: s.entries.id }).from(s.entries).where(and(eq(s.entries.contestId, c.id), inArray(s.entries.userId, d.members.map((m) => m.id))));
      if (es.length) await db.insert(s.leagueEntries).values(es.map((e) => ({ leagueId: d.id, entryId: e.id }))).onConflictDoNothing();
    }
  }
}

/** One pipeline tick plus demo activity. */
export async function demoTick(db: Db, at: Date) {
  const provider = await getProvider(db);
  const result = await runPipeline(db, provider, at);
  if (provider.isDemo) {
    await ensureDemoLeagues(db);
    await runBots(db, at);
  }
  return result;
}

// ─── Demo controls ─────────────────────────────────────────────────────────────────────────

export interface DemoStatus {
  enabled: boolean;
  now: string;
  offsetHours: number;
  next: { label: string; target: string } | null;
}

async function featuredTournament(db: Db) {
  const ts = await db.select().from(s.tournaments).where(eq(s.tournaments.tier, "major"));
  return ts[0] ?? null;
}

async function nextStep(db: Db, at: Date): Promise<{ label: string; target: Date } | null> {
  const t = await featuredTournament(db);
  if (!t) return null;
  const st = await db.select().from(s.stages).where(eq(s.stages.tournamentId, t.id)).orderBy(asc(s.stages.position));
  for (const stage of st) {
    if (stage.endAt.getTime() + 3_600_000 > at.getTime()) {
      return { label: `Play ${stage.name}`, target: new Date(stage.endAt.getTime() + 3_600_000) };
    }
  }
  const last = st[st.length - 1];
  if (last && at.getTime() < last.endAt.getTime() + 25 * 3_600_000) {
    return { label: "Settle final results", target: new Date(last.endAt.getTime() + 25 * 3_600_000) };
  }
  return null;
}

export async function demoStatus(db: Db): Promise<DemoStatus> {
  const at = await clockNow(db);
  const next = isDemoMode() ? await nextStep(db, at) : null;
  return {
    enabled: isDemoMode(),
    now: at.toISOString(),
    offsetHours: Math.round((at.getTime() - Date.now()) / 3_600_000),
    next: next ? { label: next.label, target: next.target.toISOString() } : null,
  };
}

/** Moves the demo clock to the end of the featured event's next stage and processes everything due. */
export async function demoAdvance(db: Db) {
  if (!isDemoMode()) throw new AppError("DEMO_DISABLED", "Demo controls are disabled.");
  const at = await clockNow(db);
  const next = await nextStep(db, at);
  if (!next) throw new AppError("VALIDATION", "The demo tournament is already complete.");
  await setClockOffset(db, next.target.getTime() - Date.now());
  const result = await demoTick(db, next.target);
  return { step: next.label, at: next.target.toISOString(), result };
}
