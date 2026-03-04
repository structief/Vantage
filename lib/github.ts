import { Octokit } from "@octokit/rest";

export interface CachedRepository {
  id: number;
  full_name: string;
  name: string;
  owner_login: string;
  visibility: "public" | "private";
  default_branch: string;
  read_only: boolean;
}

const MAX_REPOS = 1000;

export async function fetchAllRepos(
  accessToken: string
): Promise<CachedRepository[]> {
  const octokit = new Octokit({ auth: accessToken });

  const repos = await octokit.paginate(
    octokit.rest.repos.listForAuthenticatedUser,
    {
      affiliation: "owner,collaborator,organization_member",
      per_page: 100,
      sort: "updated",
    }
  );

  return repos.slice(0, MAX_REPOS).map((r) => ({
    id: r.id,
    full_name: r.full_name,
    name: r.name,
    owner_login: r.owner.login,
    visibility: r.private ? "private" : "public",
    default_branch: r.default_branch,
    read_only: !(r.permissions?.push ?? true),
  }));
}
