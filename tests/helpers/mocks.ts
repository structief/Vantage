import { vi } from "vitest";

export const mockSession = {
  user: {
    login: "octocat",
    name: "The Octocat",
    email: null,
    image: "https://avatars.githubusercontent.com/u/583231",
  },
  accessToken: "gho_test_access_token",
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
};

export const mockUserProfile = {
  github_login: "octocat",
  name: "The Octocat",
  avatar_url: "https://avatars.githubusercontent.com/u/583231",
  updated_at: new Date("2026-03-01T10:00:00Z"),
};

export const mockRepo = {
  id: 12345,
  full_name: "octocat/hello-world",
  name: "hello-world",
  owner_login: "octocat",
  visibility: "public" as const,
  default_branch: "main",
  read_only: false,
};

export const mockRepoCache = {
  github_login: "octocat",
  fetched_at: new Date("2026-03-01T10:00:00Z"),
  repositories: JSON.stringify([mockRepo]),
};

export function mockAuth(session: typeof mockSession | null = mockSession) {
  vi.mock("@/auth", () => ({ auth: vi.fn().mockResolvedValue(session) }));
}

export function mockPrisma() {
  vi.mock("@/lib/db", () => ({
    prisma: {
      userProfile: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      repoCache: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
    },
  }));
}

export function mockGitHub(repos = [mockRepo]) {
  vi.mock("@/lib/github", () => ({
    fetchAllRepos: vi.fn().mockResolvedValue(repos),
  }));
}
