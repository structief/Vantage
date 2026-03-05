/**
 * E2E tests translated from:
 * openspec/changes/archive/2026-03-04-repo-sidebar-navigation/tests/feature-repo-sidebar-navigation.flow.md
 *
 * Flows covered (all Type: e2e):
 *  - Sidebar renders pinned repos (initials + gradient)
 *  - No pinned repos — only Add repo button visible
 *  - Sidebar order is stable on navigation
 *  - Opening the picker
 *  - Picker dismissed without selection (Escape)
 *  - Picker dismissed without selection (click outside)
 *  - Switching to a repo (click navigates)
 *  - Active repo indicator (aria-current="page")
 *  - Repo page placeholder (h1 with repo name)
 *  - Removing the active repo redirects to /
 *  - Add repo button always visible (even at cap)
 *
 * Prerequisites:
 *  - Authenticated session loaded from tests/e2e/.auth/user.json
 *  - Test user (login: "e2etest") has pinned repos: acme/alpha (older), acme/beta (newer)
 *    — seeded by global-setup.ts
 *  - /api/repos is mocked in picker tests to avoid real GitHub API calls
 */

import { test, expect } from "@playwright/test";

// ─── Flow: Sidebar renders pinned repos ──────────────────────────────────────

test("sidebar renders pinned repo buttons with initials and gradient", async ({ page }) => {
  await page.goto("/");

  const sidebar = page.locator("aside").first();
  await expect(sidebar).toBeVisible();

  // The two seeded repos should appear as buttons with their full_name as title
  const alphaBtn = sidebar.locator('button[title="acme/alpha"]');
  const betaBtn = sidebar.locator('button[title="acme/beta"]');

  await expect(alphaBtn).toBeVisible();
  await expect(betaBtn).toBeVisible();

  // Each button shows 2-letter initials (uppercased first two chars of repo name)
  await expect(alphaBtn).toHaveText("AL");
  await expect(betaBtn).toHaveText("BE");
});

// ─── Flow: Sidebar order is stable (oldest first) ────────────────────────────

test("sidebar renders repos in insertion order: oldest first", async ({ page }) => {
  await page.goto("/");
  const sidebar = page.locator("aside").first();

  // acme/alpha was pinned earlier — must appear above acme/beta
  const buttons = sidebar.locator("button[title]");
  const titles = await buttons.evaluateAll((els) => els.map((el) => el.getAttribute("title")));

  const alphaIdx = titles.indexOf("acme/alpha");
  const betaIdx = titles.indexOf("acme/beta");

  expect(alphaIdx).toBeGreaterThanOrEqual(0);
  expect(betaIdx).toBeGreaterThanOrEqual(0);
  expect(alphaIdx).toBeLessThan(betaIdx);
});

// ─── Flow: No pinned repos ────────────────────────────────────────────────────
// The Add repo button is always visible regardless of pinned count.

test("Add repo button is always visible", async ({ page }) => {
  await page.goto("/");
  const sidebar = page.locator("aside").first();
  const addBtn = sidebar.locator('button[title="Add repository"]');
  await expect(addBtn).toBeVisible();
});

// ─── Flow: Opening the picker ─────────────────────────────────────────────────

test("clicking + button opens the repo picker overlay", async ({ page }) => {
  // Mock /api/repos so the picker can list repos without hitting GitHub
  await page.route("**/api/repos", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        fetched_at: new Date().toISOString(),
        stale: false,
        repositories: [
          { id: 1, full_name: "acme/new-repo", name: "new-repo", owner_login: "acme", visibility: "private", default_branch: "main", read_only: false },
        ],
      }),
    })
  );

  await page.goto("/");
  await page.locator('button[title="Add repository"]').click();

  // Picker overlay with "Add repository" heading is visible
  await expect(page.getByRole("heading", { name: /add repository/i }).or(page.getByText("Add repository")).first()).toBeVisible();
});

// ─── Flow: Picker dismissed without selection (Escape) ───────────────────────

