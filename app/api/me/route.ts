import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user?.login) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED", message: "Your session has expired. Please sign in again." },
      { status: 401 }
    );
  }

  const profile = await prisma.userProfile.findUnique({
    where: { github_login: session.user.login },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "PROFILE_NOT_FOUND", message: "User profile not found. Please sign in again." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    github_login: profile.github_login,
    name: profile.name,
    avatar_url: profile.avatar_url,
  });
}
