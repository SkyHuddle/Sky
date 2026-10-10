import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** Automated accessibility checks (axe) on the main screens: no serious or critical violations. */
const pages = ["/", "/t/meridian-major", "/t/meridian-major/fantasy", "/t/harbor-cup/standings", "/c/demo-meridian-major--full-run/build", "/leagues", "/signin"];

for (const path of pages) {
  test(`a11y ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page: page as never }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.nodes.length} nodes, e.g. ${v.nodes[0]?.target.join(" ")} ${v.nodes[0]?.failureSummary?.slice(0, 160)}`)).toEqual([]);
  });
}
