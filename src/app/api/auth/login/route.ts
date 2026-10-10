import { route, readJson, setSessionCookie } from "@/server/http";
import { createSession, publicUser, signIn, userForToken } from "@/server/auth/session";

export const POST = route(
  async ({ db, req }) => {
    const userId = await signIn(db, (await readJson(req)) as never);
    const { token, expiresAt } = await createSession(db, userId);
    await setSessionCookie(token, expiresAt);
    return { user: publicUser((await userForToken(db, token))!) };
  },
  { rateLimit: { key: "login", limit: 10, windowMs: 15 * 60_000 } },
);