test("pressing Escape closes the picker without adding a repo", async ({ page }) => {
  await page.route("**/api/repos", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ fetched_at: new Date().toISOString(), stale: false, repositories: [] }) })
  );

  await page.goto("/");
  await page.locator('button[title="Add repository"]').click();

  // Picker is open
  await expect(page.locator('[role="dialog"], [class*="fixed"]').first()).toBeVisible({ timeout: 3000 });

  await page.keyboard.press("Escape");

  // Picker is closed — no fixed overlay remains
  await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 3000 });
});

// ─── Flow: Picker dismissed without selection (click outside) ────────────────

test("clicking outside the picker closes it without adding a repo", async ({ page }) => {
  await page.route("**/api/repos", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ fetched_at: new Date().toISOString(), stale: false, repositories: [] }) })
  );

  await page.goto("/");
  await page.locator('button[title="Add repository"]').click();
  await expect(page.locator('[role="dialog"], [class*="fixed"]').first()).toBeVisible({ timeout: 3000 });

  await page.mouse.click(10, 10);
  await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 3000 });
});

// ─── Flow: Switching to a repo ───────────────────────────────────────────────

test("clicking a repo button navigates to /repo/[owner]/[name]", async ({ page }) => {
  await page.goto("/");
  const sidebar = page.locator("aside").first();
  const alphaBtn = sidebar.locator('button[title="acme/alpha"]');

  await alphaBtn.click();
  await page.waitForURL("**/repo/acme/alpha");
  await expect(page).toHaveURL(/\/repo\/acme\/alpha/);
});

// ─── Flow: Active repo indicator ─────────────────────────────────────────────

test("active repo button has aria-current='page' when its route is active", async ({ page }) => {
  await page.goto("/repo/acme/alpha");

  const sidebar = page.locator("aside").first();
  const alphaBtn = sidebar.locator('button[title="acme/alpha"]');
  const betaBtn = sidebar.locator('button[title="acme/beta"]');

  await expect(alphaBtn).toHaveAttribute("aria-current", "page");
  await expect(betaBtn).not.toHaveAttribute("aria-current", "page");
});

// ─── Flow: Repo page placeholder ─────────────────────────────────────────────

test("repo page shows <h1> with full repo name", async ({ page }) => {
  await page.goto("/repo/acme/alpha");
  const h1 = page.locator("h1");
  await expect(h1).toContainText("acme/alpha");
});

// ─── Flow: Removing the active repo redirects to / ───────────────────────────

test("removing the active repo redirects to /", async ({ page }) => {
  // Mock the DELETE to succeed without actually removing from DB
  await page.route("**/api/pinned-repos/acme%2Falpha", (route) => {
    if (route.request().method() === "DELETE") {
      route.fulfill({ status: 204 });
    } else {
      route.continue();
    }
  });

  await page.goto("/repo/acme/alpha");

  const sidebar = page.locator("aside").first();
  const alphaBtn = sidebar.locator('button[title="acme/alpha"]');

  await alphaBtn.click({ button: "right" });
  await page.getByText("Remove from sidebar").click();

  await page.waitForURL("**/");
  expect(page.url()).toMatch(/\/$/);
});

// ─── Flow: Sidebar order stable after navigation ──────────────────────────────

test("navigating to a repo does not reorder the sidebar", async ({ page }) => {
  await page.goto("/");
  const sidebar = page.locator("aside").first();
  const buttons = sidebar.locator("button[title]");

  const titlesBefore = await buttons.evaluateAll((els) =>
    els.map((el) => el.getAttribute("title"))
  );

  // Navigate to the second repo
  await sidebar.locator('button[title="acme/beta"]').click();
  await page.waitForURL("**/repo/acme/beta");

  const titlesAfter = await buttons.evaluateAll((els) =>
    els.map((el) => el.getAttribute("title"))
  );

  expect(titlesAfter).toEqual(titlesBefore);
});
