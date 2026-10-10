/**
 * Captures screenshots of key routes at phone and desktop sizes for design review.
 * Usage: npx tsx scripts/screenshots.ts [outDir] [path ...]
 * Env: BASE_URL (default http://127.0.0.1:3000), LOGIN=user:password to sign in first.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const out = process.argv[2] ?? "screenshots";
const routes = process.argv.slice(3).length ? process.argv.slice(3) : ["/"];

async function login(page: Page) {
  const cred = process.env.LOGIN;
  if (!cred) return;
  const [user, pass] = cred.split(":");
  const res = await page.request.post(`${base}/api/auth/login`, {
    data: { login: user, password: pass },
    headers: { origin: base },
  });
  if (!res.ok()) throw new Error(`login failed: ${res.status()} ${await res.text()}`);
}

async function main() {
  mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const sizes = [
    { name: "mobile", width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    { name: "desktop", width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  ];
  for (const size of sizes) {
    const ctx = await browser.newContext({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: size.deviceScaleFactor, isMobile: size.isMobile, hasTouch: size.hasTouch, colorScheme: "dark" });
    const page = await ctx.newPage();
    await login(page);
    for (const r of routes) {
      await page.goto(base + r, { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      const file = path.join(out, `${size.name}${r.replace(/[/?=&]+/g, "_") || "_home"}.png`);
      await page.screenshot({ path: file, fullPage: process.env.FULL !== "0" });
      console.log(file);
    }
    await ctx.close();
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
