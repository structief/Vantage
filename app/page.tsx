import { auth } from "@/auth";
import { redirect } from "next/navigation";
import NavHeader from "@/components/NavHeader";
import RepoList from "@/components/RepoList";

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <NavHeader />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <RepoList />
      </main>
    </div>
  );
}
