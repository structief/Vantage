import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import RepoSidebar from "@/components/RepoSidebar";
import SecondarySidebar from "@/components/SecondarySidebar";
import { SidebarModeProvider } from "@/components/SidebarModeProvider";

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
    <SidebarModeProvider>
      <div className="flex min-h-screen bg-gray-50">
        <RepoSidebar initialPinnedRepos={pinnedRepos} />
        <SecondarySidebar />
        <div className="flex flex-col flex-1 min-w-0">{children}</div>
      </div>
    </SidebarModeProvider>
  );
}
