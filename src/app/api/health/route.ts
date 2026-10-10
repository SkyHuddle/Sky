import { route } from "@/server/http";
import { latestPipelineRun } from "@/server/queries/common";

export const GET = route(async ({ db }) => ({ ok: true, pipeline: await latestPipelineRun(db) }));
