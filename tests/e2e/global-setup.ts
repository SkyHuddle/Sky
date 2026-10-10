import { execSync } from "node:child_process";

export default async function globalSetup() {
  if (process.env.E2E_SKIP_SEED === "1") return;
  execSync("npx tsx scripts/reset.ts && npx tsx scripts/seed.ts", { stdio: "inherit", env: process.env });
}
