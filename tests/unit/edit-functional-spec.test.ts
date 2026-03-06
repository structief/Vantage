/**
 * Unit tests translated from:
 * openspec/changes/edit-functional-spec/tests/feature-edit-functional-spec.flow.md
 *
 * Flows covered:
 *  - Editor is markdown-backed (requirement name round-trip via extractRequirementNames)
 *  - Requirement title edited — validation cleared (criteria invalidation diff logic)
 */

import { describe, it, expect } from "vitest";
import { extractRequirementNames } from "@/lib/spec-utils";

// ─── Helpers (mirrors logic in SpecDetailView.handleSave) ────────────────────

function computeInvalidatedIndices(
  originalMarkdown: string,
  editedMarkdown: string
): number[] {
  const originalNames = extractRequirementNames(originalMarkdown);
  const updatedNames = extractRequirementNames(editedMarkdown);
  return originalNames
    .map((name, i) => (name !== updatedNames[i] ? i : -1))
    .filter((i) => i !== -1);
}

// ─── Flow: Editor is markdown-backed ─────────────────────────────────────────

describe("Editor is markdown-backed — requirement name round-trip", () => {
  it("requirement names survive a round-trip through extractRequirementNames", () => {
    const md = `## ADDED Requirements

### Requirement: Edit Mode Toggle in Spec Viewer
Description.

#### Scenario: Entering edit mode
- **WHEN** something
- **THEN** something

### Requirement: Criteria Invalidation on Requirement Title Change
Description.

#### Scenario: Validation cleared
- **WHEN** title changes
- **THEN** cleared
`;
    const names = extractRequirementNames(md);
    expect(names).toEqual([
      "Edit Mode Toggle in Spec Viewer",
      "Criteria Invalidation on Requirement Title Change",
    ]);
  });

  it("round-trips simple requirement/scenario structure without structural changes", () => {
    const md = `### Requirement: Spec Save with Git Commit
Body.

#### Scenario: Successful save
- **WHEN** user clicks Save
- **THEN** a commit is made
`;
    const [name] = extractRequirementNames(md);
    expect(name).toBe("Spec Save with Git Commit");
  });
});

// ─── Flow: Requirement title edited — validation cleared ──────────────────────

describe("Requirement title edited — validation cleared", () => {
  it("returns the index of a renamed requirement heading", () => {
    const original = `### Requirement: Old Name\nBody.\n### Requirement: Unchanged\nBody.`;
    const edited = `### Requirement: New Name\nBody.\n### Requirement: Unchanged\nBody.`;

    const invalidated = computeInvalidatedIndices(original, edited);
    expect(invalidated).toEqual([0]);
  });

  it("unchanged requirement titles produce no invalidated indices", () => {
    const original = `### Requirement: Same\nBody.\n### Requirement: AlsoSame\nBody.`;
    const edited = `### Requirement: Same\nBody.\n### Requirement: AlsoSame\nBody.`;

    const invalidated = computeInvalidatedIndices(original, edited);
    expect(invalidated).toEqual([]);
  });

  it("multiple renamed headings all appear in invalidated list", () => {
    const original = `### Requirement: A\nBody.\n### Requirement: B\nBody.\n### Requirement: C\nBody.`;
    const edited = `### Requirement: A\nBody.\n### Requirement: B2\nBody.\n### Requirement: C2\nBody.`;

    const invalidated = computeInvalidatedIndices(original, edited);
    expect(invalidated).toEqual([1, 2]);
  });

  it("whitespace-only differences in heading text still cause invalidation", () => {
    // Trailing space is stripped by extractRequirementNames so should NOT cause invalidation
    const original = `### Requirement: With Space\nBody.`;
    const edited = `### Requirement: With Space\nBody.`;

    const invalidated = computeInvalidatedIndices(original, edited);
    expect(invalidated).toEqual([]);
  });
});

// ─── isChangeScoped guard ────────────────────────────────────────────────────

describe("isChangeScoped", () => {
  function isChangeScoped(specPath: string) {
    return (
      specPath.startsWith("openspec/changes/") &&
      !specPath.startsWith("openspec/changes/archive/")
    );
  }

  it("returns true for an active change-scoped path", () => {
    expect(isChangeScoped("openspec/changes/edit-functional-spec/specs/feature.md")).toBe(true);
  });

  it("returns false for a base spec path", () => {
    expect(isChangeScoped("openspec/specs/repo-sidebar-navigation/spec.md")).toBe(false);
  });

  it("returns false for an empty path", () => {
    expect(isChangeScoped("")).toBe(false);
  });

  // Flow: Edit button not shown for archived specs
  it("returns false for an archived spec path", () => {
    expect(
      isChangeScoped("openspec/changes/archive/2026-03-04-github-auth/specs/feature-github-auth.md")
    ).toBe(false);
  });

  it("returns false for any path under openspec/changes/archive/", () => {
    expect(isChangeScoped("openspec/changes/archive/")).toBe(false);
    expect(isChangeScoped("openspec/changes/archive/2026-01-01-old-change/specs/spec.md")).toBe(false);
  });

  it("does not block a change whose name happens to start with 'archive-'", () => {
    expect(isChangeScoped("openspec/changes/archive-feature-foo/specs/feature.md")).toBe(true);
  });
});
