import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

const CAP = 10;

export async function GET() {
  const session = await auth();
  if (!session?.user?.login) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const rows = await prisma.pinnedRepo.findMany({
    where: { github_login: session.user.login },
    orderBy: { pinned_at: "asc" },
    take: CAP,
  });

  return NextResponse.json({
    pinned_repos: rows.map((r) => ({
      full_name: r.full_name,
      pinned_at: r.pinned_at.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.login) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const fullName: unknown = body?.full_name;
  if (typeof fullName !== "string" || !fullName) {
    return NextResponse.json({ message: "full_name is required." }, { status: 400 });
  }

  const login = session.user.login;

  // Verify the repo exists in the user's cache
  const cached = await prisma.repoCache.findUnique({ where: { github_login: login } });
  if (!cached) {
    return NextResponse.json(
      { message: "Repository not found in your repository list." },
      { status: 400 }
    );
  }
  const repos: { full_name: string }[] = JSON.parse(cached.repositories);
  if (!repos.some((r) => r.full_name === fullName)) {
    return NextResponse.json(
      { message: "Repository not found in your repository list." },
      { status: 400 }
    );
  }

  // Check not already pinned
  const existing = await prisma.pinnedRepo.findUnique({
    where: { github_login_full_name: { github_login: login, full_name: fullName } },
  });
  if (existing) {
    return NextResponse.json(
      { message: "Repository is already in your sidebar." },
      { status: 400 }
    );
  }

  // Evict oldest-added if at cap
  const count = await prisma.pinnedRepo.count({ where: { github_login: login } });
  if (count >= CAP) {
    const oldest = await prisma.pinnedRepo.findFirst({
      where: { github_login: login },
      orderBy: { pinned_at: "asc" },
    });
    if (oldest) {
      await prisma.pinnedRepo.delete({
        where: { github_login_full_name: { github_login: login, full_name: oldest.full_name } },
      });
    }
  }

  const pinned = await prisma.pinnedRepo.create({
    data: { github_login: login, full_name: fullName },
  });

  return NextResponse.json(
    { full_name: pinned.full_name, pinned_at: pinned.pinned_at.toISOString() },
    { status: 201 }
  );
}
