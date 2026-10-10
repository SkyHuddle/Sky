/** Applies pending migrations from ./drizzle. */
import path from "node:path";
import { createDatabase } from "../src/server/db/connect";

createDatabase({ url: process.env.DATABASE_URL, pgliteDir: path.join(process.cwd(), ".data", "pglite"), migrate: true })
  .then(() => {
    console.log("Migrations applied.");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
