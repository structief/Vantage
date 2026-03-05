import { auth } from "@/auth";
import { getSpecsListing, getSpecContent } from "@/lib/repo-specs";
import {
  extractRequirementState,
  deriveStatus,
} from "@/lib/spec-utils";
import { SPEC_STATUS_CACHE_TTL_MS } from "@/lib/spec-status-constants";
import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
  const activeSpecs = specs.filter((s) => s.status !== "archived");
  const archivedSpecs = specs.filter((s) => s.status === "archived");

  const statuses: Record<string, string> = {};
  const now = Date.now();

  for (const spec of activeSpecs) {
    const cached = await prisma.specStatusCache.findUnique({
      where: {
        repoFullName_specPath: {
          repoFullName: fullName,
          specPath: spec.path,
        },
      },
    });

    if (
      cached &&
      now - cached.fetchedAt.getTime() < SPEC_STATUS_CACHE_TTL_MS
    ) {
      statuses[spec.path] = cached.status;
      continue;
    }

    const content = await getSpecContent(owner, repo, spec.path, octokit);
    if (content === null) {
      statuses[spec.path] = "Draft";
      continue;
    }

    const { names, validatedIndices } = extractRequirementState(content);
    const total = names.length;
    const status = deriveStatus(validatedIndices.size, total);

    await prisma.specStatusCache.upsert({
      where: {
        repoFullName_specPath: {
          repoFullName: fullName,
          specPath: spec.path,
        },
      },
      create: {
        repoFullName: fullName,
        specPath: spec.path,
        status,
        fetchedAt: new Date(),
      },
      update: {
        status,
        fetchedAt: new Date(),
      },
    });

    statuses[spec.path] = status;
  }

  for (const spec of archivedSpecs) {
    const cached = await prisma.specStatusCache.findUnique({
      where: {
        repoFullName_specPath: {
          repoFullName: fullName,
          specPath: spec.path,
        },
      },
    });
    statuses[spec.path] = cached ? cached.status : "Draft";
  }

  return NextResponse.json({ statuses });
}
