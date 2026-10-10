import { defineConfig, devices } from "@playwright/test";

/**
 * Browser end-to-end tests. The global setup resets and reseeds the database, so the suite always
 * starts from the same demo world. Runs against a production build (`next build && next start`),
 * which is what users get and avoids dev-mode compile delays.
 */
const port = Number(process.env.E2E_PORT ?? 3100);
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 240_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  // Order matters: the journey plays the demo Major to completion, so it runs last.
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } }, testMatch: /desktop|a11y/ },
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium" }, testMatch: /a11y|journey/, dependencies: ["desktop"] },
  ],
  webServer: {
    command: process.env.E2E_SKIP_BUILD === "1" ? `npx next start -p ${port}` : `npx next build && npx next start -p ${port}`,
    url: `http://127.0.0.1:${port}/api/health`,
    reuseExistingServer: true,
    timeout: 400_000,
  },
});
