import { cookies } from "next/headers";
import { route, clearSessionCookie } from "@/server/http";
import { SESSION_COOKIE, destroySession } from "@/server/auth/session";

export const POST = route(async ({ db }) => {
  await destroySession(db, (await cookies()).get(SESSION_COOKIE)?.value);
  await clearSessionCookie();
  return { ok: true };
});
