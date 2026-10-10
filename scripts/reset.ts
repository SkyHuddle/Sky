/** Drops all app tables (Postgres) or deletes the PGlite directory, then migrates. Development only. */
import { rmSync } from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import { createDatabase } from "../src/server/db/connect";

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Refusing to reset in production");
  if (process.env.DATABASE_URL) {
    const db = await createDatabase({ url: process.env.DATABASE_URL });
    await db.execute(sql`drop schema if exists public cascade; create schema public; drop schema if exists drizzle cascade;`);
  } else {
    rmSync(path.join(process.cwd(), ".data", "pglite"), { recursive: true, force: true });
  }
  await createDatabase({ url: process.env.DATABASE_URL, pgliteDir: path.join(process.cwd(), ".data", "pglite"), migrate: true });
  console.log("Database reset and migrated.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
