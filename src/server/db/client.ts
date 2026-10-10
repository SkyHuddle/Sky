import "server-only";
import path from "node:path";
import { createDatabase, type Db } from "./connect";

/**
 * The app's database handle. One instance per server process, created lazily and migrated
 * on first use. DATABASE_URL selects real PostgreSQL; without it, an embedded PGlite database
 * in .data/ is used (development and demos only).
 */

declare global {
  var __lockinDb: Promise<Db> | undefined;
}

export function getDb(): Promise<Db> {
  if (!globalThis.__lockinDb) {
    globalThis.__lockinDb = createDatabase({
      url: process.env.DATABASE_URL,
      pgliteDir: path.join(process.cwd(), ".data", "pglite"),
      migrate: true,
    }).catch((err) => {
      globalThis.__lockinDb = undefined;
      throw err;
    });
  }
  return globalThis.__lockinDb;
}

export type { Db } from "./connect";
