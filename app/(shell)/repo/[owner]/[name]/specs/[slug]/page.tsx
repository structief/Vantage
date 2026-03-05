import { auth } from "@/auth";
import { getSpecsListing, getSpecContent, extractTitle } from "@/lib/repo-specs";
import { Octokit } from "@octokit/rest";

interface Props {
  params: Promise<{ owner: string; name: string; slug: string }>;
}

export default async function SpecDetailPage({ params }: Props) {
  const { owner, name, slug } = await params;

  const session = await auth();
  const accessToken = (session as { accessToken?: string } | null)?.accessToken;

  let title = slug;
  let found = true;

  if (accessToken) {
    try {
      const octokit = new Octokit({ auth: accessToken });
      const specs = await getSpecsListing(owner, name, octokit);
      const entry = specs.find((s) => s.slug === slug);

      if (entry) {
        const content = await getSpecContent(owner, name, entry.path, octokit);
        if (content) {
          title = extractTitle(content, slug);
        }
      } else {
        found = false;
      }
    } catch {
      // GitHub API error (bad credentials, network, etc.) — degrade gracefully
      found = false;
    }
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 px-8 pt-8">
      {!found ? (
        <p className="text-sm text-gray-400">Spec not found.</p>
      ) : (
        <>
          <p className="text-[11px] font-mono text-gray-400 mb-2 select-all">{slug}</p>
          <h1 className="text-2xl font-semibold text-gray-900 leading-tight">{title}</h1>
        </>
      )}
    </div>
  );
}
