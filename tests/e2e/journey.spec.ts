import { expect, test, type Page } from "@playwright/test";
import { inviteCode, liveMatchId } from "./helpers";

/**
 * The MVP acceptance journey (22 steps), on a phone-sized viewport, against persisted data.
 * Results come from the demo provider through the real ingestion and scoring pipeline.
 */

const CONTEST = "demo-meridian-major--full-run";
const user = `fan_${Date.now().toString(36).slice(-6)}`;

async function advanceDemo(page: Page, expectLabel: RegExp) {
  await page.getByRole("button", { name: "Demo", exact: true }).click();
  const run = page.getByRole("button", { name: expectLabel });
  await expect(run).toBeEnabled();
  await run.click();
  await expect(page.getByText(/results are in/)).toBeVisible({ timeout: 120_000 });
  await page.keyboard.press("Escape");
}

async function addFirstAvailable(page: Page, count: number) {
  for (let i = 0; i < count; i++) {
    await page.locator('button[aria-label^="Add "]:not([disabled])').filter({ visible: true }).first().click();
  }
}

/** The builder renders a mobile tray and a desktop roster (one hidden by CSS); target what's visible. */
const vis = (page: Page, text: string | RegExp) => page.getByText(text).filter({ visible: true }).first();

test("a new fan builds a team, joins a league, follows scoring, transfers, and sees the result", async ({ page }) => {
  test.setTimeout(600_000); // a whole Major, stage by stage, plus a live replay
  // 1–2. Open the site and browse tournaments.
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Meridian Major" })).toBeVisible();
  await page.getByRole("link", { name: /tournament overview/ }).click();
  await page.waitForURL(/\/t\/meridian-major$/, { timeout: 90_000 });

  // 3–4. Select the fantasy competition and read the rules.
  await page.getByRole("navigation", { name: "Tournament sections" }).getByRole("link", { name: "Fantasy" }).click();
  await expect(page.getByRole("heading", { name: "Rules and scoring" })).toBeVisible();
  await expect(page.getByText("Two contests, two ways to play")).toBeVisible();

  // 5. Create an account (returning straight to the builder).
  await page.goto(`/signup?next=${encodeURIComponent(`/c/${CONTEST}/build`)}`);
  await page.getByLabel("Username").fill(user);
  await page.getByLabel("Email").fill(`${user}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill("a-strong-password");
  await page.getByRole("button", { name: "Create account" }).click();

  // 6. The roster builder.
  await page.waitForURL(new RegExp(`/c/${CONTEST}/build`), { timeout: 90_000 });
  await expect(vis(page, "0 of 5 players")).toBeVisible();

  // 7. Search and filter.
  await page.getByPlaceholder("Search players or teams").fill("zzzz");
  await expect(page.getByText("No players match")).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await page.getByRole("button", { name: /^Team/ }).click();
  await page.getByRole("dialog").getByRole("button").filter({ hasText: /\w/ }).nth(0).click();
  await page.getByRole("button", { name: "Show players" }).click();
  await expect(page.getByText("5 of 80 players")).toBeVisible();

  // 8. Inspect a player's statistics.
  await page.getByRole("button", { name: /View details/ }).first().click();
  await expect(page.getByRole("tab", { name: "Stats" })).toBeVisible();
  await page.getByRole("tab", { name: "Stats" }).click();
  await expect(page.getByRole("dialog").getByText("K–D–A")).toBeVisible();
  await page.keyboard.press("Escape");

  // 9–11. Add players, respecting the team limit and the cap.
  await addFirstAvailable(page, 2); // two from the filtered team
  const blocked = page.locator('button[aria-label*="can\'t be added: 2 from this team already"]').first();
  await expect(blocked).toBeDisabled();
  await page.getByRole("button", { name: /^\d+ teams?/ }).click();
  await page.getByRole("button", { name: "Clear" }).click();
  await page.getByRole("button", { name: "Show players" }).click();
  await page.getByRole("button", { name: /Sort:/ }).click();
  await page.getByRole("button", { name: "Salary: low to high" }).click();
  await addFirstAvailable(page, 3);
  await expect(vis(page, "5 of 5 players")).toBeVisible();
  await expect(vis(page, "Lineup complete")).toBeVisible();

  // 12–13. Review the team and choose a captain.
  await page.getByRole("button", { name: "Review Team" }).filter({ visible: true }).first().click();
  await expect(page.getByRole("heading", { name: "Your team" })).toBeVisible();
  await page.getByRole("button", { name: /^Make .+ captain$/ }).first().click();
  await expect(page.getByText("Captain chosen (scores 1.5×)")).toBeVisible();

  // 14. Submit.
  await page.getByRole("button", { name: "Submit Team" }).click();
  await expect(page.getByRole("heading", { name: "You're in" })).toBeVisible();

  // 15. Return later and see the saved entry.
  await page.goto("/fantasy");
  await page.getByRole("link", { name: /Meridian Major/ }).first().click();
  await page.waitForURL(/\/e\//, { timeout: 90_000 }); // first visit compiles the route in dev mode
  const entryUrl = page.url();
  await expect(page.getByText("Fantasy points")).toBeVisible();

  // 16. Join a private league with the existing entry.
  const code = await inviteCode(`${CONTEST}--friday`);
  await page.goto(`/join/${code}`);
  await expect(page.getByRole("heading", { name: "Friday Night CS" })).toBeVisible();
  await page.getByRole("button", { name: "Join league" }).click();
  await expect(page.getByText(/You're in\./)).toBeVisible();
  const leagueUrl = page.url();

  // Live: replay the first Stage 1 series through the real pipeline; pages update over SSE without reloading.
  await page.getByRole("button", { name: "Demo", exact: true }).click();
  await page.getByRole("button", { name: /^Watch live/ }).click();
  await page.waitForURL(/\/live$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: /^Updated/ }).first()).toBeVisible({ timeout: 60_000 });
  const matchId = await liveMatchId("demo-meridian-major");
  await page.goto(`/live/match/${matchId}`);
  const round = page.getByText(/· round \d+$/).first();
  await expect(round).toBeVisible({ timeout: 60_000 });
  const firstRound = await round.innerText();
  await expect.poll(async () => (await round.isVisible()) ? await round.innerText() : "map finished", { timeout: 90_000 }).not.toBe(firstRound);
  await expect(page.getByText(/Round-by-round play isn't supplied/)).toBeVisible();

  // 18. Results arrive: the demo clock plays Stage 1 through the real pipeline.
  await advanceDemo(page, /Play Stage 1/);

  // 17. Find my name on the league leaderboard.
  await page.goto(leagueUrl);
  await expect(page.locator("ol").getByText(user, { exact: false }).first()).toBeVisible();

  // 19–20. Points from ingested results, how they were awarded, and my ranking.
  await page.goto(entryUrl);
  await expect(page.getByText(/^of \d/)).toBeVisible();
  await page.getByRole("tab", { name: "Stage 1" }).click();
  const firstPlayer = page.locator('section[aria-labelledby="roster-h"] button[aria-expanded]').first();
  await firstPlayer.click();
  await expect(page.getByText(/Map 1 ·/).first()).toBeVisible();
  await expect(page.getByText("Map average").first()).toBeVisible();

  // 21. Permitted roster changes during the transfer window.
  await page.getByRole("link", { name: "Make Transfers" }).click();
  await expect(page.getByText(/transfers used/)).toBeVisible();
  const outChip = page.getByRole("button", { name: /Remove eliminated player/ });
  while ((await outChip.count()) > 0) await outChip.first().click(); // free replacements
  const alive = page.locator('li button[aria-label^="Remove "]:not([aria-label*="eliminated"])').filter({ visible: true }).first();
  if (await alive.count()) await alive.click(); // one discretionary transfer
  const tray = page.getByText(/^\d of 5 players$/).filter({ visible: true }).first();
  const missing = 5 - Number((await tray.innerText()).trim().split(" ")[0]);
  await addFirstAvailable(page, missing);
  await page.getByRole("button", { name: "Review Team" }).filter({ visible: true }).first().click();
  if (await page.getByText("Choose a captain").count()) await page.getByRole("button", { name: /^Make .+ captain$/ }).first().click();
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByRole("heading", { name: "Changes saved" })).toBeVisible();

  // 22. Play out the tournament, settle, and see the result on the profile.
  await page.goto(entryUrl);
  await advanceDemo(page, /Play Stage 2/);
  await advanceDemo(page, /Play Stage 3/);
  await advanceDemo(page, /Play Quarterfinals/);
  await advanceDemo(page, /Play Semifinals/);
  await advanceDemo(page, /Play Grand Final/);
  await advanceDemo(page, /Settle final results/);

  // The recap, a stage cup, and the share image.
  await page.goto(entryUrl);
  await expect(page.getByText("Final result", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^\d+(st|nd|rd|th) of \d/ })).toBeVisible();
  await expect(page.getByText("Fantasy MVP")).toBeVisible();
  const image = await page.request.get(`/api/og/entry/${entryUrl.split("/e/")[1]}`);
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toContain("image/png");
  await page.goto(`/c/${CONTEST}/leaderboard`);
  await page.getByRole("tab", { name: "Grand Final Cup" }).click();
  await expect(page.getByRole("tab", { name: "Grand Final Cup" })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("ol[aria-busy=false] li").first()).toBeVisible();

  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: user })).toBeVisible();
  const history = page.getByRole("region", { name: "Tournament history" });
  await expect(history.getByText("Meridian Major (Demo)")).toBeVisible();
  await expect(history.getByText(/Full Run · Final/)).toBeVisible();
});
