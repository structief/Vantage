/**
 * E2E tests translated from:
 * openspec/changes/archive/2026-03-04-github-auth-repo-access/tests/feature-github-auth-repo-access.flow.md
 *
 * Flows covered:
 *  - Accessing a protected route while unauthenticated → redirect to /login
 *  - callbackUrl preserved for same-origin paths
 *  - External callbackUrl stripped (open-redirect guard)
 *  - Login screen renders with "Sign in with GitHub" button
 *  - Login screen shows "Authorization was cancelled" when error=AccessDenied
 *  - Login screen shows generic error for unknown OAuth errors
 *  - Login screen shows session-expiry message when reason=session_expired
 *
 * Unauthenticated tests use an empty storageState to clear the default session
 * cookie set by playwright.config.ts.
 *
 * OAuth flows (successful login, logout, page reload while authenticated)
 * require real GitHub credentials and are skipped unless TEST_GITHUB_ID and
 * TEST_GITHUB_SECRET are set in the environment.
 */

import { test, expect, type Page } from "@playwright/test";

// All tests in this file that test unauthenticated behaviour must clear the
// default auth storageState set by playwright.config.ts.
const UNAUTHENTICATED = { storageState: { cookies: [], origins: [] } };

// ─── Unauthenticated access ───────────────────────────────────────────────────

test.describe("Unauthenticated access", () => {
  test.use(UNAUTHENTICATED);

  // Flow: Accessing a protected route while unauthenticated
  test("redirects to /login when navigating to a protected route without a session", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  // Flow: callbackUrl preserved for same-origin paths
  test("preserves callbackUrl in login redirect for same-origin path", async ({
    page,
  }) => {
    await page.goto("/repo/acme/frontend");
    const url = new URL(page.url());
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("callbackUrl")).toBeTruthy();
  });

  // Flow: External callbackUrl stripped (open-redirect guard)
  test("does not preserve external callbackUrl (open-redirect guard)", async ({
    page,
  }) => {
    await page.goto("/login?callbackUrl=https://evil.example.com/steal");
    const url = new URL(page.url());
    // The middleware strips the external callbackUrl before reaching the login page
    expect(url.searchParams.get("callbackUrl") ?? "").not.toMatch(/evil\.example/);
  });
});

// ─── Login screen ─────────────────────────────────────────────────────────────

test.describe("Login screen", () => {
  test.use(UNAUTHENTICATED);

  // Flow: Login screen renders with Sign in with GitHub button
  test("shows the Sign in with GitHub button", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("button", { name: /sign in with github/i })
    ).toBeVisible();
  });

  // Flow: User denies GitHub access → "Authorization was cancelled" message
  test("shows 'Authorization was cancelled' when error=AccessDenied", async ({
    page,
  }) => {
    await page.goto("/login?error=AccessDenied");
    await expect(
      page.getByText("Authorization was cancelled. Please sign in to continue.")
    ).toBeVisible();
  });

  // Flow: OAuth error → generic error message
  test("shows generic error message for unknown OAuth errors", async ({
    page,
  }) => {
    await page.goto("/login?error=OAuthCallback");
    await expect(
      page.getByText("Something went wrong during sign-in", { exact: false })
    ).toBeVisible();
  });

  // Flow: Session expired → session-expiry message
  test("shows session-expiry message when reason=session_expired", async ({
    page,
  }) => {
    await page.goto("/login?reason=session_expired");
    await expect(
      page.getByText("Your session has expired. Please sign in again.")
    ).toBeVisible();
  });
});

// ─── Authenticated flows ──────────────────────────────────────────────────────
// These flows require real GitHub OAuth credentials. Skip them unless
// TEST_GITHUB_ID and TEST_GITHUB_SECRET are present.

async function requireCredentials(page: Page) {
  if (!process.env.TEST_GITHUB_ID || !process.env.TEST_GITHUB_SECRET) {
    test.skip();
  }
}

// Flow: Page reload while authenticated — stays on protected page
test("page reload while authenticated stays on protected page", async ({ page }) => {
  await requireCredentials(page);

  await page.goto("/");
  await page.reload();
  await expect(page).not.toHaveURL(/\/login/);
});

// Flow: Successful logout — redirects to /login and clears session
test("successful logout redirects to /login and clears session", async ({ page }) => {
  await requireCredentials(page);

  await page.goto("/");
  await page.locator('button[aria-label="User menu"]').click();
  await page.getByRole("button", { name: /sign out/i }).click();

  await expect(page).toHaveURL(/\/login/);

  // Protected route now redirects again
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
});
