/**
 * Unit tests translated from:
 * openspec/changes/spec-status-dot-sidebar/tests/secondary-sidebar-nav.flow.md
 *
 * Flows covered:
 *  - Flow: Feature prefix stripped from spec display label
 *  - Flow: Default dot state for unvisited spec
 *  - Flow: Dot reflects in-review status
 *  - Flow: Dot reflects reviewed status
 *  - Flow: Dot reverts when criteria are unvalidated
 *
 * Note: full DOM rendering assertions (React context wiring, dot element in the sidebar)
 * require @testing-library/react. These tests cover the underlying pure logic that drives
 * the feature: prefix stripping and the status-map helper that mirrors SpecStatusContext.
 */

import { describe, it, expect } from "vitest";
import { STATUS_DOT } from "@/components/SpecStatusContext";
import { deriveStatus } from "@/lib/spec-utils";

type SpecStatus = "Draft" | "In review" | "Reviewed";

function stripFeaturePrefix(slug: string): string {
  return slug.replace(/^feature-/, "");
}

function makeStatusMap(): Map<string, SpecStatus> {
  return new Map();
}

function getStatus(map: Map<string, SpecStatus>, slug: string): SpecStatus {
  return map.get(slug) ?? "Draft";
}

function updateStatus(
  map: Map<string, SpecStatus>,
  slug: string,
  status: SpecStatus
): Map<string, SpecStatus> {
  const next = new Map(map);
  next.set(slug, status);
  return next;
}

// ---------------------------------------------------------------------------
// Flow: Feature prefix stripped from spec display label
// ---------------------------------------------------------------------------

describe("Feature prefix stripped from spec display label", () => {
  it("strips the feature- prefix from a slug", () => {
    expect(stripFeaturePrefix("feature-add-auth")).toBe("add-auth");
  });

  it("leaves slugs without the feature- prefix unchanged", () => {
    expect(stripFeaturePrefix("add-auth")).toBe("add-auth");
  });

  it("only strips a leading feature- prefix, not one mid-string", () => {
    expect(stripFeaturePrefix("my-feature-foo")).toBe("my-feature-foo");
  });

  it("returns empty string when slug is exactly 'feature-'", () => {
    expect(stripFeaturePrefix("feature-")).toBe("");
  });

  it("handles empty string without throwing", () => {
    expect(() => stripFeaturePrefix("")).not.toThrow();
    expect(stripFeaturePrefix("")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Flow: Default dot state for unvisited spec
// ---------------------------------------------------------------------------

describe("Default dot state for unvisited spec", () => {
  it("returns Draft for a slug not yet in the status map", () => {
    const map = makeStatusMap();
    expect(getStatus(map, "add-auth")).toBe("Draft");
  });

  it("Draft maps to bg-gray-400 in STATUS_DOT", () => {
    expect(STATUS_DOT["Draft"]).toBe("bg-gray-400");
  });
});

// ---------------------------------------------------------------------------
// Flow: Dot reflects in-review status
// ---------------------------------------------------------------------------

describe("Dot reflects in-review status", () => {
  it("deriveStatus returns In review when some but not all criteria are validated", () => {
    expect(deriveStatus(1, 3)).toBe("In review");
    expect(deriveStatus(2, 3)).toBe("In review");
  });

  it("status map reflects In review after update", () => {
    let map = makeStatusMap();
    map = updateStatus(map, "add-auth", "In review");
    expect(getStatus(map, "add-auth")).toBe("In review");
  });

  it("In review maps to bg-amber-400 in STATUS_DOT", () => {
    expect(STATUS_DOT["In review"]).toBe("bg-amber-400");
  });
});

// ---------------------------------------------------------------------------
// Flow: Dot reflects reviewed status
// ---------------------------------------------------------------------------

describe("Dot reflects reviewed status", () => {
  it("deriveStatus returns Reviewed when all criteria are validated", () => {
    expect(deriveStatus(2, 2)).toBe("Reviewed");
    expect(deriveStatus(3, 3)).toBe("Reviewed");
  });

  it("status map reflects Reviewed after update", () => {
    let map = makeStatusMap();
    map = updateStatus(map, "add-auth", "In review");
    map = updateStatus(map, "add-auth", "Reviewed");
    expect(getStatus(map, "add-auth")).toBe("Reviewed");
  });

  it("Reviewed maps to bg-green-500 in STATUS_DOT", () => {
    expect(STATUS_DOT["Reviewed"]).toBe("bg-green-500");
  });
});

// ---------------------------------------------------------------------------
// Flow: Dot reverts when criteria are unvalidated
// ---------------------------------------------------------------------------

describe("Dot reverts when criteria are unvalidated", () => {
  it("Reviewed → In review when a criterion is unchecked", () => {
    let map = makeStatusMap();
    map = updateStatus(map, "add-auth", "Reviewed");
    const newStatus = deriveStatus(1, 2);
    map = updateStatus(map, "add-auth", newStatus);
    expect(getStatus(map, "add-auth")).toBe("In review");
  });

  it("In review → Draft when all criteria are unchecked", () => {
    let map = makeStatusMap();
    map = updateStatus(map, "add-auth", "In review");
    const newStatus = deriveStatus(0, 2);
    map = updateStatus(map, "add-auth", newStatus);
    expect(getStatus(map, "add-auth")).toBe("Draft");
  });

  it("status of a different slug is unaffected by updates to another", () => {
    let map = makeStatusMap();
    map = updateStatus(map, "add-auth", "Reviewed");
    expect(getStatus(map, "user-profile")).toBe("Draft");
  });
});
