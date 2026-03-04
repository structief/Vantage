import { auth } from "@/auth";
import { redirect } from "next/navigation";
import NavHeader from "@/components/NavHeader";

interface Props {
  params: Promise<{ owner: string; name: string }>;
}

export default async function RepoPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect("/login");

  const { owner, name } = await params;
  const fullName = `${owner}/${name}`;

  return (
    <div className="flex flex-col min-h-screen">
      <NavHeader />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold text-gray-900">{fullName}</h1>
      </main>
    </div>
  );
}
