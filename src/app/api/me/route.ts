import { route } from "@/server/http";
import { publicUser } from "@/server/auth/session";

export const GET = route(async ({ viewer }) => ({ user: viewer ? publicUser(viewer) : null }));
