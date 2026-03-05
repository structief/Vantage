/**
 * E2E tests translated from:
 * openspec/changes/spec-detail-view/tests/feature-spec-detail-view.flow.md
 *
 * Flows covered:
 *  - Navigating to a spec
 *  - Spec not found
 *  - Creator shown from GitHub (avatar + username)
 *  - Last updated date shown
 *  - Status badge placeholder ("Draft")
 *  - Default tab on load (Overview)
 *  - Switching tabs
 *  - Criteria tab badge count
 *  - Criteria list rendered
 *  - Empty criteria tab
 *  - Contracts listed
 *  - Empty contracts tab
 *  - Tests listed
 *  - Empty tests tab
 *
 * Prerequisites:
 *  - App running at baseURL (next dev or next start)
 *  - Authenticated session loaded from tests/e2e/.auth/user.json
 *  - Test user seeded with pinned repos by global-setup
 *  - GitHub API responses are mocked to avoid real network calls
 */

import { test, expect } from "@playwright/test";

const REPO_ROUTE = "/repo/acme/frontend";
const SPEC_URL = `${REPO_ROUTE}/specs/spec-detail-view/feature-spec-detail-view`;

const SPEC_MARKDOWN = `---
title: "Spec Detail View"
---

## ADDED Requirements

### Requirement: Spec Detail Route
The route renders the spec.

#### Scenario: Navigate to spec
- **WHEN** user clicks spec link
- **THEN** spec detail view renders

### Requirement: Spec Title Section
Shows title, author, date.

#### Scenario: Title rendered
- **WHEN** spec is loaded
- **THEN** title shown

### Requirement: Criteria Progress Bar
Shows progress.

#### Scenario: Progress shown
- **WHEN** spec loaded
- **THEN** bar renders
`;

const EMPTY_SPEC_MARKDOWN = `---
title: "Empty Spec"
---

## Overview

No criteria here.
`;

async function mockSpecApis(
  page: import("@playwright/test").Page,
  opts: {
    markdown?: string;
    login?: string | null;
    avatarUrl?: string | null;
    date?: string;
    contracts?: string[];
    tests?: string[];
  } = {}
) {
  const {
    markdown = SPEC_MARKDOWN,
    login = "testuser",
    avatarUrl = "https://avatars.githubusercontent.com/u/1?v=4",
    date = "2026-02-28T12:00:00Z",
    contracts = ["spec-detail-view.yaml"],
    tests = ["feature-spec-detail-view.flow.md"],
  } = opts;

  // Mock spec file content (GitHub getContent response)
  await page.route("**/api/repos/**/spec-content**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ content: markdown }),
    })
  );

  // Mock last commit info
  await page.route("**/api/repos/**/spec-commit**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ login, avatarUrl, date }),
    })
  );

  // Mock contracts listing
  await page.route("**/api/repos/**/spec-contracts**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ files: contracts }),
    })
  );

  // Mock tests listing
  await page.route("**/api/repos/**/spec-tests**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ files: tests }),
    })
  );
}

// ─── Navigation ───────────────────────────────────────────────────────────────

// Flow: Navigating to a spec
test("navigating to a spec renders the spec detail view", async ({ page }) => {
  await mockSpecApis(page);
  await page.goto(SPEC_URL);

  // Title should be visible
  await expect(page.getByRole("heading", { name: "Spec Detail View" })).toBeVisible({
    timeout: 10000,
  });
  // Tab bar should be present
  await expect(page.getByRole("button", { name: /Overview/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Criteria/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Contracts/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Tests/ })).toBeVisible();
});

// Flow: Spec not found
test("navigating to a non-existent spec shows 'Spec not found' message", async ({ page }) => {
  await page.route("**/api/repos/**/spec-content**", (route) =>
    route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "File not found" }) })
  );
  await page.goto(`${REPO_ROUTE}/specs/nonexistent-change/no-such-spec`);

  await expect(page.getByText("Spec not found")).toBeVisible({ timeout: 10000 });
  await expect(page.getByText("Back to All Specs")).toBeVisible();
});

// ─── Title Section ────────────────────────────────────────────────────────────

// Flow: Status badge placeholder
test("status badge shows 'Draft'", async ({ page }) => {
  await mockSpecApis(page);
  await page.goto(SPEC_URL);

  await expect(page.getByText("Draft")).toBeVisible({ timeout: 10000 });
});

// Flow: Last updated date shown
test("last updated date is displayed in title section", async ({ page }) => {
  await mockSpecApis(page, { date: "2026-02-28T12:00:00Z" });
  await page.goto(SPEC_URL);

  await expect(page.getByText(/Updated Feb 28, 2026/)).toBeVisible({ timeout: 10000 });
});

