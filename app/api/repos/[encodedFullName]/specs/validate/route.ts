import { auth } from "@/auth";
import {
  fetchFileContent,
  updateSpecFile,
} from "@/lib/github-spec";
import {
  extractRequirementState,
  deriveStatus,
  toggleRequirementCheckbox,
} from "@/lib/spec-utils";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
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

  let body: { path?: string; requirementIndex?: number; validated?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { path, requirementIndex, validated } = body;
  if (
    typeof path !== "string" ||
    path.trim() === "" ||
    typeof requirementIndex !== "number" ||
    requirementIndex < 0 ||
    typeof validated !== "boolean"
  ) {
    return NextResponse.json(
      { error: "Missing or invalid path, requirementIndex, or validated" },
      { status: 400 }
    );
  }

  const [owner, repo] = fullName.split("/");
  const file = await fetchFileContent(accessToken, owner, repo, path);
  if (!file) {
    return NextResponse.json(
      { error: "Spec file not found" },
      { status: 404 }
    );
  }

  const { names } = extractRequirementState(file.content);
  if (requirementIndex >= names.length) {
    return NextResponse.json(
      { error: "Requirement index out of range" },
      { status: 400 }
    );
  }

  const newContent = toggleRequirementCheckbox(
    file.content,
    requirementIndex,
    validated
  );
  const requirementName = names[requirementIndex];
  const message = validated
    ? `Validate: ${requirementName}`
    : `Unvalidate: ${requirementName}`;

  try {
    const result = await updateSpecFile(
      accessToken,
      owner,
      repo,
      path,
      newContent,
      message
    );
    if (!result) {
      return NextResponse.json(
        { error: "Failed to update spec file" },
        { status: 500 }
      );
    }
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    if (status === 409 || status === 422) {
      return NextResponse.json(
        { error: "Conflict: spec may have been modified. Please refresh and try again." },
        { status: 422 }
      );
    }
    throw err;
  }

  const { validatedIndices } = extractRequirementState(newContent);
  const status = deriveStatus(validatedIndices.size, names.length);

  await prisma.specStatusCache.upsert({
    where: {
      repoFullName_specPath: {
        repoFullName: fullName,
        specPath: path,
      },
    },
    create: {
      repoFullName: fullName,
      specPath: path,
      status,
      fetchedAt: new Date(),
    },
    update: {
      status,
      fetchedAt: new Date(),
    },
  });

  return NextResponse.json({ status });
}
