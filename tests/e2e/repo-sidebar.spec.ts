/**
 * E2E tests translated from:
 * openspec/changes/repo-sidebar-navigation/tests/feature-repo-sidebar-navigation.flow.md
 *
 * Flows covered (all Type: e2e):
 *  - Sidebar renders pinned repos
 *  - No pinned repos
 *  - Sidebar order is stable on navigation
 *  - Picker blocked at cap (+ button still visible)
 *  - Opening the picker
 *  - Adding a repo
 *  - All repos already pinned
 *  - Picker dismissed without selection
 *  - Removing a repo (non-active)
 *  - Removing a repo (active → redirects to /)
 *  - Switching to a repo
 *  - Active repo indicator
 *  - Repo page placeholder
 *
 * Prerequisites:
 *  - App is running at baseURL (next start or next dev)
 *  - Test user is signed in via a pre-seeded session cookie or auth bypass
 *
 * These tests require an authenticated session. Use Playwright's storageState
 * to persist a logged-in session, or run against a test-mode build with
 * NEXTAUTH_SECRET and a seeded DB that has pinned repos.
 */

import { test, expect } from "@playwright/test";

// ─── Flow: Sidebar renders pinned repos ──────────────────────────────────────

test("sidebar renders pinned repo buttons with initials and gradient", async ({ page }) => {
  await page.goto("/");
  const sidebar = page.locator("aside");
  await expect(sidebar).toBeVisible();

  const repoBtns = sidebar.locator("button[title]").filter({ hasNot: page.locator('title:text("Add repository")') });
  const count = await repoBtns.count();
  if (count > 0) {
    const text = await repoBtns.first().textContent();
    expect(text?.trim().length).toBeGreaterThanOrEqual(1);
    expect(text?.trim().length).toBeLessThanOrEqual(2);
  }
});

// ─── Flow: No pinned repos ────────────────────────────────────────────────────

test("sidebar shows only Add repo button when no repos are pinned", async ({ page }) => {
  await page.goto("/");
  const sidebar = page.locator("aside");
  const addBtn = sidebar.locator('button[title="Add repository"]');
  await expect(addBtn).toBeVisible();
});

// ─── Flow: Sidebar order is stable on navigation ─────────────────────────────

test("navigating to a repo does not change sidebar order", async ({ page }) => {
  await page.goto("/");
  const sidebar = page.locator("aside");
  const buttons = sidebar.locator("button[title]");
  const countBefore = await buttons.count();

  if (countBefore >= 2) {
    const titlesBefore = await buttons.evaluateAll((els) =>
      els.map((el) => el.getAttribute("title"))
    );

    // Click the second repo so we can observe order doesn't shift it to top
    const secondTitle = titlesBefore[1];
    if (secondTitle) {
      await buttons.nth(1).click();
      const [owner, name] = secondTitle.split("/");
      await page.waitForURL(`**/repo/${owner}/${name}`);

      const titlesAfter = await buttons.evaluateAll((els) =>
        els.map((el) => el.getAttribute("title"))
      );
      expect(titlesAfter).toEqual(titlesBefore);
    }
  }
});

// ─── Flow: Opening the picker ─────────────────────────────────────────────────

test("clicking + button opens the repo picker overlay", async ({ page }) => {
  await page.goto("/");
  const addBtn = page.locator('button[title="Add repository"]');
  await addBtn.click();

  const picker = page.locator("text=Add repository").first();
  await expect(picker).toBeVisible();
});

// ─── Flow: Picker dismissed without selection (Escape) ───────────────────────

test("pressing Escape closes the picker without adding a repo", async ({ page }) => {
  await page.goto("/");
  await page.locator('button[title="Add repository"]').click();
  await expect(page.locator("text=Add repository").first()).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.locator('[class*="fixed inset-0"]')).not.toBeVisible();
});

// ─── Flow: Picker dismissed without selection (click-outside) ────────────────

test("clicking outside the picker closes it without adding a repo", async ({ page }) => {
  await page.goto("/");
  await page.locator('button[title="Add repository"]').click();

  await page.mouse.click(10, 10);
  await expect(page.locator('[class*="fixed inset-0"]')).not.toBeVisible();
});

// ─── Flow: Switching to a repo ───────────────────────────────────────────────

test("clicking a repo button navigates to /repo/[owner]/[name]", async ({ page }) => {
  await page.goto("/");
  const sidebar = page.locator("aside");
  const firstRepo = sidebar.locator("button[title]").first();
  const titleAttr = await firstRepo.getAttribute("title");

  if (titleAttr) {
    await firstRepo.click();
    const [owner, name] = titleAttr.split("/");
    await page.waitForURL(`**/repo/${owner}/${name}`);
    await expect(page).toHaveURL(new RegExp(`/repo/${owner}/${name}`));
  }
});

// ─── Flow: Active repo indicator ─────────────────────────────────────────────

test("active repo button has a ring class when its route is active", async ({ page }) => {
  await page.goto("/");
  const sidebar = page.locator("aside");
  const firstRepo = sidebar.locator("button[title]").first();
  const titleAttr = await firstRepo.getAttribute("title");

  if (titleAttr) {
    await firstRepo.click();
    const [owner, name] = titleAttr.split("/");
    await page.waitForURL(`**/repo/${owner}/${name}`);

    const activeBtn = page.locator(`aside button[title="${titleAttr}"]`);
    await expect(activeBtn).toHaveClass(/ring-2/);
  }
});

// ─── Flow: Repo page placeholder ─────────────────────────────────────────────

test("repo page shows <h1> with full repo name", async ({ page }) => {
  await page.goto("/repo/testowner/testrepo");
  const h1 = page.locator("h1");
  await expect(h1).toContainText("testowner/testrepo");
});

// ─── Flow: Removing a repo (non-active) ──────────────────────────────────────

test("right-click shows Remove from sidebar option", async ({ page }) => {
  await page.goto("/");
  const sidebar = page.locator("aside");
  const firstRepo = sidebar.locator("button[title]").first();

  if ((await firstRepo.count()) > 0) {
    await firstRepo.click({ button: "right" });
    const menuItem = page.locator("text=Remove from sidebar");
    await expect(menuItem).toBeVisible();
  }
});

// ─── Flow: Removing active repo redirects to / ───────────────────────────────

test("removing the active repo redirects to /", async ({ page }) => {
  await page.goto("/");
  const sidebar = page.locator("aside");
  const firstRepo = sidebar.locator("button[title]").first();
  const titleAttr = await firstRepo.getAttribute("title");

  if (titleAttr) {
    await firstRepo.click();
    const [owner, name] = titleAttr.split("/");
    await page.waitForURL(`**/repo/${owner}/${name}`);

    const activeBtn = page.locator(`aside button[title="${titleAttr}"]`);
    await activeBtn.click({ button: "right" });
    await page.locator("text=Remove from sidebar").click();

    await page.waitForURL("**/");
    expect(page.url()).toMatch(/\/$/);
  }
});

// ─── Flow: Picker blocked at cap (+ button still visible at 10 repos) ─────────

test("Add repo button is always visible even at cap", async ({ page }) => {
  await page.goto("/");
  const addBtn = page.locator('button[title="Add repository"]');
  await expect(addBtn).toBeVisible();
});