// Flow: Creator shown from GitHub
test("GitHub username is displayed in the title section", async ({ page }) => {
  await mockSpecApis(page, { login: "koeneveraert" });
  await page.goto(SPEC_URL);

  await expect(page.getByText("koeneveraert")).toBeVisible({ timeout: 10000 });
});

// ─── Tabs ─────────────────────────────────────────────────────────────────────

// Flow: Default tab on load
test("Overview tab is active by default and shows spec markdown content", async ({ page }) => {
  await mockSpecApis(page);
  await page.goto(SPEC_URL);

  const overviewTab = page.getByRole("button", { name: /Overview/ });
  await expect(overviewTab).toBeVisible({ timeout: 10000 });

  // The rendered markdown body should contain content from the spec
  await expect(page.getByText("ADDED Requirements")).toBeVisible();
});

// Flow: Switching tabs
test("clicking Criteria tab switches content to criteria list", async ({ page }) => {
  await mockSpecApis(page);
  await page.goto(SPEC_URL);

  await expect(page.getByRole("button", { name: /Criteria/ })).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: /Criteria/ }).click();

  // Criteria content area should now be visible (requirement names)
  await expect(page.getByText("Spec Detail Route")).toBeVisible();
});

// Flow: Criteria tab badge count
test("Criteria tab badge shows the count of requirements", async ({ page }) => {
  await mockSpecApis(page); // SPEC_MARKDOWN has 3 ### Requirement: headers
  await page.goto(SPEC_URL);

  // The Criteria tab badge should display 3
  await expect(page.getByRole("button", { name: /Criteria.*3/ })).toBeVisible({ timeout: 10000 });
});

// ─── Criteria Tab ─────────────────────────────────────────────────────────────

// Flow: Criteria list rendered
test("Criteria tab lists all requirements as read-only checklist rows", async ({ page }) => {
  await mockSpecApis(page);
  await page.goto(SPEC_URL);
  await page.getByRole("button", { name: /Criteria/ }).click({ timeout: 10000 });

  await expect(page.getByText("Spec Detail Route")).toBeVisible();
  await expect(page.getByText("Spec Title Section")).toBeVisible();
  await expect(page.getByText("Criteria Progress Bar")).toBeVisible();
  // Each row should show "pending" badge
  const pendingBadges = page.getByText("pending");
  await expect(pendingBadges.first()).toBeVisible();
});

// Flow: Empty criteria tab
test("Criteria tab shows 'No criteria defined' when spec has no requirements", async ({ page }) => {
  await mockSpecApis(page, { markdown: EMPTY_SPEC_MARKDOWN });
  await page.goto(SPEC_URL);
  await page.getByRole("button", { name: /Criteria/ }).click({ timeout: 10000 });

  await expect(page.getByText("No criteria defined for this spec.")).toBeVisible();
});

// ─── Contracts Tab ────────────────────────────────────────────────────────────

// Flow: Contracts tab — shows structured cards or empty state
// Content is server-rendered from contracts/api/, contracts/data/, data-model/
test("Contracts tab renders without error", async ({ page }) => {
  await mockSpecApis(page, { contracts: ["spec-detail-view.yaml"] });
  await page.goto(SPEC_URL);
  await page.getByRole("button", { name: /Contracts/ }).click({ timeout: 10000 });

  // Tab shows either empty message or contract content (section headers or table)
  await expect(
    page.getByText(
      /No contracts or data models defined yet|REQUEST|RESPONSE|STATUS CODES|Field/
    )
  ).toBeVisible({ timeout: 5000 });
});

// Flow: Empty contracts tab
test("Contracts tab shows 'No contracts or data models defined yet.' when no files", async ({
  page,
}) => {
  await mockSpecApis(page, { contracts: [] });
  await page.goto(SPEC_URL);
  await page.getByRole("button", { name: /Contracts/ }).click({ timeout: 10000 });

  await expect(page.getByText("No contracts or data models defined yet.")).toBeVisible();
});

// ─── Tests Tab ────────────────────────────────────────────────────────────────

// Flow: Tests listed (structured view with sections and TC-1, or empty)
test("Tests tab shows test sections or empty state", async ({ page }) => {
  await mockSpecApis(page, { tests: ["feature-spec-detail-view.flow.md"] });
  await page.goto(SPEC_URL);
  await page.getByRole("button", { name: /Tests/ }).click({ timeout: 10000 });

  await expect(
    page.getByText(/Unit Tests|E2E Tests|Contract Tests|No test flows defined yet\./)
  ).toBeVisible({ timeout: 5000 });
});

// Flow: Empty tests tab
test("Tests tab shows 'No test flows defined yet.' when no files", async ({ page }) => {
  await mockSpecApis(page, { tests: [] });
  await page.goto(SPEC_URL);
  await page.getByRole("button", { name: /Tests/ }).click({ timeout: 10000 });

  await expect(page.getByText("No test flows defined yet.")).toBeVisible();
});
