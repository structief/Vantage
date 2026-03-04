/**
 * Contract tests translated from:
 * openspec/changes/github-auth-repo-access/tests/feature-github-auth-repo-access.flow.md
 * Contract ref: openspec/changes/github-auth-repo-access/contracts/api/github-auth-repo-access.yaml
 *
 * Flows covered:
 *  - Repositories loaded after login
 *  - User has no accessible repositories
 *  - GitHub API rate limit exceeded during listing
 *  - User manually refreshes the repository list
 *  - Repository with insufficient permissions (contract shape)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const FRESH_CACHE = {
  github_login: "octocat",
  fetched_at: new Date(),
  repositories: JSON.stringify([
    {
      id: 12345,
      full_name: "octocat/hello-world",
      name: "hello-world",
      owner_login: "octocat",
      visibility: "public",
      default_branch: "main",
      read_only: false,
    },
  ]),
};

const STALE_CACHE = {
  ...FRESH_CACHE,
  fetched_at: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago
};

function mockValidSession() {
  vi.doMock("@/auth", () => ({
    auth: vi.fn().mockResolvedValue({
      user: { login: "octocat", name: "The Octocat" },
      accessToken: "gho_test_token",
      expires: new Date(Date.now() + 3600_000).toISOString(),
    }),
  }));
}

// ─── Flow: Repositories loaded after login ───────────────────────────────────
// Type: contract
// Spec: Requirement: Accessible Repository Listing
// Contract: GET /api/repos → RepoListResponse

describe("GET /api/repos — Repositories loaded after login", () => {
  beforeEach(() => {
    vi.resetModules();
    mockValidSession();
  });

  it("returns RepoListResponse shape with fetched_at, stale, and repositories array", async () => {
    vi.doMock("@/lib/db", () => ({
      prisma: {
        repoCache: {
          findUnique: vi.fn().mockResolvedValue(null), // no cache
          upsert: vi.fn().mockResolvedValue({}),
        },
      },
    }));

    vi.doMock("@/lib/github", () => ({
      fetchAllRepos: vi.fn().mockResolvedValue([
        {
          id: 12345,
          full_name: "octocat/hello-world",
          name: "hello-world",
          owner_login: "octocat",
          visibility: "public",
          default_branch: "main",
          read_only: false,
        },
      ]),
    }));

    const { GET } = await import("@/app/api/repos/route");
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    // RepoListResponse required fields per contract
    expect(body).toHaveProperty("fetched_at");
    expect(body).toHaveProperty("stale", false);
    expect(Array.isArray(body.repositories)).toBe(true);

    // Repository shape per contract
    const repo = body.repositories[0];
    expect(repo).toHaveProperty("id");
    expect(repo).toHaveProperty("full_name");
    expect(repo).toHaveProperty("name");
    expect(repo).toHaveProperty("owner_login");
    expect(repo).toHaveProperty("visibility");
    expect(repo).toHaveProperty("default_branch");
    expect(repo).toHaveProperty("read_only");
  });
});

// ─── Flow: User has no accessible repositories ───────────────────────────────
// Type: contract
// Contract: GET /api/repos → repositories: []

describe("GET /api/repos — User has no accessible repositories", () => {
  beforeEach(() => {
    vi.resetModules();
    mockValidSession();
  });

  it("returns 200 with empty repositories array when GitHub returns no repos", async () => {
    vi.doMock("@/lib/db", () => ({
      prisma: {
        repoCache: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn().mockResolvedValue({}),
        },
      },
    }));

    vi.doMock("@/lib/github", () => ({
      fetchAllRepos: vi.fn().mockResolvedValue([]),
    }));

    const { GET } = await import("@/app/api/repos/route");
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.stale).toBe(false);
    expect(body.repositories).toEqual([]);
  });
});

// ─── Flow: GitHub API rate limit exceeded during listing ─────────────────────
// Type: contract
// Contract: GET /api/repos → stale:true, rate_limit_hit:true when rate-limited with cache

describe("GET /api/repos — GitHub API rate limit exceeded", () => {
  beforeEach(() => {
    vi.resetModules();
    mockValidSession();
  });

  it("returns stale cache with rate_limit_hit=true when GitHub returns 429", async () => {
    vi.doMock("@/lib/db", () => ({
      prisma: {
        repoCache: {
          findUnique: vi.fn().mockResolvedValue(STALE_CACHE),
          upsert: vi.fn(),
        },
      },
    }));

    const rateLimitError = Object.assign(new Error("Rate limited"), { status: 429 });
    vi.doMock("@/lib/github", () => ({
      fetchAllRepos: vi.fn().mockRejectedValue(rateLimitError),
    }));

    const { GET } = await import("@/app/api/repos/route");
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.stale).toBe(true);
    expect(body.rate_limit_hit).toBe(true);
    expect(Array.isArray(body.repositories)).toBe(true);
  });

  it("returns 503 GITHUB_UNAVAILABLE when rate-limited with no cached data", async () => {
    vi.doMock("@/lib/db", () => ({
      prisma: {
        repoCache: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn(),
        },
      },
    }));

    const rateLimitError = Object.assign(new Error("Rate limited"), { status: 429 });
    vi.doMock("@/lib/github", () => ({
      fetchAllRepos: vi.fn().mockRejectedValue(rateLimitError),
    }));

    const { GET } = await import("@/app/api/repos/route");
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toBe("GITHUB_UNAVAILABLE");
    expect(body.message).toContain("rate limit");
  });
});

// ─── Flow: User manually refreshes the repository list ───────────────────────
// Type: contract
// Contract: POST /api/repos/refresh → RepoListResponse with stale:false

describe("POST /api/repos/refresh — Manual refresh", () => {
  beforeEach(() => {
    vi.resetModules();
    mockValidSession();
  });

  it("bypasses TTL and returns fresh RepoListResponse with stale=false", async () => {
    vi.doMock("@/lib/db", () => ({
      prisma: {
        repoCache: {
          findUnique: vi.fn().mockResolvedValue(FRESH_CACHE),
          upsert: vi.fn().mockResolvedValue({}),
        },
      },
    }));

    vi.doMock("@/lib/github", () => ({
      fetchAllRepos: vi.fn().mockResolvedValue([
        {
          id: 99999,
          full_name: "octocat/new-repo",
          name: "new-repo",
          owner_login: "octocat",
          visibility: "private",
          default_branch: "main",
          read_only: false,
        },
      ]),
    }));

    const { POST } = await import("@/app/api/repos/refresh/route");
    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.stale).toBe(false);
    expect(body.repositories[0].full_name).toBe("octocat/new-repo");
    expect(new Date(body.fetched_at).getTime()).toBeGreaterThan(
      FRESH_CACHE.fetched_at.getTime()
    );
  });

  it("returns 429 RATE_LIMITED when force-refresh hits a rate limit", async () => {
    vi.doMock("@/lib/db", () => ({
      prisma: {
        repoCache: { upsert: vi.fn() },
      },
    }));

    const rateLimitError = Object.assign(new Error("Rate limited"), { status: 429 });
    vi.doMock("@/lib/github", () => ({
      fetchAllRepos: vi.fn().mockRejectedValue(rateLimitError),
    }));

    const { POST } = await import("@/app/api/repos/refresh/route");
    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe("RATE_LIMITED");
  });
});
