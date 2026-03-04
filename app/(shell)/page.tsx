import { auth } from "@/auth";
import { redirect } from "next/navigation";
import NavHeader from "@/components/NavHeader";

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col min-h-screen">
      <NavHeader />
      <main className="flex-1 flex items-center justify-center">
        <p className="text-sm text-gray-400">
          Select a repository from the sidebar or add one to get started.
        </p>
      </main>
    </div>
  );
}
