import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db/connect";
import * as s from "../db/schema";
import { AppError } from "../errors";
import { newId, newInviteCode } from "../ids";

/**
 * Private leagues (docs/09 LG-1..LG-5). A league is a group of people on one contest; it never
 * creates a second entry. Joining attaches the member's existing entry, if they have one.
 */

export const createLeagueSchema = z.object({
  contestId: z.string().min(1),
  name: z.string().trim().min(3, "Name needs at least 3 characters").max(40, "Keep the name under 40 characters"),
  description: z.string().trim().max(200).default(""),
  privacy: z.enum(["private", "public"]).default("private"),
});

export async function createLeague(db: Db, ownerId: string, input: z.input<typeof createLeagueSchema>) {
  const data = createLeagueSchema.parse(input);
  const [c] = await db.select().from(s.contests).where(eq(s.contests.id, data.contestId));
  if (!c) throw new AppError("NOT_FOUND", "That contest doesn't exist.");
  if (c.status === "completed") throw new AppError("VALIDATION", "This contest has finished. Create a league for an upcoming one.");
  const [{ n } = { n: 0 }] = await db.select({ n: count() }).from(s.leagues).where(eq(s.leagues.ownerId, ownerId));
  if (n >= 25) throw new AppError("RATE_LIMITED", "You've reached the limit of 25 leagues.");
  const id = newId();
  await db.insert(s.leagues).values({ id, contestId: c.id, ownerId, name: data.name, description: data.description, privacy: data.privacy, inviteCode: newInviteCode() });
  await db.insert(s.leagueMembers).values({ leagueId: id, userId: ownerId, role: "owner" });
  await attachEntry(db, id, c.id, ownerId);
  return getLeagueSummary(db, id);
}

async function attachEntry(db: Db, leagueId: string, contestId: string, userId: string) {
  const [e] = await db.select({ id: s.entries.id }).from(s.entries).where(and(eq(s.entries.contestId, contestId), eq(s.entries.userId, userId)));
  if (e) await db.insert(s.leagueEntries).values({ leagueId, entryId: e.id }).onConflictDoNothing();
  return e?.id ?? null;
}

export async function getLeagueSummary(db: Db, leagueId: string) {
  const [l] = await db.select().from(s.leagues).where(eq(s.leagues.id, leagueId));
  if (!l) throw new AppError("NOT_FOUND", "League not found.");
  const [{ members } = { members: 0 }] = await db.select({ members: count() }).from(s.leagueMembers).where(eq(s.leagueMembers.leagueId, leagueId));
  return { ...l, members };
}

/** Public invite preview: what someone sees before joining. Never exposes members' data. */
export async function getInvite(db: Db, code: string, now: Date) {
  const [l] = await db.select().from(s.leagues).where(eq(s.leagues.inviteCode, code));
  if (!l) throw new AppError("NOT_FOUND", "This invite link isn't valid. Ask for a new one.");
  const expired = !!l.inviteExpiresAt && l.inviteExpiresAt <= now;
  const summary = await getLeagueSummary(db, l.id);
  const [c] = await db.select().from(s.contests).where(eq(s.contests.id, l.contestId));
  const [t] = await db.select().from(s.tournaments).where(eq(s.tournaments.id, c!.tournamentId));
  const [owner] = await db.select({ username: s.users.username, displayName: s.users.displayName }).from(s.users).where(eq(s.users.id, l.ownerId));
  return { league: summary, contest: c!, tournament: t!, owner: owner!, expired };
}

export async function joinLeague(db: Db, userId: string, code: string, now: Date) {
  const { league, expired } = await getInvite(db, code, now);
  if (expired) throw new AppError("INVITE_EXPIRED", "This invite has expired. Ask the league owner for a new link.");
  await db.insert(s.leagueMembers).values({ leagueId: league.id, userId, role: "member" }).onConflictDoNothing();
  const entryId = await attachEntry(db, league.id, league.contestId, userId);
  return { leagueId: league.id, entryAttached: !!entryId };
}

export async function joinPublicLeague(db: Db, userId: string, leagueId: string) {
  const [l] = await db.select().from(s.leagues).where(eq(s.leagues.id, leagueId));
  if (!l) throw new AppError("NOT_FOUND", "League not found.");
  if (l.privacy !== "public") throw new AppError("FORBIDDEN", "This league is invite-only.");
  await db.insert(s.leagueMembers).values({ leagueId: l.id, userId, role: "member" }).onConflictDoNothing();
  await attachEntry(db, l.id, l.contestId, userId);
  return { leagueId: l.id };
}

async function requireOwner(db: Db, leagueId: string, userId: string) {
  const [l] = await db.select().from(s.leagues).where(eq(s.leagues.id, leagueId));
  if (!l) throw new AppError("NOT_FOUND", "League not found.");
  if (l.ownerId !== userId) throw new AppError("FORBIDDEN", "Only the league owner can do that.");
  return l;
}

export async function removeMember(db: Db, ownerId: string, leagueId: string, memberId: string) {
  const l = await requireOwner(db, leagueId, ownerId);
  if (memberId === l.ownerId) throw new AppError("VALIDATION", "The owner can't be removed.");
  await db.delete(s.leagueMembers).where(and(eq(s.leagueMembers.leagueId, leagueId), eq(s.leagueMembers.userId, memberId)));
  const [e] = await db.select({ id: s.entries.id }).from(s.entries).where(and(eq(s.entries.contestId, l.contestId), eq(s.entries.userId, memberId)));
  if (e) await db.delete(s.leagueEntries).where(and(eq(s.leagueEntries.leagueId, leagueId), eq(s.leagueEntries.entryId, e.id)));
}

export async function regenerateInvite(db: Db, ownerId: string, leagueId: string) {
  await requireOwner(db, leagueId, ownerId);
  const inviteCode = newInviteCode();
  await db.update(s.leagues).set({ inviteCode, inviteExpiresAt: null }).where(eq(s.leagues.id, leagueId));
  return inviteCode;
}

export async function leaveLeague(db: Db, userId: string, leagueId: string) {
  const [l] = await db.select().from(s.leagues).where(eq(s.leagues.id, leagueId));
  if (!l) throw new AppError("NOT_FOUND", "League not found.");
  if (l.ownerId === userId) throw new AppError("VALIDATION", "Owners can't leave their own league.");
  await db.delete(s.leagueMembers).where(and(eq(s.leagueMembers.leagueId, leagueId), eq(s.leagueMembers.userId, userId)));
  const [e] = await db.select({ id: s.entries.id }).from(s.entries).where(and(eq(s.entries.contestId, l.contestId), eq(s.entries.userId, userId)));
  if (e) await db.delete(s.leagueEntries).where(and(eq(s.leagueEntries.leagueId, leagueId), eq(s.leagueEntries.entryId, e.id)));
}

export async function isMember(db: Db, leagueId: string, userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const [m] = await db.select().from(s.leagueMembers).where(and(eq(s.leagueMembers.leagueId, leagueId), eq(s.leagueMembers.userId, userId)));
  return !!m;
}
