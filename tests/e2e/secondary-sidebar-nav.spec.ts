/**
 * E2E tests translated from:
 * openspec/changes/archive/2026-03-04-secondary-sidebar-nav/tests/feature-secondary-sidebar-nav.flow.md
 *
 * Flows covered:
 *  - Secondary sidebar present on a repo route
 *  - Secondary sidebar absent on home route
 *  - Switching to collapsed mode (icons only)
 *  - Switching to expanded mode
 *  - Toggle mode persists on navigation
 *  - Expanded mode — icon and label for nav links
 *  - Active nav link is highlighted on /specs sub-route
 *  - Navigating via a sidebar link
 *  - Project group shows name and count in expanded mode
 *  - Empty projects state shows 'No projects yet.' in expanded mode
 *  - Collapsed mode shows project initials squares instead of names
 *
 * Prerequisites:
 *  - App running at baseURL (next dev or next start)
 *  - Authenticated session loaded from tests/e2e/.auth/user.json (via playwright.config.ts)
 *  - Test user (login: "e2etest") seeded with pinned repos by global-setup
 *  - /api/repos/... endpoints are mocked per-test to avoid real GitHub API calls
 */

import { test, expect } from "@playwright/test";

const REPO_ROUTE = "/repo/acme/frontend";

const MOCK_PROJECTS = [
  { slug: "auth-flow", name: "Auth Flow", specCount: 3 },
  { slug: "billing", name: "Billing", specCount: 1 },
];

const MOCK_SPECS = [
  {
    slug: "feature-auth-flow",
    group: "auth-flow",
    path: "openspec/changes/auth-flow/specs/feature-auth-flow.md",
    status: "active",
  },
];

async function mockRepoApis(
  page: import("@playwright/test").Page,
  projects = MOCK_PROJECTS,
  specs = MOCK_SPECS
) {
  await page.route("**/api/repos/**/projects", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ projects }) })
  );
  await page.route("**/api/repos/**/specs", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ specs }) })
  );
}

// ─── Visibility ───────────────────────────────────────────────────────────────

// Flow: Secondary sidebar present on a repo route
test("secondary sidebar is present on a repo route", async ({ page }) => {
  await mockRepoApis(page);
  await page.goto(REPO_ROUTE);
  await expect(page.locator("[data-testid='secondary-sidebar']")).toBeVisible();
});

// Flow: Secondary sidebar absent on home route
test("secondary sidebar is absent on the home route", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-testid='secondary-sidebar']")).not.toBeVisible();
});

// ─── Toggle ───────────────────────────────────────────────────────────────────

// Flow: Switching to collapsed mode
test("clicking toggle switches to collapsed mode (icons only)", async ({ page }) => {
  await mockRepoApis(page);
  await page.goto(REPO_ROUTE);
  await page.evaluate(() => localStorage.setItem("vantage:secondary-sidebar:mode", "expanded"));
  await page.reload();
  await mockRepoApis(page);

  // Text label is visible when expanded
  await expect(page.getByText("All Specs")).toBeVisible();

  // Click the collapse toggle (title is "Collapse sidebar" when expanded)
  await page.getByTitle("Collapse sidebar").click();

  // Text labels are gone; icon-only buttons remain
  await expect(page.getByText("All Specs")).not.toBeVisible();
  // The button title becomes the tooltip in collapsed mode
  await expect(page.getByTitle("All Specs")).toBeVisible();
});

// Flow: Switching to expanded mode
test("clicking toggle switches back to expanded mode", async ({ page }) => {
  await mockRepoApis(page);
  await page.goto(REPO_ROUTE);
  await page.evaluate(() => localStorage.setItem("vantage:secondary-sidebar:mode", "collapsed"));
  await page.reload();
  await mockRepoApis(page);

  await expect(page.getByText("All Specs")).not.toBeVisible();

  // Click the expand toggle (title is "Expand sidebar" when collapsed)
  await page.getByTitle("Expand sidebar").click();

  await expect(page.getByText("All Specs")).toBeVisible();
});

// Flow: Toggle mode persists on navigation
test("toggle mode persists to another page within same repo", async ({ page }) => {
  await mockRepoApis(page);
  await page.goto(REPO_ROUTE);
  await page.evaluate(() => localStorage.setItem("vantage:secondary-sidebar:mode", "expanded"));
  await page.reload();
  await mockRepoApis(page);

  await page.getByTitle("Collapse sidebar").click();
  await expect(page.getByText("All Specs")).not.toBeVisible();

  await mockRepoApis(page);
  await page.goto(`${REPO_ROUTE}/activity`);

  await expect(page.getByText("All Specs")).not.toBeVisible();

  const mode = await page.evaluate(() =>
    localStorage.getItem("vantage:secondary-sidebar:mode")
  );
  expect(mode).toBe("collapsed");
});

// ─── Nav links ────────────────────────────────────────────────────────────────

