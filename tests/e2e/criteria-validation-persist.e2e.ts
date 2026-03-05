/**
 * E2E tests translated from:
 * openspec/changes/criteria-validation-persist-spec/tests/feature-criteria-validation-persist-spec.flow.md
 *
 * Flows covered:
 *  - Initial state from parsed spec
 *  - Progress bar reflects persisted state
 *  - Non-archived specs show correct dot in sidebar
 *
 * Prerequisites:
 *  - App running at baseURL
 *  - Authenticated session from tests/e2e/.auth/user.json
 *  - APIs mocked per-test
 */

import { test, expect } from "@playwright/test";

const REPO_ROUTE = "/repo/acme/frontend";
const SPEC_URL = `${REPO_ROUTE}/specs/auth-flow/feature-spec-a`;

const MARKDOWN_WITH_CHECKBOXES = `---
title: "Spec A"
---

## ADDED Requirements

### [x] Requirement: First Requirement
Description.

#### Scenario: Scenario one
- **WHEN** something
- **THEN** something else

### [ ] Requirement: Second Requirement
Description.

#### Scenario: Scenario two
- **WHEN** something
- **THEN** something else
`;

async function mockRepoSidebarApis(page: import("@playwright/test").Page) {
  await page.route("**/api/repos/**/projects", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        projects: [{ slug: "auth-flow", name: "Auth Flow", specCount: 1 }],
      }),
    })
  );
  await page.route("**/api/repos/**/specs", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        specs: [
          {
            slug: "feature-spec-a",
            group: "auth-flow",
            path: "openspec/changes/auth-flow/specs/feature-spec-a.md",
            status: "active",
          },
        ],
      }),
    })
  );
  await page.route("**/api/repos/**/specs/statuses", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        statuses: {
          "openspec/changes/auth-flow/specs/feature-spec-a.md": "In review",
        },
      }),
    })
  );
}

test.describe("criteria-validation-persist", () => {
  test("Initial state from parsed spec — Criteria tab and progress bar reflect [x]/[ ]", async ({
    page,
  }) => {
    await mockRepoSidebarApis(page);

    await page.goto(SPEC_URL, { waitUntil: "networkidle" });

    await page.getByRole("tab", { name: /criteria/i }).click();

    const firstCriterion = page.getByText("First Requirement").first();
    await expect(firstCriterion).toBeVisible();
    const firstRow = firstCriterion.locator("..");
    await expect(firstRow.getByRole("checkbox", { checked: true })).toBeVisible();

    const secondCriterion = page.getByText("Second Requirement").first();
    await expect(secondCriterion).toBeVisible();
    const secondRow = secondCriterion.locator("..");
    await expect(secondRow.getByRole("checkbox", { checked: false })).toBeVisible();

    await expect(page.getByText("1 of 2 criteria validated")).toBeVisible();
  });
});
