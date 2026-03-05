import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ encodedFullName: string }> };

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.login) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { encodedFullName } = await params;
  const repoFullName = decodeURIComponent(encodedFullName);
  if (!repoFullName.includes("/")) {
    return NextResponse.json({ error: "Invalid repository name" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const data = body as Record<string, unknown>;
  const changePath = data.changePath;
  const specSlug = data.specSlug;
  const passedCount = data.passedCount;
  const failedCount = data.failedCount;

  if (typeof changePath !== "string" || !changePath) {
    return NextResponse.json(
      { error: "changePath is required" },
      { status: 400 }
    );
  }
  if (typeof specSlug !== "string" || !specSlug) {
    return NextResponse.json(
      { error: "specSlug is required" },
      { status: 400 }
    );
  }
  if (typeof passedCount !== "number" || passedCount < 0) {
    return NextResponse.json(
      { error: "passedCount is required and must be a non-negative number" },
      { status: 400 }
    );
  }
  if (typeof failedCount !== "number" || failedCount < 0) {
    return NextResponse.json(
      { error: "failedCount is required and must be a non-negative number" },
      { status: 400 }
    );
  }

  const version =
    typeof data.version === "string" ? data.version : null;
  const environment =
    typeof data.environment === "string" ? data.environment : null;
  const source = typeof data.source === "string" ? data.source : null;
  const detailsUrl =
    typeof data.detailsUrl === "string" ? data.detailsUrl : null;

  const run = await prisma.testRun.create({
    data: {
      repoFullName,
      changePath,
      specSlug,
      version,
      environment,
      runAt: new Date(),
      passedCount,
      failedCount,
      source,
      detailsUrl,
    },
  });

  return NextResponse.json({ id: run.id });
}
