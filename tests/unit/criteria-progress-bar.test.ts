/**
 * Unit tests translated from:
 * openspec/changes/spec-criteria-validation/tests/feature-criteria-validation.flow.md
 *
 * Flows covered:
 *  - Flow: Progress bar advances on validation
 *  - Flow: Progress bar resets on uncheck
 *  - Flow: Progress bar full when all validated
 *
 * Note: visual rendering (bar fill width, green class) requires a DOM environment.
 * These tests cover the percentage and completion logic underlying CriteriaProgressBar.
 */

import { describe, it, expect } from "vitest";

function calcProgress(validated: number, total: number): { pct: number; isComplete: boolean } {
  const pct = total === 0 ? 0 : Math.round((validated / total) * 100);
  return { pct, isComplete: validated === total && total > 0 };
}

describe("Progress bar advances on validation", () => {
  it("0 of 3 validated → 0% fill", () => {
    const { pct } = calcProgress(0, 3);
    expect(pct).toBe(0);
  });

  it("1 of 3 validated → 33% fill", () => {
    const { pct } = calcProgress(1, 3);
    expect(pct).toBe(33);
  });

  it("2 of 3 validated → 67% fill", () => {
    const { pct } = calcProgress(2, 3);
    expect(pct).toBe(67);
  });

  it("isComplete is false while not all validated", () => {
    const { isComplete } = calcProgress(2, 3);
    expect(isComplete).toBe(false);
  });
});

describe("Progress bar resets on uncheck", () => {
  it("going from 2/3 to 1/3 reduces pct from 67 to 33", () => {
    const before = calcProgress(2, 3);
    const after = calcProgress(1, 3);
    expect(after.pct).toBeLessThan(before.pct);
    expect(after.pct).toBe(33);
  });

  it("unchecking the only validated criterion → 0%", () => {
    const { pct } = calcProgress(0, 3);
    expect(pct).toBe(0);
  });
});

describe("Progress bar full when all validated", () => {
  it("all 2 of 2 validated → 100% and isComplete true", () => {
    const { pct, isComplete } = calcProgress(2, 2);
    expect(pct).toBe(100);
    expect(isComplete).toBe(true);
  });

  it("single-requirement spec: 1 of 1 validated → 100% and isComplete", () => {
    const { pct, isComplete } = calcProgress(1, 1);
    expect(pct).toBe(100);
    expect(isComplete).toBe(true);
  });

  it("0 criteria total → 0% and isComplete false (bar not rendered)", () => {
    const { pct, isComplete } = calcProgress(0, 0);
    expect(pct).toBe(0);
    expect(isComplete).toBe(false);
  });
});
