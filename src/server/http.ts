import "server-only";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { SESSION_COOKIE, SESSION_TTL_MS, userForToken, type SessionUser } from "./auth/session";
import { getDb, type Db } from "./db/client";
import { AppError, isAppError } from "./errors";
import { rateLimit } from "./rateLimit";

/** The signed-in user for the current request, or null. */
export async function getViewer(): Promise<SessionUser | null> {
  const db = await getDb();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return userForToken(db, token);
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * CSRF protection for state-changing requests: the Origin (or Referer) must match the Host.
 * Combined with SameSite=Lax session cookies.
 */
async function assertSameOrigin(req: Request) {
  if (req.method === "GET" || req.method === "HEAD") return;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const origin = h.get("origin") ?? h.get("referer");
  if (!origin || !host) throw new AppError("FORBIDDEN", "Request origin could not be verified.");
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new AppError("FORBIDDEN", "Request origin could not be verified.");
  }
  if (originHost !== host) throw new AppError("FORBIDDEN", "Cross-site requests aren't allowed.");
}

export interface RouteContext {
  db: Db;
  viewer: SessionUser | null;
  req: Request;
  requireUser: () => SessionUser;
}

/**
 * Wraps a route handler: same-origin check, optional rate limit, viewer lookup, and mapping of
 * AppError / ZodError to consistent JSON errors: { error: { code, message, details? } }.
 */
export function route<P = Record<string, string>>(
  handler: (ctx: RouteContext, params: P) => Promise<unknown>,
  opts: { rateLimit?: { key: string; limit: number; windowMs: number } } = {},
) {
  return async (req: Request, context: { params: Promise<P> }) => {
    try {
      await assertSameOrigin(req);
      const db = await getDb();
      const viewer = await userForToken(db, (await cookies()).get(SESSION_COOKIE)?.value);
      if (opts.rateLimit) {
        const h = await headers();
        const who = viewer?.id ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
        rateLimit(`${opts.rateLimit.key}:${who}`, opts.rateLimit.limit, opts.rateLimit.windowMs);
      }
      const requireUser = () => {
        if (!viewer) throw new AppError("UNAUTHENTICATED", "Sign in to continue.");
        return viewer;
      };
      const params = (await context.params) ?? ({} as P);
      const result = await handler({ db, viewer, req, requireUser }, params);
      if (result instanceof Response) return result;
      return NextResponse.json(result ?? { ok: true });
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export function errorResponse(err: unknown) {
  if (isAppError(err)) {
    return NextResponse.json({ error: { code: err.code, message: err.message, details: err.details ?? null } }, { status: err.status });
  }
  if (err instanceof ZodError) {
    const first = err.issues[0];
    return NextResponse.json(
      { error: { code: "VALIDATION", message: first?.message ?? "Check the form and try again.", details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })) } },
      { status: 400 },
    );
  }
  console.error("[api] unexpected error", err);
  return NextResponse.json({ error: { code: "INTERNAL", message: "Something went wrong on our side. Your saved data is safe; please try again." } }, { status: 500 });
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new AppError("VALIDATION", "The request body must be JSON.");
  }
}
