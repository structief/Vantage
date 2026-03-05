import { Octokit } from "@octokit/rest";

export interface SpecEntry {
  slug: string;
  group: string | null;
  path: string;
  status: "active" | "archived";
}

type GitHubItem = { name: string; type: string };

async function getContentItems(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string
): Promise<GitHubItem[] | null> {
  try {
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path });
    if (Array.isArray(data)) return data as GitHubItem[];
    return null;
  } catch (err: unknown) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

function mdSpecsFrom(
  items: GitHubItem[],
  basePath: string,
  group: string | null,
  status: "active" | "archived"
): SpecEntry[] {
  return items
    .filter((f) => f.type === "file" && f.name.endsWith(".md"))
    .map((f) => ({
      slug: f.name.replace(/\.md$/, ""),
      group,
      path: `${basePath}/${f.name}`,
      status,
    }));
}

export async function getSpecsListing(
  owner: string,
  repo: string,
  octokit: Octokit
): Promise<SpecEntry[]> {
  const changeDirs = await getContentItems(octokit, owner, repo, "openspec/changes");
  if (!changeDirs) return [];

  const dirs = changeDirs.filter((item) => item.type === "dir");

  const ungrouped: SpecEntry[] = [];
  const grouped = new Map<string, SpecEntry[]>();
  const archived: SpecEntry[] = [];

  await Promise.all(
    dirs.map(async (dir) => {
      const specsContent = await getContentItems(
        octokit,
        owner,
        repo,
        `openspec/changes/${dir.name}/specs`
      );

      if (specsContent !== null) {
        // Direct change directory — specs/ exists
        const entries = mdSpecsFrom(
          specsContent,
          `openspec/changes/${dir.name}/specs`,
          null,
          "active"
        );
        ungrouped.push(...entries);
        return;
      }

      // specs/ returned 404 → treat as a group directory; scan its subdirectories
      const groupContents = await getContentItems(
        octokit,
        owner,
        repo,
        `openspec/changes/${dir.name}`
      );
      if (!groupContents) return;

      const subdirs = groupContents.filter((item) => item.type === "dir");
      const isArchive = dir.name === "archive";
      const groupStatus: "active" | "archived" = isArchive ? "archived" : "active";

      const groupEntries: SpecEntry[] = [];
      await Promise.all(
        subdirs.map(async (subdir) => {
          const subSpecs = await getContentItems(
            octokit,
            owner,
            repo,
            `openspec/changes/${dir.name}/${subdir.name}/specs`
          );
          if (!subSpecs) return;
          groupEntries.push(
            ...mdSpecsFrom(
              subSpecs,
              `openspec/changes/${dir.name}/${subdir.name}/specs`,
              dir.name,
              groupStatus
            )
          );
        })
      );

      if (isArchive) {
        archived.push(...groupEntries);
      } else if (groupEntries.length > 0) {
        const existing = grouped.get(dir.name) ?? [];
        grouped.set(dir.name, [...existing, ...groupEntries]);
      }
    })
  );

  const sortedGroups = [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([, entries]) => entries);

  return [...ungrouped, ...sortedGroups, ...archived];
}

export async function getSpecContent(
  owner: string,
  repo: string,
  path: string,
  octokit: Octokit
): Promise<string | null> {
  try {
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path });
    if (Array.isArray(data) || data.type !== "file") return null;
    return Buffer.from(data.content, "base64").toString("utf-8");
  } catch (err: unknown) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

export function extractTitle(content: string, fallback: string): string {
  const firstHeading = content
    .split("\n")
    .find((line) => /^#\s+\S/.test(line));
  if (!firstHeading) return fallback;
  return firstHeading.replace(/^#+\s+/, "").trim();
}
