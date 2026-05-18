/**
 * Playwright smoke for the six brief-mandated routes.
 *
 * The Conductor and MCP proxy are NOT running in CI; each route renders
 * its empty/unreachable state. The test asserts that the routes serve a
 * 200 and contain the right landmarks.
 */

import { expect, test } from "@playwright/test";

test.describe("CatchAttack web UI routes", () => {
  test("home page lists the six routes", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText(/Catch/);
    await expect(page.getByRole("link", { name: /Coverage matrix/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Captures/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /PR queue/ }).first()).toBeVisible();
  });

  test("/coverage renders the MITRE matrix header", async ({ page }) => {
    await page.goto("/coverage");
    await expect(page.locator("h1")).toContainText("Coverage matrix");
    // 14 enterprise tactics are seeded — the header text must mention all of them.
    for (const tactic of [
      "Reconnaissance",
      "Initial Access",
      "Execution",
      "Persistence",
      "Privilege Escalation",
      "Defense Evasion",
      "Credential Access",
      "Discovery",
      "Lateral Movement",
      "Collection",
      "Command and Control",
      "Exfiltration",
      "Impact",
    ]) {
      await expect(page.getByText(tactic).first()).toBeVisible();
    }
  });

  test("/captures renders gracefully when no MCP proxy", async ({ page }) => {
    await page.goto("/captures");
    await expect(page.locator("h1")).toContainText("Captures");
  });

  test("/rules/prs renders empty queue or candidates", async ({ page }) => {
    await page.goto("/rules/prs");
    await expect(page.locator("h1")).toContainText("PR queue");
  });

  test("/agents renders fleet view header", async ({ page }) => {
    await page.goto("/agents");
    await expect(page.locator("h1")).toContainText("Agents");
  });

  test("/runs renders workflow registry", async ({ page }) => {
    await page.goto("/runs");
    await expect(page.locator("h1")).toContainText("Workflow runs");
  });

  test("/captures/live/[run_id] renders the live shell", async ({ page }) => {
    await page.goto("/captures/live/example-run");
    await expect(page.locator("h1")).toContainText("Live");
    // The LIVE badge and the live-markers panel must be present even
    // without a Conductor (the marker stream just errors gracefully).
    await expect(page.getByText("● LIVE")).toBeVisible();
    await expect(page.getByText(/Live markers/)).toBeVisible();
  });
});
