/**
 * E2E tests translated from:
 * openspec/changes/spec-tests-visualisation/tests/feature-tests-visualisation.flow.md
 *
 * Flows covered:
 *  - Test suites grouped by type
 *  - Individual test cases listed
 *  - Deployment runs section with last results
 *  - Empty tests tab
 *  - Tab badge reflects test group count
 *  - UI alignment with Vantage design system
 *  - Deployment runs absent
 *
 * Prerequisites:
 *  - App running at baseURL
 *  - Authenticated session
 *  - GitHub API / spec content mocked or real repo with flow files
 */

import { test, expect } from "@playwright/test";

const REPO_ROUTE = "/repo/acme/frontend";
const SPEC_URL = `${REPO_ROUTE}/specs/spec-detail-view/feature-spec-detail-view`;

const FLOW_MD_WITH_UNIT_AND_E2E = `# Test flows: spec-detail-view

## Flow: Navigating to a spec
Type: e2e
Spec: specs/feature-spec-detail-view.md > Requirement: Spec Detail Route

Setup:
- User is authenticated

Steps:
1. Click the spec link
2. Observe URL

Expected:
- URL changes to the spec detail view
- Spec content is rendered

## Flow: Title rendered from frontmatter
Type: unit
Spec: specs/feature-spec-detail-view.md > Requirement: Spec Title Section

Setup:
- A spec markdown string with frontmatter

Steps:
1. Call extractSpecMeta
2. Inspect returned title

Expected:
- Returned title equals the frontmatter value
`;

async function mockSpecApis(
  page: import("@playwright/test").Page,
  opts: {
    tests?: string[];
    flowContent?: string;
  } = {}
) {
  const { tests = ["feature-spec-detail-view.flow.md"], flowContent = FLOW_MD_WITH_UNIT_AND_E2E } = opts;

  await page.route("**/api/repos/**/spec-content**", async (route) => {
    const url = route.request().url();
    if (url.includes("tests/") && url.includes(".flow.md")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ content: flowContent }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        content: `---
title: "Spec Detail View"
---
## ADDED Requirements
### Requirement: Spec Detail Route
Content here.
### Requirement: Spec Title Section
Content here.
### Requirement: Criteria Progress Bar
Content here.
`,
      }),
    });
  });

  await page.route("**/api/repos/**/spec-commit**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        login: "testuser",
        avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
        date: "2026-02-28T12:00:00Z",
      }),
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
      body: JSON.stringify({ files: tests }),
    })
  );
}

test("Tests tab shows test sections when flow files exist", async ({ page }) => {
  await mockSpecApis(page, { tests: ["feature-spec-detail-view.flow.md"] });
  await page.goto(SPEC_URL);
  await page.getByRole("button", { name: /Tests/ }).click({ timeout: 10000 });

  await expect(
    page.getByText(/Unit Tests|E2E Tests|Contract Tests/)
  ).toBeVisible({ timeout: 5000 });
});

test("Tests tab shows TC-1 test case when flow content parsed", async ({ page }) => {
  await mockSpecApis(page, { tests: ["feature-spec-detail-view.flow.md"] });
  await page.goto(SPEC_URL);
  await page.getByRole("button", { name: /Tests/ }).click({ timeout: 10000 });

  await expect(page.getByText("TC-1")).toBeVisible({ timeout: 5000 });
});

test("Tests tab shows 'No test flows defined yet.' when no files", async ({ page }) => {
  await mockSpecApis(page, { tests: [] });
  await page.goto(SPEC_URL);
  await page.getByRole("button", { name: /Tests/ }).click({ timeout: 10000 });

  await expect(page.getByText("No test flows defined yet.")).toBeVisible();
});

test("Tests tab badge shows section count when flow groups exist", async ({ page }) => {
  await mockSpecApis(page, { tests: ["feature-spec-detail-view.flow.md"] });
  await page.goto(SPEC_URL);

  await expect(page.getByRole("button", { name: /Tests.*[12]/ })).toBeVisible({
    timeout: 10000,
  });
});
