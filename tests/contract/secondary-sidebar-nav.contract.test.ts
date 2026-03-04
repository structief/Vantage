/**
 * Contract tests translated from:
 * openspec/changes/secondary-sidebar-nav/tests/feature-secondary-sidebar-nav.flow.md
 * Contract ref: openspec/changes/secondary-sidebar-nav/contracts/api/secondary-sidebar-nav.yaml
 *
 * Flows covered:
 *  - GET /api/repos/{encodedFullName}/projects — success (2 projects with spec counts)
 *  - GET /api/repos/{encodedFullName}/projects — empty repo (openspec/changes/ absent)
 *  - GET /api/repos/{encodedFullName}/projects — unauthenticated → 401
 *  - GET /api/repos/{encodedFullName}/projects — malformed encodedFullName → 400
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const LOGIN = "octocat";

function mockSession() {
  vi.doMock("@/auth", () => ({
    auth: vi.fn().mockResolvedValue({
      user: { login: LOGIN },
      accessToken: "ghp_test_token",
      expires: new Date(Date.now() + 3600_000).toISOString(),
    }),
  }));
}

function mockNoSession() {
  vi.doMock("@/auth", () => ({
    auth: vi.fn().mockResolvedValue(null),
  }));
}

function mockOctokit(
  changesContent: { name: string; type: string }[] | "404",
  specsContent: Record<string, { name: string; type: string }[] | "404"> = {}
) {
  vi.doMock("@octokit/rest", () => ({
    Octokit: vi.fn().mockImplementation(() => ({
      rest: {
        repos: {
          getContent: vi.fn().mockImplementation(({ path }: { path: string }) => {
            if (path === "openspec/changes") {
              if (changesContent === "404") {
                const err = Object.assign(new Error("Not Found"), { status: 404 });
                return Promise.reject(err);
              }
              return Promise.resolve({ data: changesContent });
            }
            const slug = path.split("/")[2];
            const content = specsContent[slug];
            if (!content || content === "404") {
              const err = Object.assign(new Error("Not Found"), { status: 404 });
              return Promise.reject(err);
            }
            return Promise.resolve({ data: content });
          }),
        },
      },
    })),
  }));
}

// ─── Flow: GET projects — success ────────────────────────────────────────────

describe("GET /api/repos/[encodedFullName]/projects — success", () => {
  beforeEach(() => vi.resetModules());

  it("returns 200 with ProjectsResponse containing 2 projects", async () => {
    mockSession();
    mockOctokit(
      [
        { name: "auth-flow", type: "dir" },
        { name: "billing", type: "dir" },
      ],
      {
        "auth-flow": [
          { name: "feature-auth.md", type: "file" },
          { name: "feature-auth2.md", type: "file" },
          { name: "feature-auth3.md", type: "file" },
        ],
        billing: [{ name: "feature-billing.md", type: "file" }],
      }
    );

    const { GET } = await import(
      "@/app/api/repos/[encodedFullName]/projects/route"
    );
    const req = new Request("http://localhost");
    const params = Promise.resolve({ encodedFullName: "acme%2Ffrontend" });
    const res = await GET(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty("projects");
    expect(Array.isArray(body.projects)).toBe(true);
    expect(body.projects).toHaveLength(2);

    const authProject = body.projects.find(
      (p: { slug: string }) => p.slug === "auth-flow"
    );
    expect(authProject).toBeDefined();
    expect(authProject.name).toBe("Auth Flow");
    expect(authProject.specCount).toBe(3);

    const billingProject = body.projects.find(
      (p: { slug: string }) => p.slug === "billing"
    );
    expect(billingProject).toBeDefined();
    expect(billingProject.name).toBe("Billing");
    expect(billingProject.specCount).toBe(1);
  });

  it("filters out non-.md files from spec count", async () => {
    mockSession();
    mockOctokit([{ name: "my-feature", type: "dir" }], {
      "my-feature": [
        { name: "spec.md", type: "file" },
        { name: "README.txt", type: "file" },
        { name: "images", type: "dir" },
      ],
    });

    const { GET } = await import(
      "@/app/api/repos/[encodedFullName]/projects/route"
    );
    const req = new Request("http://localhost");
    const params = Promise.resolve({ encodedFullName: "acme%2Frepo" });
    const res = await GET(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.projects[0].specCount).toBe(1);
  });
});

// ─── Flow: GET projects — empty repo ─────────────────────────────────────────

describe("GET /api/repos/[encodedFullName]/projects — empty repo", () => {
  beforeEach(() => vi.resetModules());

  it("returns 200 with empty projects array when openspec/changes/ is absent", async () => {
    mockSession();
    mockOctokit("404");

    const { GET } = await import(
      "@/app/api/repos/[encodedFullName]/projects/route"
    );
    const req = new Request("http://localhost");
    const params = Promise.resolve({ encodedFullName: "acme%2Fempty" });
    const res = await GET(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ projects: [] });
  });
});

// ─── Flow: GET projects — unauthenticated ─────────────────────────────────────

describe("GET /api/repos/[encodedFullName]/projects — unauthenticated", () => {
  beforeEach(() => vi.resetModules());

  it("returns 401 when session is missing", async () => {
    mockNoSession();

    const { GET } = await import(
      "@/app/api/repos/[encodedFullName]/projects/route"
    );
    const req = new Request("http://localhost");
    const params = Promise.resolve({ encodedFullName: "acme%2Frepo" });
    const res = await GET(req, { params });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toHaveProperty("error");
    expect(body.error).toBe("Not authenticated");
  });
});

// ─── Flow: GET projects — malformed encodedFullName ──────────────────────────

describe("GET /api/repos/[encodedFullName]/projects — bad input", () => {
  beforeEach(() => vi.resetModules());

  it("returns 400 when encodedFullName decodes without a slash", async () => {
    mockSession();
    mockOctokit([]);

    const { GET } = await import(
      "@/app/api/repos/[encodedFullName]/projects/route"
    );
    const req = new Request("http://localhost");
    const params = Promise.resolve({ encodedFullName: "justareponame" });
    const res = await GET(req, { params });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toHaveProperty("error");
    expect(body.error).toBe("Invalid repository name");
  });
});
