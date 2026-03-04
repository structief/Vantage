import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ encodedFullName: string }> };

function decodeFullName(encoded: string): string {
  return decodeURIComponent(encoded);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.login) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { encodedFullName } = await params;
  const fullName = decodeFullName(encodedFullName);
  const login = session.user.login;

  const row = await prisma.pinnedRepo.findUnique({
    where: { github_login_full_name: { github_login: login, full_name: fullName } },
  });
  if (!row) {
    return NextResponse.json(
      { message: "Repository not found in your sidebar." },
      { status: 404 }
    );
  }

  await prisma.pinnedRepo.delete({
    where: { github_login_full_name: { github_login: login, full_name: fullName } },
  });

  return new NextResponse(null, { status: 204 });
}
