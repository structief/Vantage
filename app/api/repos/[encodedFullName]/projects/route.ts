import { auth } from "@/auth";
import { slugToTitle } from "@/lib/utils";
import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";

type GitHubContentItem = { name: string; type: string };

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ encodedFullName: string }> }
) {
  const session = await auth();
  if (!session?.user?.login) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { encodedFullName } = await params;
  const fullName = decodeURIComponent(encodedFullName);
  if (!fullName.includes("/")) {
    return NextResponse.json({ error: "Invalid repository name" }, { status: 400 });
  }

  const accessToken = (session as { accessToken?: string }).accessToken;
  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [owner, repo] = fullName.split("/");
  const octokit = new Octokit({ auth: accessToken });

  let changeDirs: GitHubContentItem[] = [];
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: "openspec/changes",
    });
    if (Array.isArray(data)) {
      changeDirs = (data as GitHubContentItem[]).filter((item) => item.type === "dir");
    }
  } catch (err: unknown) {
    if ((err as { status?: number }).status === 404) {
      return NextResponse.json({ projects: [] });
    }
    throw err;
  }

  const projects = await Promise.all(
    changeDirs.map(async (dir) => {
      let specCount = 0;
      try {
        const { data } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: `openspec/changes/${dir.name}/specs`,
        });
        if (Array.isArray(data)) {
          specCount = (data as GitHubContentItem[]).filter(
            (item) => item.type === "file" && item.name.endsWith(".md")
          ).length;
        }
      } catch {
        // specs/ dir does not exist — specCount stays 0
      }
      return { slug: dir.name, name: slugToTitle(dir.name), specCount };
    })
  );

  return NextResponse.json({ projects });
}
