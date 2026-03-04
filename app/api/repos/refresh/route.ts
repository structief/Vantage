import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { fetchAllRepos } from "@/lib/github";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();

  if (!session?.user?.login) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED", message: "Your session has expired. Please sign in again." },
      { status: 401 }
    );
  }

  const { login } = session.user;
  const accessToken = (session as { accessToken?: string }).accessToken;

  if (!accessToken) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED", message: "Your session has expired. Please sign in again." },
      { status: 401 }
    );
  }

  try {
    const repositories = await fetchAllRepos(accessToken);
    const fetchedAt = new Date();

    await prisma.repoCache.upsert({
      where: { github_login: login },
      create: {
        github_login: login,
        fetched_at: fetchedAt,
        repositories: JSON.stringify(repositories),
      },
      update: {
        fetched_at: fetchedAt,
        repositories: JSON.stringify(repositories),
      },
    });

    return NextResponse.json({
      fetched_at: fetchedAt.toISOString(),
      stale: false,
      repositories,
    });
  } catch (err: unknown) {
    const status =
      err instanceof Error && "status" in err
        ? (err as { status?: number }).status
        : undefined;

    if (status === 403 || status === 429) {
      return NextResponse.json(
        {
          error: "RATE_LIMITED",
          message: "GitHub rate limit reached. Please try again in a few minutes.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "GITHUB_UNAVAILABLE", message: "Unable to reach GitHub. Please try again later." },
      { status: 503 }
    );
  }
}
