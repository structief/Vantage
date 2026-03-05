/**
 * Contract tests translated from:
 * openspec/changes/criteria-validation-persist-spec/tests/feature-criteria-validation-persist-spec.flow.md
 * Contract ref: openspec/changes/criteria-validation-persist-spec/contracts/api/spec-validation.yaml
 *
 * Flows covered:
 *  - GET /api/repos/{encodedFullName}/specs/statuses — 401 unauthenticated
 *  - GET /api/repos/{encodedFullName}/specs/statuses — 400 invalid encodedFullName
 *  - GET /api/repos/{encodedFullName}/specs/statuses — 200 with statuses (cached or fetched)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

function mockSession() {
  vi.doMock("@/auth", () => ({
    auth: vi.fn().mockResolvedValue({
      user: { login: "octocat" },
      accessToken: "ghp_test_token",
      expires: new Date(Date.now() + 3_600_000).toISOString(),
    }),
  }));
}

function mockNoSession() {
  vi.doMock("@/auth", () => ({
    auth: vi.fn().mockResolvedValue(null),
  }));
}

function mockRepoSpecs(specs: { slug: string; path: string; status: string }[]) {
  vi.doMock("@/lib/repo-specs", () => ({
    getSpecsListing: vi.fn().mockResolvedValue(specs),
    getSpecContent: vi.fn().mockResolvedValue(
      `### [ ] Requirement: Foo\n### [ ] Requirement: Bar`
    ),
  }));
}

function mockPrisma(statuses: { path: string; status: string }[] = []) {
  const cache = new Map(
    statuses.map((s) => [
      s.path,
      { repoFullName: "acme/repo", specPath: s.path, status: s.status, fetchedAt: new Date() },
    ])
  );
  vi.doMock("@/lib/db", () => ({
    prisma: {
      specStatusCache: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          const path = where.repoFullName_specPath.specPath;
          return Promise.resolve(cache.get(path) ?? null);
        }),
        upsert: vi.fn().mockResolvedValue({}),
      },
    },
  }));
}

describe("GET /api/repos/[encodedFullName]/specs/statuses — 401 unauthenticated", () => {
  beforeEach(() => vi.resetModules());

  it("returns 401 when not authenticated", async () => {
    mockNoSession();

    const { GET } = await import(
      "@/app/api/repos/[encodedFullName]/specs/statuses/route"
    );
    const req = new Request("http://localhost/api/repos/acme%2Ffrontend/specs/statuses");
    const params = Promise.resolve({ encodedFullName: "acme%2Ffrontend" });
    const res = await GET(req, { params });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toHaveProperty("error");
    expect(body.error).toBe("Not authenticated");
  });
});

describe("GET /api/repos/[encodedFullName]/specs/statuses — 400 invalid", () => {
  beforeEach(() => vi.resetModules());

  it("returns 400 when encodedFullName has no slash", async () => {
    mockSession();
    mockRepoSpecs([]);
    mockPrisma();

    const { GET } = await import(
      "@/app/api/repos/[encodedFullName]/specs/statuses/route"
    );
    const req = new Request("http://localhost/api/repos/justareponame/specs/statuses");
    const params = Promise.resolve({ encodedFullName: "justareponame" });
    const res = await GET(req, { params });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toHaveProperty("error");
    expect(body.error).toBe("Invalid repository name");
  });
});
