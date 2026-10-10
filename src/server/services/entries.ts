import { and, asc, eq, inArray } from "drizzle-orm";
import { countTransfers, validateRoster, validateTransfers } from "@/domain/rules";
import type { ContestRules, PoolPlayer } from "@/domain/types";
import type { Db } from "../db/connect";
import * as s from "../db/schema";
import { AppError } from "../errors";
import { newId } from "../ids";
import { currentRoster, insertRosterVersion } from "../ingest/contests";

/**
 * Saving a roster: the authoritative path for every gameplay rule (docs/09 CO-2, CO-5, CO-6).
 * The client runs the same validation for instant feedback, but only this decides.
 */

export interface SaveEntryInput {
  userId: string;
  contestId: string;
  playerIds: string[];
  captainId: string | null;
  autopilot?: boolean;
}

export interface SaveEntryResult {
  entryId: string;
  windowId: string;
  windowPosition: number;
  rosterVersionId: string;
  created: boolean;
  transfers: { free: string[]; discretionary: string[] };
}

/** The window currently accepting changes, or a precise reason why none is. */
export async function openWindowFor(db: Db, contestId: string, now: Date) {
  const [c] = await db.select().from(s.contests).where(eq(s.contests.id, contestId));
  if (!c) throw new AppError("NOT_FOUND", "This contest doesn't exist.");
  const windows = await db.select().from(s.contestWindows).where(eq(s.contestWindows.contestId, contestId)).orderBy(asc(s.contestWindows.position));
  const open = windows.find((w) => w.status === "open");
  if (open && open.lockAt > now) return { contest: c, window: open, windows };
  if (open && open.lockAt <= now) {
    throw new AppError("LOCKED", `Lineups locked at ${open.lockAt.toISOString()}. Your saved team is unchanged.`, { lockAt: open.lockAt });
  }
  if (windows.every((w) => w.status === "completed")) throw new AppError("LOCKED", "This contest has finished.");
  const next = windows.find((w) => w.status === "upcoming");
  throw new AppError("NO_OPEN_WINDOW", next ? "The next transfer window isn't open yet." : "Lineups are locked for this stage.", {
    nextWindowPosition: next?.position ?? null,
  });
}

export async function windowPoolMap(db: Db, windowId: string): Promise<Map<string, PoolPlayer>> {
  const rows = await db.select().from(s.windowPool).where(eq(s.windowPool.windowId, windowId));
  return new Map(rows.map((r) => [r.playerId, { id: r.playerId, teamId: r.teamId, price: r.price }]));
}

