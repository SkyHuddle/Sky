import { expect, test } from "@playwright/test";

/** Desktop layout: three-column builder with filters, pool and a sticky roster. */
test("desktop builder shows filters, pool and roster side by side", async ({ page }) => {
  await page.goto("/c/demo-meridian-major--full-run/build");
  await expect(page.getByRole("heading", { name: "Your roster" })).toBeVisible();
  await expect(page.getByText("Salary: high to low")).toBeVisible();
  const add = page.locator('button[aria-label^="Add "]:not([disabled])').first();
  await add.click();
  await expect(page.locator("aside").getByText("1/5 players")).toBeVisible();
  // Sticky roster stays in view after scrolling the pool.
  await page.mouse.wheel(0, 2500);
  await expect(page.getByRole("heading", { name: "Your roster" })).toBeInViewport();
});
