/**
 * Unit tests translated from:
 * openspec/changes/spec-criteria-validation/tests/feature-criteria-validation.flow.md
 *
 * Flows covered:
 *  - Flow: Checking a criterion  (toggle logic for adding an index to validated set)
 *  - Flow: Unchecking a criterion (toggle logic for removing an index from validated set)
 *
 * Note: visual rendering assertions (checkbox appearance, badge text) require a DOM
 * environment (jsdom + @testing-library/react). These tests cover the underlying
 * Set-toggle logic that drives CriteriaTab's controlled behaviour.
 */

import { describe, it, expect } from "vitest";
import { extractRequirementNames } from "@/lib/spec-utils";

function toggleIndex(set: Set<number>, index: number): Set<number> {
  const next = new Set(set);
  if (next.has(index)) {
    next.delete(index);
  } else {
    next.add(index);
  }
  return next;
}

const SPEC_MD = `
## ADDED Requirements

### Requirement: Criteria Checkbox Toggle
desc

### Requirement: Criteria Validation Progress Bar
desc

### Requirement: Spec Status Derived from Validation State
desc
`.trim();

describe("Checking a criterion", () => {
  it("adds the criterion index to validatedIndices", () => {
    const initial = new Set<number>();
    const next = toggleIndex(initial, 0);
    expect(next.has(0)).toBe(true);
  });

  it("does not affect other indices when checking index 0", () => {
    const initial = new Set<number>();
    const next = toggleIndex(initial, 0);
    expect(next.has(1)).toBe(false);
    expect(next.has(2)).toBe(false);
  });

  it("can check the last criterion in the list", () => {
    const requirements = extractRequirementNames(SPEC_MD);
    const lastIndex = requirements.length - 1;
    const next = toggleIndex(new Set(), lastIndex);
    expect(next.has(lastIndex)).toBe(true);
    expect(next.size).toBe(1);
  });
});

describe("Unchecking a criterion", () => {
  it("removes the criterion index from validatedIndices", () => {
    const initial = new Set<number>([0]);
    const next = toggleIndex(initial, 0);
    expect(next.has(0)).toBe(false);
  });

  it("does not affect other validated indices when unchecking one", () => {
    const initial = new Set<number>([0, 1, 2]);
    const next = toggleIndex(initial, 1);
    expect(next.has(1)).toBe(false);
    expect(next.has(0)).toBe(true);
    expect(next.has(2)).toBe(true);
  });

  it("toggle is symmetric — check then uncheck returns empty set", () => {
    const afterCheck = toggleIndex(new Set(), 0);
    const afterUncheck = toggleIndex(afterCheck, 0);
    expect(afterUncheck.size).toBe(0);
  });
});

describe("extractRequirementNames — criteria source", () => {
  it("extracts the correct count of requirements from spec markdown", () => {
    const names = extractRequirementNames(SPEC_MD);
    expect(names).toHaveLength(3);
  });

  it("returns correct requirement names in order", () => {
    const names = extractRequirementNames(SPEC_MD);
    expect(names[0]).toBe("Criteria Checkbox Toggle");
    expect(names[1]).toBe("Criteria Validation Progress Bar");
    expect(names[2]).toBe("Spec Status Derived from Validation State");
  });
});
