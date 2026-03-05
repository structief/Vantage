/**
 * Unit tests translated from:
 * openspec/changes/spec-criteria-validation/tests/feature-criteria-validation.flow.md
 *
 * Flows covered:
 *  - Flow: Status is Draft with no validated criteria
 *  - Flow: Status transitions to In review
 *  - Flow: Status transitions to Reviewed
 *  - Flow: Status reverts when a criterion is unchecked
 *  - Flow: Status with no criteria defined
 *
 * Note: full component rendering (badge text, dot color class) requires a DOM environment.
 * These tests cover deriveStatus — the pure function that drives SpecDetailView's status badge.
 */

import { describe, it, expect } from "vitest";
import { deriveStatus } from "@/lib/spec-utils";

describe("Status is Draft with no validated criteria", () => {
  it("0 of 3 validated → Draft", () => {
    expect(deriveStatus(0, 3)).toBe("Draft");
  });

  it("0 of 1 validated → Draft", () => {
    expect(deriveStatus(0, 1)).toBe("Draft");
  });
});

describe("Status transitions to In review", () => {
  it("1 of 3 validated → In review", () => {
    expect(deriveStatus(1, 3)).toBe("In review");
  });

  it("2 of 3 validated → still In review", () => {
    expect(deriveStatus(2, 3)).toBe("In review");
  });

  it("1 of 2 validated → In review", () => {
    expect(deriveStatus(1, 2)).toBe("In review");
  });
});

describe("Status transitions to Reviewed", () => {
  it("2 of 2 validated → Reviewed", () => {
    expect(deriveStatus(2, 2)).toBe("Reviewed");
  });

  it("3 of 3 validated → Reviewed", () => {
    expect(deriveStatus(3, 3)).toBe("Reviewed");
  });

  it("single-requirement spec: 1 of 1 validated → Reviewed", () => {
    expect(deriveStatus(1, 1)).toBe("Reviewed");
  });
});

describe("Status reverts when a criterion is unchecked", () => {
  it("2 of 2 → Reviewed; after uncheck 2 of 2 becomes 1 of 2 → In review", () => {
    expect(deriveStatus(2, 2)).toBe("Reviewed");
    expect(deriveStatus(1, 2)).toBe("In review");
  });

  it("unchecking all criteria one by one eventually returns Draft", () => {
    expect(deriveStatus(3, 3)).toBe("Reviewed");
    expect(deriveStatus(2, 3)).toBe("In review");
    expect(deriveStatus(1, 3)).toBe("In review");
    expect(deriveStatus(0, 3)).toBe("Draft");
  });
});

describe("Status with no criteria defined", () => {
  it("0 criteria total → Draft", () => {
    expect(deriveStatus(0, 0)).toBe("Draft");
  });
});
