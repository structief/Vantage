/**
 * Unit tests translated from:
 * openspec/changes/secondary-sidebar-nav/tests/feature-secondary-sidebar-nav.flow.md
 *
 * Flows covered:
 *  - slugToTitle: converts hyphen/underscore slugs to title-cased strings
 *  - getProjectInitials: returns two-letter initials from a slug
 */

import { describe, it, expect } from "vitest";
import { slugToTitle, getProjectInitials } from "@/lib/utils";

describe("slugToTitle", () => {
  it("converts a hyphenated slug to title case", () => {
    expect(slugToTitle("repo-sidebar-navigation")).toBe("Repo Sidebar Navigation");
  });

  it("converts an underscore slug to title case", () => {
    expect(slugToTitle("add_user_auth")).toBe("Add User Auth");
  });

  it("handles mixed hyphens and underscores", () => {
    expect(slugToTitle("billing-payments_flow")).toBe("Billing Payments Flow");
  });

  it("handles a single word slug", () => {
    expect(slugToTitle("billing")).toBe("Billing");
  });

  it("handles an already-title-cased slug without changing it unexpectedly", () => {
    const result = slugToTitle("auth-flow");
    expect(result).toBe("Auth Flow");
  });

  it("handles empty string without throwing", () => {
    expect(() => slugToTitle("")).not.toThrow();
    expect(slugToTitle("")).toBe("");
  });
});

describe("getProjectInitials", () => {
  it("returns first letters of first two words for a multi-word slug", () => {
    expect(getProjectInitials("repo-sidebar-navigation")).toBe("RS");
  });

  it("returns first two letters of a single-word slug", () => {
    expect(getProjectInitials("billing")).toBe("BI");
  });

  it("returns first letters of first two words for underscore slug", () => {
    expect(getProjectInitials("auth_flow")).toBe("AF");
  });

  it("handles a two-word slug", () => {
    expect(getProjectInitials("add-checkout")).toBe("AC");
  });

  it("handles empty string without throwing", () => {
    expect(() => getProjectInitials("")).not.toThrow();
    expect(getProjectInitials("")).toBe("??");
  });

  it("returns uppercase letters", () => {
    const result = getProjectInitials("my-feature");
    expect(result).toBe(result.toUpperCase());
  });
});
