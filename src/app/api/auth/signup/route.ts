import { route, readJson, setSessionCookie } from "@/server/http";
import { createSession, publicUser, signUp, userForToken } from "@/server/auth/session";

export const POST = route(
  async ({ db, req }) => {
    const userId = await signUp(db, (await readJson(req)) as never);
    const { token, expiresAt } = await createSession(db, userId);
    await setSessionCookie(token, expiresAt);
    return { user: publicUser((await userForToken(db, token))!) };
  },
  { rateLimit: { key: "signup", limit: 5, windowMs: 60 * 60_000 } },
);