export async function saveEntry(db: Db, input: SaveEntryInput, now: Date): Promise<SaveEntryResult> {
  const { contest, window, windows } = await openWindowFor(db, input.contestId, now);
  const rules = contest.rules as ContestRules;
  const pool = await windowPoolMap(db, window.id);

  // Players kept from the previous window count at the price paid for them (FPL-style).
  const prevWindow = windows.find((w) => w.position === window.position - 1);
  const [own] = await db.select({ id: s.entries.id }).from(s.entries).where(and(eq(s.entries.contestId, contest.id), eq(s.entries.userId, input.userId)));
  const prevRoster = own && prevWindow ? await currentRoster(db, own.id, prevWindow.id) : null;
  const effective = heldPricePool(pool, prevRoster?.prices);

  const errors = validateRoster({ playerIds: input.playerIds, captainId: input.captainId }, effective, rules);
  if (errors.length) throw new AppError("ROSTER_INVALID", errors[0]!.message, { errors });
  const paid = new Map(input.playerIds.map((id) => [id, effective.get(id)!.price]));

  return db.transaction(async (txRaw) => {
    const tx = txRaw as unknown as Db;
    const [existing] = await tx
      .select()
      .from(s.entries)
      .where(and(eq(s.entries.contestId, contest.id), eq(s.entries.userId, input.userId)));
    let entryId = existing?.id;
    let created = false;
    if (!existing) {
      const [user] = await tx.select({ autopilotDefault: s.users.autopilotDefault }).from(s.users).where(eq(s.users.id, input.userId));
      if (!user) throw new AppError("UNAUTHENTICATED", "Please sign in again.");
      entryId = newId();
      const inserted = await tx
        .insert(s.entries)
        .values({
          id: entryId,
          contestId: contest.id,
          userId: input.userId,
          autopilot: input.autopilot ?? user.autopilotDefault,
          joinedWindowPosition: window.position,
          submittedAt: now,
        })
        .onConflictDoNothing()
        .returning({ id: s.entries.id });
      if (inserted.length === 0) throw new AppError("CONFLICT", "Your team was just saved from another tab. Refresh to see it.");
      created = true;
    }

    // Transfers are measured against the previous window's locked roster.
    let transferResult = { free: [] as string[], discretionary: [] as string[] };
    if (!created && prevWindow) {
      const prev = await currentRoster(tx, entryId!, prevWindow.id);
      if (prev) {
        const count = countTransfers(prev.playerIds, input.playerIds, new Set(pool.keys()));
        const err = validateTransfers(count, rules);
        if (err) throw new AppError("TRANSFER_LIMIT", err.message, { count });
        transferResult = { free: count.free, discretionary: count.discretionary };
        await tx
          .delete(s.transfers)
          .where(and(eq(s.transfers.entryId, entryId!), eq(s.transfers.windowId, window.id), inArray(s.transfers.kind, ["free", "discretionary"])));
        const outs = [...count.free.map((id) => ({ id, kind: "free" })), ...count.discretionary.map((id) => ({ id, kind: "discretionary" }))];
        for (const [i, o] of outs.entries()) {
          await tx.insert(s.transfers).values({
            id: newId(),
            entryId: entryId!,
            windowId: window.id,
            outPlayerId: o.id,
            inPlayerId: count.added[i] ?? null,
            kind: o.kind,
            reason: o.kind === "free" ? "Replaced a player who is no longer eligible (free)" : "Transfer",
          });
        }
      }
    }

    const rosterVersionId = await insertRosterVersion(tx, {
      entryId: entryId!,
      windowId: window.id,
      playerIds: input.playerIds,
      captainId: input.captainId,
      source: "user",
      prices: paid,
    });
    await tx
      .update(s.entries)
      .set({ submittedAt: now, ...(input.autopilot === undefined ? {} : { autopilot: input.autopilot }) })
      .where(eq(s.entries.id, entryId!));

    // One entry, every leaderboard: attach to all of the user's leagues for this contest.
    const leagueRows = await tx
      .select({ id: s.leagues.id })
      .from(s.leagues)
      .innerJoin(s.leagueMembers, eq(s.leagueMembers.leagueId, s.leagues.id))
      .where(and(eq(s.leagues.contestId, contest.id), eq(s.leagueMembers.userId, input.userId)));
    if (leagueRows.length) {
      await tx.insert(s.leagueEntries).values(leagueRows.map((l) => ({ leagueId: l.id, entryId: entryId! }))).onConflictDoNothing();
    }

    return {
      entryId: entryId!,
      windowId: window.id,
      windowPosition: window.position,
      rosterVersionId,
      created,
      transfers: transferResult,
    };
  });
}

/** The window pool with kept players re-priced at what was paid for them. */
export function heldPricePool(pool: Map<string, PoolPlayer>, held: ReadonlyMap<string, number> | undefined): Map<string, PoolPlayer> {
  if (!held || held.size === 0) return pool;
  const out = new Map(pool);
  for (const [id, price] of held) {
    const p = out.get(id);
    if (p && price > 0) out.set(id, { ...p, price });
  }
  return out;
}

export async function setAutopilot(db: Db, userId: string, entryId: string, autopilot: boolean): Promise<void> {
  const [e] = await db.select().from(s.entries).where(eq(s.entries.id, entryId));
  if (!e) throw new AppError("NOT_FOUND", "Entry not found.");
  if (e.userId !== userId) throw new AppError("FORBIDDEN", "You can only change your own team.");
  await db.update(s.entries).set({ autopilot }).where(eq(s.entries.id, entryId));
}
