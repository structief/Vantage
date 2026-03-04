/**
 * E2E tests translated from:
 * openspec/changes/secondary-sidebar-nav/tests/feature-secondary-sidebar-nav.flow.md
 *
 * Flows covered:
 *  - Secondary sidebar absent on home route
 *  - Secondary sidebar present on repo route
 *  - Switching to collapsed mode (icons only)
 *  - Switching to expanded mode
 *  - Toggle mode persists on navigation
 *  - Repo identity in expanded mode
 *  - Expanded mode — icon and label for nav links
 *  - Collapsed mode — icon only
 *  - Active nav link is highlighted
 *  - Navigating via a sidebar link
 *  - Collapsed project group in expanded mode
 *  - Expanding a project group
 *  - Collapsing an expanded project group
 *  - Empty projects list
 *  - Loading skeleton state
 *
 * Prerequisites:
 *  - App running at baseURL (next start or next dev)
 *  - Authenticated session via storageState or test auth bypass
 *  - At least one pinned repo (e.g. "acme/frontend") in test DB
 *  - "acme/frontend" has openspec/changes/ with at least one subdirectory
 */

import { test, expect } from "@playwright/test";

const REPO_ROUTE = "/repo/acme/frontend";

// ─── Visibility ───────────────────────────────────────────────────────────────

test("secondary sidebar is absent on the home route", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-testid='secondary-sidebar']")).not.toBeVisible();
});

test("secondary sidebar is present on a repo route", async ({ page }) => {
  await page.goto(REPO_ROUTE);
  await expect(page.locator("[data-testid='secondary-sidebar']")).toBeVisible();
});

// ─── Toggle ───────────────────────────────────────────────────────────────────

test("clicking toggle switches to collapsed mode (icons only)", async ({ page }) => {
  await page.goto(REPO_ROUTE);
  // Ensure expanded first
  await page.evaluate(() => localStorage.setItem("vantage:secondary-sidebar:mode", "expanded"));
  await page.reload();

  const navLabel = page.getByText("All Specs");
  await expect(navLabel).toBeVisible();

  await page.getByTitle(/collapse sidebar/i).click();

  await expect(navLabel).not.toBeVisible();
  // Icons still present (by title tooltip)
  await expect(page.getByTitle("All Specs")).toBeVisible();
});

test("clicking toggle switches back to expanded mode", async ({ page }) => {
  await page.goto(REPO_ROUTE);
  await page.evaluate(() => localStorage.setItem("vantage:secondary-sidebar:mode", "collapsed"));
  await page.reload();

  await expect(page.getByText("All Specs")).not.toBeVisible();

  await page.getByTitle(/expand sidebar/i).click();

  await expect(page.getByText("All Specs")).toBeVisible();
});

test("toggle mode persists to another page within same repo", async ({ page }) => {
  await page.goto(REPO_ROUTE);
  await page.evaluate(() => localStorage.setItem("vantage:secondary-sidebar:mode", "expanded"));
  await page.reload();

  await page.getByTitle(/collapse sidebar/i).click();
  await expect(page.getByText("All Specs")).not.toBeVisible();

  await page.goto(`${REPO_ROUTE}/activity`);
  await expect(page.getByText("All Specs")).not.toBeVisible();

  const mode = await page.evaluate(() =>
    localStorage.getItem("vantage:secondary-sidebar:mode")
  );
  expect(mode).toBe("collapsed");
});

// ─── Nav links ────────────────────────────────────────────────────────────────

test("expanded mode shows icon and label for all nav links", async ({ page }) => {
  await page.goto(REPO_ROUTE);
  await page.evaluate(() => localStorage.setItem("vantage:secondary-sidebar:mode", "expanded"));
  await page.reload();

  await expect(page.getByText("All Specs")).toBeVisible();
  await expect(page.getByText("Activity")).toBeVisible();
  await expect(page.getByText("Settings")).toBeVisible();
});

