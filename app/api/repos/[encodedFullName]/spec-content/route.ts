import { auth } from "@/auth";
import { getSpecContent } from "@/lib/repo-specs";
import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
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

  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "Missing path parameter" }, { status: 400 });
  }

  const [owner, repo] = fullName.split("/");
  const octokit = new Octokit({ auth: accessToken });

  const content = await getSpecContent(owner, repo, path, octokit);
  if (content === null) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return NextResponse.json({ content });
}
