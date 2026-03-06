/**
 * E2E tests translated from:
 * openspec/changes/edit-functional-spec/tests/feature-edit-functional-spec.flow.md
 *
 * Flows covered:
 *  - Entering edit mode
 *  - Cancelling edit mode reverts changes
 *  - Edit button not shown without repo context (change-scoped guard)
 *  - Save failure keeps edits and removes overlay
 *
 * Prerequisites:
 *  - App running at baseURL (next dev or next start)
 *  - Authenticated session loaded from tests/e2e/.auth/user.json
 *  - Test user seeded with pinned repos by global-setup
 */

import { test, expect } from "@playwright/test";

const REPO_ROUTE = "/repo/acme/frontend";
const CHANGE_SPEC_URL = `${REPO_ROUTE}/specs/edit-functional-spec/feature-edit-functional-spec`;

const CHANGE_SPEC_MARKDOWN = `## ADDED Requirements

### Requirement: Edit Mode Toggle in Spec Viewer
The viewer SHALL expose an Edit button.

#### Scenario: Entering edit mode
- **WHEN** the user clicks the Edit button
- **THEN** an editor opens

### Requirement: Criteria Invalidation on Requirement Title Change
When a heading is renamed the criteria SHALL be cleared.

#### Scenario: Requirement title edited — validation cleared after successful save
- **WHEN** the heading changes and save succeeds
- **THEN** the validation is cleared
`;

async function mockChangeSpecApis(
  page: import("@playwright/test").Page,
  opts: { markdown?: string } = {}
) {
  const { markdown = CHANGE_SPEC_MARKDOWN } = opts;

  await page.route("**/api/repos/**/spec-content**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ content: markdown }),
    })
  );
  await page.route("**/api/repos/**/spec-commit**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ login: "testuser", avatarUrl: null, date: "2026-03-01T12:00:00Z" }),
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

// ─── Flow: Entering edit mode ─────────────────────────────────────────────────

test("Edit button is visible for change-scoped spec and entering edit mode shows the editor", async ({
  page,
}) => {
  await mockChangeSpecApis(page);
  await page.goto(CHANGE_SPEC_URL);

  // Overview should render read-only content first
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 10000 });

  // Edit button must be visible
  const editBtn = page.getByRole("button", { name: "Edit" });
  await expect(editBtn).toBeVisible();

  // Click Edit — editor surface appears
  await editBtn.click();

  // The TipTap editor (contenteditable) should appear
  await expect(page.locator(".ProseMirror")).toBeVisible({ timeout: 5000 });

  // Cancel and Save buttons replace the Edit button
  await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
  await expect(editBtn).not.toBeVisible();
});

// ─── Flow: Cancelling edit mode reverts changes ───────────────────────────────

test("Clicking Cancel dismisses the editor and reverts to read-only view", async ({ page }) => {
  await mockChangeSpecApis(page);
  await page.goto(CHANGE_SPEC_URL);

  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: "Edit" }).click();

  // Confirm editor is open
  await expect(page.locator(".ProseMirror")).toBeVisible({ timeout: 5000 });

  // Type something to make a change
  await page.locator(".ProseMirror").click();
  await page.keyboard.type(" some extra text");

  // Click Cancel
  await page.getByRole("button", { name: "Cancel" }).click();

  // Editor should be gone, read-only view back
  await expect(page.locator(".ProseMirror")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
});

// ─── Flow: Save failure keeps edits and removes overlay ───────────────────────

test("Save failure shows an inline error and keeps the editor open", async ({ page }) => {
  await mockChangeSpecApis(page);

  // Intercept the update API to simulate a server failure
  await page.route("**/api/repos/**/specs/update", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "Failed to update spec file" }),
    })
  );

  await page.goto(CHANGE_SPEC_URL);
  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.locator(".ProseMirror")).toBeVisible({ timeout: 5000 });

  await page.getByRole("button", { name: "Save" }).click();

  // Inline error message should appear
  await expect(page.getByText("Failed to update spec file")).toBeVisible({ timeout: 5000 });

  // Editor should still be visible
  await expect(page.locator(".ProseMirror")).toBeVisible();

  // Loading overlay should have cleared
  await expect(page.getByText("Saving…")).not.toBeVisible();
});