// Flow: Expanded mode — icon and label for nav links
test("expanded mode shows icon and label for all nav links", async ({ page }) => {
  await mockRepoApis(page);
  await page.goto(REPO_ROUTE);
  await page.evaluate(() => localStorage.setItem("vantage:secondary-sidebar:mode", "expanded"));
  await page.reload();
  await mockRepoApis(page);

  await expect(page.getByText("All Specs")).toBeVisible();
  await expect(page.getByText("Activity")).toBeVisible();
  await expect(page.getByText("Settings")).toBeVisible();
});

// Flow: Active nav link is highlighted
test("active nav link is highlighted on /specs sub-route", async ({ page }) => {
  await mockRepoApis(page);
  await page.goto(`${REPO_ROUTE}/specs`, { timeout: 60000 });
  await page.evaluate(() => localStorage.setItem("vantage:secondary-sidebar:mode", "expanded"));
  await page.reload({ timeout: 60000 });
  await mockRepoApis(page);

  // The "All Specs" button should have aria-current="page" when on the /specs route
  const allSpecsBtn = page.getByRole("button", { name: "All Specs" });
  await expect(allSpecsBtn).toHaveAttribute("aria-current", "page");
});

// Flow: Navigating via a sidebar link
test("clicking Activity nav link navigates to /activity", async ({ page }) => {
  await mockRepoApis(page);
  await page.goto(REPO_ROUTE);
  await page.evaluate(() => localStorage.setItem("vantage:secondary-sidebar:mode", "expanded"));
  await page.reload();
  await mockRepoApis(page);

  await page.getByRole("button", { name: "Activity" }).click();
  await expect(page).toHaveURL(`${REPO_ROUTE}/activity`);
});

// ─── Projects section ─────────────────────────────────────────────────────────

// Flow: Collapsed project group in expanded mode
test("project group shows name and count in expanded mode", async ({ page }) => {
  await mockRepoApis(page);
  await page.goto(REPO_ROUTE);
  await page.evaluate(() => localStorage.setItem("vantage:secondary-sidebar:mode", "expanded"));
  await page.reload();
  await mockRepoApis(page);

  // Wait for the mocked projects to render
  await expect(page.getByText("Auth Flow")).toBeVisible({ timeout: 5000 });
  await expect(page.getByText("Billing")).toBeVisible();
  // Spec counts are shown
  await expect(page.getByText("3")).toBeVisible();
  await expect(page.getByText("1")).toBeVisible();
});

// Flow: Expanding a project group
test("clicking a project group expands spec list", async ({ page }) => {
  await mockRepoApis(page);
  await page.goto(REPO_ROUTE);
  await page.evaluate(() => localStorage.setItem("vantage:secondary-sidebar:mode", "expanded"));
  await page.reload();
  await mockRepoApis(page);

  await page.getByText("Auth Flow").click();

  // Spec items inside the group become visible (feature- prefix is stripped from display label)
  await expect(page.getByText("auth-flow")).toBeVisible({ timeout: 3000 });
});

// Flow: Collapsing an expanded project group
test("clicking a project group again collapses the spec list", async ({ page }) => {
  await mockRepoApis(page);
  await page.goto(REPO_ROUTE);
  await page.evaluate(() => localStorage.setItem("vantage:secondary-sidebar:mode", "expanded"));
  await page.reload();
  await mockRepoApis(page);

  await page.getByText("Auth Flow").click(); // expand
  await expect(page.getByText("auth-flow")).toBeVisible({ timeout: 3000 });

  await page.getByText("Auth Flow").click(); // collapse
  await expect(page.getByText("auth-flow")).not.toBeVisible();
});

// Flow: Project groups in collapsed sidebar mode
test("collapsed mode shows project initials squares instead of names", async ({ page }) => {
  await mockRepoApis(page);
  await page.goto(REPO_ROUTE);
  await page.evaluate(() => localStorage.setItem("vantage:secondary-sidebar:mode", "collapsed"));
  await page.reload();
  await mockRepoApis(page);

  // Project name labels are not visible
  await expect(page.getByText("Auth Flow")).not.toBeVisible();
  await expect(page.getByText("Billing")).not.toBeVisible();
  // "Projects" section header also hidden
  await expect(page.getByText("Projects", { exact: true })).not.toBeVisible();
});

// Flow: Empty projects list
test("empty projects state shows 'No projects yet.' in expanded mode", async ({ page }) => {
  await page.route("**/api/repos/**/projects", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ projects: [] }),
    })
  );
  await page.route("**/api/repos/**/specs", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ specs: [] }) })
  );

  await page.goto(REPO_ROUTE);
  await page.evaluate(() => localStorage.setItem("vantage:secondary-sidebar:mode", "expanded"));
  await page.reload();

  await page.route("**/api/repos/**/projects", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ projects: [] }),
    })
  );
  await page.route("**/api/repos/**/specs", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ specs: [] }) })
  );

  await expect(page.getByText("No projects yet.")).toBeVisible({ timeout: 5000 });
});
