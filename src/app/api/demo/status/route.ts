import { route } from "@/server/http";
import { demoStatus } from "@/server/services/demo";

export const GET = route(async ({ db }) => demoStatus(db));
