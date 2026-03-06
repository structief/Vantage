import { Octokit } from "@octokit/rest";

export interface LastCommitInfo {
  login: string | null;
  avatarUrl: string | null;
  date: string;
}

export async function fetchFileContent(
  token: string,
  owner: string,
  repo: string,
  filePath: string
): Promise<{ content: string; filename: string } | null> {
  const octokit = new Octokit({ auth: token });
  try {
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path: filePath });
    if (Array.isArray(data) || data.type !== "file") return null;
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    return { content, filename: data.name };
  } catch (err: unknown) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

export async function fetchSpecFileContent(
  token: string,
  owner: string,
  repo: string,
  specPath: string
): Promise<{ markdown: string; filename: string } | null> {
  const result = await fetchFileContent(token, owner, repo, specPath);
  return result ? { markdown: result.content, filename: result.filename } : null;
}

export async function fetchLastCommit(
  token: string,
  owner: string,
  repo: string,
  specPath: string
): Promise<LastCommitInfo | null> {
  const octokit = new Octokit({ auth: token });
  try {
    const { data } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      path: specPath,
      per_page: 1,
    });
    if (!data.length) return null;
    const commit = data[0];
    return {
      login: commit.author?.login ?? null,
      avatarUrl: commit.author?.avatar_url ?? null,
      date: commit.commit.author?.date ?? new Date().toISOString(),
    };
  } catch (err: unknown) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

export async function fetchDirectoryListing(
  token: string,
  owner: string,
  repo: string,
  dirPath: string
): Promise<string[]> {
  const octokit = new Octokit({ auth: token });
  try {
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path: dirPath });
    if (!Array.isArray(data)) return [];
    return data
      .filter((item) => item.type === "file")
      .map((item) => item.name);
  } catch (err: unknown) {
    if ((err as { status?: number }).status === 404) return [];
    throw err;
  }
}

export async function updateSpecFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string
): Promise<{ sha: string } | null> {
  const octokit = new Octokit({ auth: token });
  try {
    const { data: existing } = await octokit.rest.repos.getContent({ owner, repo, path });
    const sha = Array.isArray(existing) ? undefined : existing.sha;
    const { data } = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString("base64"),
      ...(sha ? { sha } : {}),
    });
    const commitSha = data.commit?.sha;
    return commitSha ? { sha: commitSha } : null;
  } catch (err: unknown) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}
