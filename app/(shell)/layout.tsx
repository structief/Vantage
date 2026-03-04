import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import RepoSidebar from "@/components/RepoSidebar";

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.login) redirect("/login");

  const rows = await prisma.pinnedRepo.findMany({
    where: { github_login: session.user.login },
    orderBy: { pinned_at: "asc" },
    take: 10,
  });

  const pinnedRepos = rows.map((r) => ({
    full_name: r.full_name,
    pinned_at: r.pinned_at.toISOString(),
  }));

  return (
    <div className="flex min-h-screen bg-gray-50">
      <RepoSidebar initialPinnedRepos={pinnedRepos} />
      <div className="flex flex-col flex-1 min-w-0">{children}</div>
    </div>
  );
}
