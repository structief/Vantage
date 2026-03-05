import matter from "gray-matter";
import { slugToTitle } from "@/lib/utils";

export interface SpecMeta {
  title: string;
  frontmatter: Record<string, unknown>;
}

export function extractSpecMeta(markdown: string, filename?: string): SpecMeta {
  const { data } = matter(markdown);
  const title =
    typeof data.title === "string" && data.title.trim()
      ? data.title.trim()
      : filename
        ? slugToTitle(filename.replace(/\.md$/, ""))
        : "Untitled Spec";
  return { title, frontmatter: data as Record<string, unknown> };
}

export function stripFrontmatter(markdown: string): string {
  return matter(markdown).content;
}

/**
 * Removes [ ] and [x] checkbox markers from requirement headings for display.
 * Converts `### [ ] Requirement: X` and `### [x] Requirement: X` to `### Requirement: X`.
 */
export function stripRequirementCheckboxesForDisplay(markdown: string): string {
  return markdown.replace(
    /^(###\s+)\[[ x]\]\s+(Requirement:)/gm,
    "$1$2"
  );
}

export function extractCriteriaCount(markdown: string): number {
  const body = stripFrontmatter(markdown);
  const matches = body.match(/^###\s+(?:\[[ x]\]\s+)?Requirement:/gm);
  return matches ? matches.length : 0;
}

export function extractRequirementNames(markdown: string): string[] {
  return extractRequirementState(markdown).names;
}

export function extractRequirementState(
  markdown: string
): { names: string[]; validatedIndices: Set<number> } {
  const body = stripFrontmatter(markdown);
  const lines = body.split("\n");
  const names: string[] = [];
  const validatedIndices = new Set<number>();
  for (const line of lines) {
    // Match ### [x] Requirement: X, ### [ ] Requirement: X, ### Requirement: X (legacy)
    const m = line.match(/^###\s+(\[[ x]\]\s+)?Requirement:\s+(.+)$/);
    if (m) {
      const checkbox = m[1]; // "[x] ", "[ ] ", or undefined (legacy)
      const name = m[2].trim();
      names.push(name);
      const idx = names.length - 1;
      if (checkbox?.trim() === "[x]") {
        validatedIndices.add(idx);
      }
      // "[ ]" or legacy (no checkbox) → unvalidated
    }
  }
  return { names, validatedIndices };
}

export function toggleRequirementCheckbox(
  markdown: string,
  requirementIndex: number,
  validated: boolean
): string {
  const body = stripFrontmatter(markdown);
  const { data: frontmatter } = matter(markdown);
  const lines = body.split("\n");
  let idx = -1;
  const newLines = lines.map((line) => {
    const m = line.match(/^###\s+(\[[ x]\]\s+)?Requirement:\s+(.+)$/);
    if (m) {
      idx++;
      if (idx === requirementIndex) {
        const name = m[2].trim();
        const newCheckbox = validated ? "[x]" : "[ ]";
        return `### ${newCheckbox} Requirement: ${name}`;
      }
    }
    return line;
  });
  const newBody = newLines.join("\n");
  return frontmatter && Object.keys(frontmatter).length > 0
    ? matter.stringify(newBody, frontmatter)
    : newBody;
}

export function deriveStatus(
  validated: number,
  total: number
): "Draft" | "In review" | "Reviewed" {
  if (total === 0 || validated === 0) return "Draft";
  if (validated === total) return "Reviewed";
  return "In review";
}

export function specPathToUrl(repoBase: string, specFullPath: string): string {
  // specFullPath: "openspec/changes/<changePath>/specs/<filename>.md"
  const withoutBase = specFullPath.replace(/^openspec\/changes\//, "");
  // withoutBase: "<changePath>/specs/<filename>.md"
  const lastSpecsIdx = withoutBase.lastIndexOf("/specs/");
  if (lastSpecsIdx === -1) return `${repoBase}/specs`;
  const changePath = withoutBase.slice(0, lastSpecsIdx);
  const filename = withoutBase.slice(lastSpecsIdx + "/specs/".length).replace(/\.md$/, "");
  return `${repoBase}/specs/${changePath}/${filename}`;
}
