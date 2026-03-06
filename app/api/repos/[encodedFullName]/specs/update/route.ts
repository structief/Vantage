import { auth } from "@/auth";
import { updateSpecFile } from "@/lib/github-spec";
import { NextResponse } from "next/server";
import path from "path";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ encodedFullName: string }> }
) {
  const session = await auth();
  if (!session?.user?.login) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const accessToken = (session as { accessToken?: string }).accessToken;
  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { encodedFullName } = await params;
  const fullName = decodeURIComponent(encodedFullName);
  if (!fullName.includes("/")) {
    return NextResponse.json({ error: "Invalid repository name" }, { status: 400 });
  }

  let body: { path?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { path: filePath, content } = body;
  if (!filePath || typeof filePath !== "string") {
    return NextResponse.json({ error: "Missing required field: path" }, { status: 400 });
  }
  if (content === undefined || content === null || typeof content !== "string") {
    return NextResponse.json({ error: "Missing required field: content" }, { status: 400 });
  }

  const filename = path.basename(filePath);
  const commitMessage = `docs: update ${filename}`;

  const [owner, repo] = fullName.split("/");

  try {
    const result = await updateSpecFile(accessToken, owner, repo, filePath, content, commitMessage);
    if (!result) {
      return NextResponse.json({ error: "Spec file not found" }, { status: 404 });
    }
    return NextResponse.json({ sha: result.sha });
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    if (status === 409) {
      return NextResponse.json(
        { error: "Commit conflict: the file has been updated since you last loaded it. Reload and try again." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to update spec file" }, { status: 500 });
  }
}
