import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { fetchAllRepos } from "@/lib/github";
import { NextResponse } from "next/server";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function isStale(fetchedAt: Date): boolean {
  return Date.now() - fetchedAt.getTime() > CACHE_TTL_MS;
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.login) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED", message: "Your session has expired. Please sign in again." },
      { status: 401 }
    );
  }

  const { login } = session.user;
  const accessToken = (session as { accessToken?: string }).accessToken;

  // Check cache
  const cached = await prisma.repoCache.findUnique({
    where: { github_login: login },
  });

  const cacheHit = cached && !isStale(cached.fetched_at);

  if (cacheHit) {
    return NextResponse.json({
      fetched_at: cached.fetched_at.toISOString(),
      stale: false,
      repositories: JSON.parse(cached.repositories),
    });
  }

  // Live fetch
  if (!accessToken) {
    if (cached) {
      return NextResponse.json({
        fetched_at: cached.fetched_at.toISOString(),
        stale: true,
        repositories: JSON.parse(cached.repositories),
      });
    }
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
      if (cached) {
        return NextResponse.json(
          {
            fetched_at: cached.fetched_at.toISOString(),
            stale: true,
            rate_limit_hit: true,
            repositories: JSON.parse(cached.repositories),
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        {
          error: "GITHUB_UNAVAILABLE",
          message: "GitHub rate limit reached. Please try again in a few minutes.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "GITHUB_UNAVAILABLE", message: "GitHub rate limit reached. Please try again in a few minutes." },
      { status: 503 }
    );
  }
}
