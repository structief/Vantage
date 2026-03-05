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

export function extractCriteriaCount(markdown: string): number {
  const body = stripFrontmatter(markdown);
  const matches = body.match(/^###\s+Requirement:/gm);
  return matches ? matches.length : 0;
}

export function extractRequirementNames(markdown: string): string[] {
  const body = stripFrontmatter(markdown);
  const lines = body.split("\n");
  const names: string[] = [];
  for (const line of lines) {
    const m = line.match(/^###\s+Requirement:\s+(.+)/);
    if (m) names.push(m[1].trim());
  }
  return names;
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
