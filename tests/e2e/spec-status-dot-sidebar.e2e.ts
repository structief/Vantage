/**
 * E2E tests translated from:
 * openspec/changes/spec-status-dot-sidebar/tests/secondary-sidebar-nav.flow.md
 *
 * Flow covered:
 *  - Flow: Dot persists across sidebar spec list navigations
 *
 * Prerequisites:
 *  - App running at baseURL (next dev or next start)
 *  - Authenticated session loaded from tests/e2e/.auth/user.json
 *  - Test user seeded with pinned repos by global-setup
 *  - API responses are mocked per-test to avoid real GitHub API calls
 */

import { test, expect } from "@playwright/test";

const REPO_ROUTE = "/repo/acme/frontend";

const MOCK_PROJECTS = [
  { slug: "auth-flow", name: "Auth Flow", specCount: 2 },
];

const MOCK_SPECS = [
  {
    slug: "feature-spec-a",
    group: "auth-flow",
    path: "openspec/changes/auth-flow/specs/feature-spec-a.md",
    status: "active",
  },
  {
    slug: "feature-spec-b",
    group: "auth-flow",
    path: "openspec/changes/auth-flow/specs/feature-spec-b.md",
    status: "active",
  },
];

const SPEC_A_URL = `${REPO_ROUTE}/specs/auth-flow/feature-spec-a`;
const SPEC_B_URL = `${REPO_ROUTE}/specs/auth-flow/feature-spec-b`;

const SPEC_A_MARKDOWN = `---
title: "Spec A"
---

## ADDED Requirements

### Requirement: First Requirement
Description.

#### Scenario: Scenario one
- **WHEN** something
- **THEN** something else

### Requirement: Second Requirement
Description.

#### Scenario: Scenario two
- **WHEN** something
- **THEN** something else
`;

const SPEC_B_MARKDOWN = `---
title: "Spec B"
---

## ADDED Requirements

### Requirement: Spec B Requirement
Description.

#### Scenario: Scenario B
- **WHEN** something
- **THEN** something else
`;

async function mockRepoApis(page: import("@playwright/test").Page) {
  await page.route("**/api/repos/**/projects", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ projects: MOCK_PROJECTS }),
    })
  );
  await page.route("**/api/repos/**/specs", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ specs: MOCK_SPECS }),
    })
  );
}

async function mockSpecContentApis(page: import("@playwright/test").Page) {
  await page.route("**/api/repos/**/spec-content**feature-spec-a**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ content: SPEC_A_MARKDOWN }),
    })
  );
  await page.route("**/api/repos/**/spec-content**feature-spec-b**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ content: SPEC_B_MARKDOWN }),
    })
  );
  await page.route("**/api/repos/**/spec-commit**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ login: "testuser", avatarUrl: null, date: null }),
    })
  );
  await page.route("**/api/repos/**/spec-contracts**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ files: [] }),
    })
  );
  await page.route("**/api/repos/**/spec-tests**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ files: [] }),
    })
  );
}

// Flow: Dot persists across sidebar spec list navigations
test("status dot updates in sidebar when criteria are validated, and persists after navigating to another spec", async ({
  page,
}) => {
  await mockRepoApis(page);
  await mockSpecContentApis(page);

  // Set sidebar to expanded and navigate to spec A
  await page.goto(SPEC_A_URL);
  await page.evaluate(() =>
    localStorage.setItem("vantage:secondary-sidebar:mode", "expanded")
  );
  await page.reload();
  await mockRepoApis(page);
  await mockSpecContentApis(page);

  // Wait for spec detail to load
  await expect(page.getByRole("heading", { name: "Spec A" })).toBeVisible({
    timeout: 10000,
  });

  // Expand the "Auth Flow" project group in the sidebar
  await page.getByText("Auth Flow").click();

  // Both specs should now be visible in the sidebar
  await expect(page.getByText("spec-a")).toBeVisible({ timeout: 3000 });
  await expect(page.getByText("spec-b")).toBeVisible({ timeout: 3000 });

  // Spec A's dot should start as Draft (bg-gray-400)
  const sidebar = page.locator("[data-testid='secondary-sidebar']");
  const specAButton = sidebar.locator("button").filter({ hasText: /^spec-a$/ });
  const specADot = specAButton.locator(".rounded-full");
  await expect(specADot).toHaveClass(/bg-gray-400/, { timeout: 3000 });

  // Switch to Criteria tab and validate one criterion (out of two) → In review
  await page.getByRole("button", { name: /Criteria/ }).click();
  await expect(page.getByText("First Requirement")).toBeVisible({ timeout: 5000 });
  await page.getByLabel(/Validate: First Requirement/).click();

  // Spec A's dot should update to In review (bg-amber-400)
  await expect(specADot).toHaveClass(/bg-amber-400/, { timeout: 3000 });

  // Navigate to spec B by clicking it in the sidebar
  await mockSpecContentApis(page);
  const specBButton = sidebar.locator("button").filter({ hasText: /^spec-b$/ });
  await specBButton.click();
  await expect(page).toHaveURL(SPEC_B_URL);
  await expect(page.getByRole("heading", { name: "Spec B" })).toBeVisible({
    timeout: 10000,
  });

  // Spec A's dot should still be amber (In review) — persists after navigation
  await expect(specADot).toHaveClass(/bg-amber-400/, { timeout: 3000 });

  // Spec B's dot should be gray (Draft — not yet validated)
  const specBDot = specBButton.locator(".rounded-full");
  await expect(specBDot).toHaveClass(/bg-gray-400/, { timeout: 3000 });
});
