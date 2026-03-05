import { auth } from "@/auth";
import { getSpecsListing } from "@/lib/repo-specs";
import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";

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

  const specs = await getSpecsListing(owner, repo, octokit);
  return NextResponse.json({ specs });
}