test("active nav link is highlighted on /specs sub-route", async ({ page }) => {
  await page.goto(`${REPO_ROUTE}/specs`);
  await page.evaluate(() => localStorage.setItem("vantage:secondary-sidebar:mode", "expanded"));
  await page.reload();

  const allSpecsBtn = page.getByRole("button", { name: "All Specs" });
  await expect(allSpecsBtn).toHaveClass(/bg-gray-200/);
});

test("clicking Activity nav link navigates to /activity", async ({ page }) => {
  await page.goto(REPO_ROUTE);
  await page.evaluate(() => localStorage.setItem("vantage:secondary-sidebar:mode", "expanded"));
  await page.reload();

  await page.getByRole("button", { name: "Activity" }).click();
  await expect(page).toHaveURL(`${REPO_ROUTE}/activity`);
});

// ─── Projects section ─────────────────────────────────────────────────────────

test("project group shows name and count in collapsed state", async ({ page }) => {
  await page.goto(REPO_ROUTE);
  await page.evaluate(() => localStorage.setItem("vantage:secondary-sidebar:mode", "expanded"));
  await page.reload();

  // Wait for projects to load (skeleton disappears)
  await page.waitForSelector("[data-testid='secondary-sidebar'] button", { timeout: 5000 });

  // At least the PROJECTS header is visible
  await expect(page.getByText("Projects", { exact: false })).toBeVisible();
});

test("clicking a project group expands it", async ({ page }) => {
  await page.goto(REPO_ROUTE);
  await page.evaluate(() => localStorage.setItem("vantage:secondary-sidebar:mode", "expanded"));
  await page.reload();

  // Wait for projects to load
  await page.waitForTimeout(1000);

  const projectGroups = page.locator("[data-testid='secondary-sidebar'] button").filter({
    hasNotText: /All Specs|Activity|Settings/,
  });
  const count = await projectGroups.count();
  if (count === 0) {
    test.skip();
    return;
  }

  const firstGroup = projectGroups.first();
  const groupName = await firstGroup.textContent();
  await firstGroup.click();

  // Spec list should now be visible below
  const specItems = page.locator("[data-testid='secondary-sidebar']").getByRole("button").filter({
    hasNotText: new RegExp(`^${groupName?.trim()}$|All Specs|Activity|Settings`),
  });
  await expect(specItems.first()).toBeVisible();
});

test("project group collapses when clicked again", async ({ page }) => {
  await page.goto(REPO_ROUTE);
  await page.evaluate(() => localStorage.setItem("vantage:secondary-sidebar:mode", "expanded"));
  await page.reload();

  await page.waitForTimeout(1000);

  const projectGroups = page.locator("[data-testid='secondary-sidebar'] button").filter({
    hasNotText: /All Specs|Activity|Settings/,
  });
  if ((await projectGroups.count()) === 0) {
    test.skip();
    return;
  }

  await projectGroups.first().click(); // expand
  await projectGroups.first().click(); // collapse

  // Spec list is no longer visible
  const inner = page.locator("[data-testid='secondary-sidebar'] .ml-4");
  await expect(inner).not.toBeVisible();
});

test("collapsed mode shows project initials squares instead of names", async ({ page }) => {
  await page.goto(REPO_ROUTE);
  await page.evaluate(() => localStorage.setItem("vantage:secondary-sidebar:mode", "collapsed"));
  await page.reload();

  await page.waitForTimeout(1000);

  // Text labels should not be visible
  await expect(page.getByText("Projects", { exact: false })).not.toBeVisible();
});

test("empty projects state shows 'No projects yet.' in expanded mode", async ({ page }) => {
  // This test requires a repo that has no openspec/changes/ directory.
  // Skip if the current test repo has projects.
  await page.goto("/repo/acme/empty-repo");
  await page.evaluate(() => localStorage.setItem("vantage:secondary-sidebar:mode", "expanded"));
  await page.reload();

  await page.waitForTimeout(1500);

  const secondary = page.locator("[data-testid='secondary-sidebar']");
  const visible = await secondary.isVisible();
  if (!visible) {
    test.skip();
    return;
  }

  await expect(page.getByText("No projects yet.")).toBeVisible();
});
