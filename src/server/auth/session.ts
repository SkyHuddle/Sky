import { randomBytes } from "node:crypto";
import { and, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db/connect";
import * as s from "../db/schema";
import { AppError } from "../errors";
import { sha256 } from "../ids";
import { hashPassword, verifyPassword } from "./password";

/**
 * Accounts and sessions. Opaque random session tokens in an httpOnly cookie; only the token's
 * SHA-256 is stored, so a database leak can't be replayed as sessions.
 */

export const SESSION_COOKIE = "lk_session";
export const SESSION_TTL_MS = 30 * 86_400_000;

export const signUpSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Usernames need at least 3 characters")
    .max(20, "Usernames can be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Use letters, numbers and underscores only"),
  email: z.string().trim().email("Enter a valid email address").max(254),
  password: z.string().min(8, "Use at least 8 characters").max(200),
});

export const signInSchema = z.object({
  login: z.string().trim().min(1, "Enter your username or email"),
  password: z.string().min(1, "Enter your password"),
});

export async function signUp(db: Db, input: z.input<typeof signUpSchema>) {
  const data = signUpSchema.parse(input);
  const taken = await db
    .select({ id: s.users.id })
    .from(s.users)
    .where(sql`lower(${s.users.username}) = lower(${data.username}) or lower(${s.users.email}) = lower(${data.email})`);
  if (taken.length) throw new AppError("CONFLICT", "That username or email is already registered.");
  const id = crypto.randomUUID();
  await db.insert(s.users).values({
    id,
    username: data.username,
    email: data.email.toLowerCase(),
    passwordHash: await hashPassword(data.password),
    displayName: data.username,
    avatarHue: Math.floor(Math.random() * 360),
  });
  return id;
}

export async function signIn(db: Db, input: z.input<typeof signInSchema>) {
  const data = signInSchema.parse(input);
  const [u] = await db
    .select()
    .from(s.users)
    .where(sql`lower(${s.users.username}) = lower(${data.login}) or lower(${s.users.email}) = lower(${data.login})`);
  // Same error for unknown user and wrong password; always run a hash comparison.
  const ok = u ? await verifyPassword(data.password, u.passwordHash) : await verifyPassword(data.password, DUMMY_HASH);
  if (!u || !ok || u.isBot) throw new AppError("UNAUTHENTICATED", "That username/email and password don't match.");
  return u.id;
}

const DUMMY_HASH = "scrypt$131072$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" + "A".repeat(86) + "==";

export async function createSession(db: Db, userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(s.sessions).values({ tokenHash: sha256(token), userId, expiresAt });
  return { token, expiresAt };
}

export async function userForToken(db: Db, token: string | undefined) {
  if (!token) return null;
  const [row] = await db
    .select({ user: s.users })
    .from(s.sessions)
    .innerJoin(s.users, eq(s.users.id, s.sessions.userId))
    .where(and(eq(s.sessions.tokenHash, sha256(token)), gt(s.sessions.expiresAt, new Date())));
  return row?.user ?? null;
}

export async function destroySession(db: Db, token: string | undefined) {
  if (!token) return;
  await db.delete(s.sessions).where(eq(s.sessions.tokenHash, sha256(token)));
}

export type SessionUser = typeof s.users.$inferSelect;
export const publicUser = (u: SessionUser) => ({
  id: u.id,
  username: u.username,
  displayName: u.displayName,
  avatarHue: u.avatarHue,
  isAdmin: u.isAdmin,
});
export type PublicUser = ReturnType<typeof publicUser>;
