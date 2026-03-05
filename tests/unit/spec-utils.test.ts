import { describe, it, expect } from "vitest";
import {
  extractSpecMeta,
  stripFrontmatter,
  extractCriteriaCount,
  extractRequirementNames,
  specPathToUrl,
} from "@/lib/spec-utils";

// ── extractSpecMeta ─────────────────────────────────────────────────────────

describe("extractSpecMeta", () => {
  it("Title rendered from frontmatter — returns frontmatter title", () => {
    const md = `---\ntitle: "User Registration Flow"\n---\n\n## Body`;
    const { title } = extractSpecMeta(md, "user-registration-flow");
    expect(title).toBe("User Registration Flow");
  });

  it("Title fallback to filename — converts kebab-case filename when no frontmatter title", () => {
    const md = `## ADDED Requirements\n\n### Requirement: Something`;
    const { title } = extractSpecMeta(md, "user-registration-flow");
    expect(title).toBe("User Registration Flow");
  });

  it("returns 'Untitled Spec' when no title and no filename", () => {
    const { title } = extractSpecMeta("# Heading only");
    expect(title).toBe("Untitled Spec");
  });

  it("strips whitespace from frontmatter title", () => {
    const md = `---\ntitle: "  Trimmed Title  "\n---`;
    const { title } = extractSpecMeta(md);
    expect(title).toBe("Trimmed Title");
  });
});

// ── stripFrontmatter ────────────────────────────────────────────────────────

describe("stripFrontmatter", () => {
  it("Frontmatter stripped — removes YAML frontmatter block", () => {
    const md = `---\ntitle: Test\nauthor: foo\n---\n\n## Body\n\nSome content.`;
    const body = stripFrontmatter(md);
    expect(body).not.toContain("---");
    expect(body).not.toContain("title:");
    expect(body).toContain("## Body");
    expect(body).toContain("Some content.");
  });

  it("returns markdown unchanged when there is no frontmatter", () => {
    const md = `## Just Markdown\n\nNo frontmatter here.`;
    expect(stripFrontmatter(md)).toContain("Just Markdown");
  });
});

// ── extractCriteriaCount ────────────────────────────────────────────────────

describe("extractCriteriaCount", () => {
  it("Progress bar with partial completion — counts ### Requirement: headers", () => {
    const md = `## ADDED Requirements\n\n### Requirement: Foo\n\n### Requirement: Bar\n\n### Requirement: Baz`;
    expect(extractCriteriaCount(md)).toBe(3);
  });

  it("Progress bar with no criteria — returns 0 for spec with no requirements", () => {
    const md = `## Overview\n\nJust a description.`;
    expect(extractCriteriaCount(md)).toBe(0);
  });

  it("does not count ## or #### Requirement: headers", () => {
    const md = `## Requirement: Not counted\n#### Requirement: Also not\n### Requirement: Counted`;
    expect(extractCriteriaCount(md)).toBe(1);
  });

  it("strips frontmatter before counting", () => {
    const md = `---\ntitle: Foo\n---\n\n### Requirement: One\n### Requirement: Two`;
    expect(extractCriteriaCount(md)).toBe(2);
  });
});

// ── extractRequirementNames ─────────────────────────────────────────────────

describe("extractRequirementNames", () => {
  it("extracts names from ### Requirement: lines", () => {
    const md = `### Requirement: Spec Detail Route\n\n### Requirement: Spec Title Section`;
    const names = extractRequirementNames(md);
    expect(names).toEqual(["Spec Detail Route", "Spec Title Section"]);
  });

  it("returns empty array when no requirements", () => {
    expect(extractRequirementNames("## Just text")).toEqual([]);
  });
});

// ── specPathToUrl ───────────────────────────────────────────────────────────

describe("specPathToUrl", () => {
  it("builds URL for direct change spec", () => {
    const url = specPathToUrl(
      "/repo/owner/name",
      "openspec/changes/spec-detail-view/specs/feature-spec-detail-view.md"
    );
    expect(url).toBe("/repo/owner/name/specs/spec-detail-view/feature-spec-detail-view");
  });

  it("builds URL for archived spec", () => {
    const url = specPathToUrl(
      "/repo/owner/name",
      "openspec/changes/archive/2026-03-04-github-auth/specs/feature-github-auth.md"
    );
    expect(url).toBe(
      "/repo/owner/name/specs/archive/2026-03-04-github-auth/feature-github-auth"
    );
  });

  it("returns All Specs URL when path has no /specs/ segment", () => {
    const url = specPathToUrl("/repo/owner/name", "openspec/changes/some-change");
    expect(url).toBe("/repo/owner/name/specs");
  });
});
