/**
 * Contract tests translated from:
 * openspec/changes/repo-specs-listing/tests/feature-repo-specs-listing.flow.md
 * Contract ref: openspec/changes/repo-specs-listing/contracts/api/repo-specs-listing.yaml
 *
 * Flows covered:
 *  - GET /api/repos/{encodedFullName}/specs — 200 with grouped data
 *  - GET /api/repos/{encodedFullName}/specs — 200 empty (no openspec/changes/)
 *  - GET /api/repos/{encodedFullName}/specs — 401 unauthenticated
 *  - GET /api/repos/{encodedFullName}/specs — 400 invalid encodedFullName
 *  - GET /api/repos/{encodedFullName}/spec-content — 200 with file content
 *  - GET /api/repos/{encodedFullName}/spec-content — 404 file not found
 *  - GET /api/repos/{encodedFullName}/spec-content — 400 missing path param
 *  - GET /api/repos/{encodedFullName}/spec-content — 401 unauthenticated
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

type ContentItem = { name: string; type: string; content?: string };
type OctokitMap = Record<string, ContentItem[] | "404" | ContentItem>;

function mockOctokit(pathMap: OctokitMap) {
  vi.doMock("@octokit/rest", () => ({
    Octokit: vi.fn().mockImplementation(() => ({
      rest: {
        repos: {
          getContent: vi.fn().mockImplementation(({ path }: { path: string }) => {
            const result = pathMap[path];
            if (result === undefined || result === "404") {
              const err = Object.assign(new Error("Not Found"), { status: 404 });
              return Promise.reject(err);
            }
            return Promise.resolve({ data: result });
          }),
        },
      },
    })),
  }));
}

// ─── GET /specs — success with active + archived specs ────────────────────────

describe("GET /api/repos/[encodedFullName]/specs — active and archived specs", () => {
  beforeEach(() => vi.resetModules());

  it("returns 200 with ungrouped active spec and archived spec", async () => {
    mockSession();
    mockOctokit({
      "openspec/changes": [
        { name: "secondary-sidebar-nav", type: "dir" },
        { name: "archive", type: "dir" },
      ],
      "openspec/changes/secondary-sidebar-nav/specs": [
        { name: "feature-secondary-sidebar-nav.md", type: "file" },
      ],
      // archive has no specs/ → treated as group dir
      "openspec/changes/archive": [
        { name: "2026-03-04-old-feature", type: "dir" },
      ],
      "openspec/changes/archive/2026-03-04-old-feature/specs": [
        { name: "feature-old.md", type: "file" },
      ],
    });

    const { GET } = await import("@/app/api/repos/[encodedFullName]/specs/route");
    const req = new Request("http://localhost");
    const params = Promise.resolve({ encodedFullName: "acme%2Ffrontend" });
    const res = await GET(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body.specs)).toBe(true);

    const active = body.specs.find(
      (s: { slug: string }) => s.slug === "feature-secondary-sidebar-nav"
    );
    expect(active).toMatchObject({
      slug: "feature-secondary-sidebar-nav",
      group: null,
      status: "active",
      path: "openspec/changes/secondary-sidebar-nav/specs/feature-secondary-sidebar-nav.md",
    });

    const archived = body.specs.find(
      (s: { slug: string }) => s.slug === "feature-old"
    );
    expect(archived).toMatchObject({
      slug: "feature-old",
      group: "archive",
      status: "archived",
    });

    // Ungrouped active before archived
    const activeIdx = body.specs.findIndex(
      (s: { slug: string }) => s.slug === "feature-secondary-sidebar-nav"
    );
    const archivedIdx = body.specs.findIndex(
      (s: { slug: string }) => s.slug === "feature-old"
    );
    expect(activeIdx).toBeLessThan(archivedIdx);
  });
});

// ─── GET /specs — empty (no openspec/changes/) ────────────────────────────────

describe("GET /api/repos/[encodedFullName]/specs — no openspec directory", () => {
  beforeEach(() => vi.resetModules());

  it("returns 200 with empty specs array when openspec/changes/ is absent", async () => {
    mockSession();
    mockOctokit({ "openspec/changes": "404" });

    const { GET } = await import("@/app/api/repos/[encodedFullName]/specs/route");
    const req = new Request("http://localhost");
    const params = Promise.resolve({ encodedFullName: "acme%2Fempty" });
    const res = await GET(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ specs: [] });
  });
});

// ─── GET /specs — unauthenticated ─────────────────────────────────────────────

describe("GET /api/repos/[encodedFullName]/specs — unauthenticated", () => {
  beforeEach(() => vi.resetModules());

  it("returns 401 when session is missing", async () => {
    mockNoSession();

    const { GET } = await import("@/app/api/repos/[encodedFullName]/specs/route");
    const req = new Request("http://localhost");
    const params = Promise.resolve({ encodedFullName: "acme%2Frepo" });
    const res = await GET(req, { params });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Not authenticated");
  });
});

// ─── GET /specs — bad encodedFullName ─────────────────────────────────────────

describe("GET /api/repos/[encodedFullName]/specs — invalid encodedFullName", () => {
  beforeEach(() => vi.resetModules());

  it("returns 400 when encodedFullName decodes without a slash", async () => {
    mockSession();

    const { GET } = await import("@/app/api/repos/[encodedFullName]/specs/route");
    const req = new Request("http://localhost");
    const params = Promise.resolve({ encodedFullName: "justareponame" });
    const res = await GET(req, { params });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid repository name");
  });
});

// ─── GET /spec-content — success ──────────────────────────────────────────────

describe("GET /api/repos/[encodedFullName]/spec-content — success", () => {
  beforeEach(() => vi.resetModules());

  it("returns 200 with raw file content", async () => {
    const rawContent = "# My Spec Title\n\n## ADDED Requirements\n";
    const base64Content = Buffer.from(rawContent).toString("base64");

    mockSession();
    mockOctokit({
      "openspec/changes/some-change/specs/feature.md": {
        name: "feature.md",
        type: "file",
        content: base64Content,
      },
    });

    const { GET } = await import(
      "@/app/api/repos/[encodedFullName]/spec-content/route"
    );
    const path = "openspec/changes/some-change/specs/feature.md";
    const req = new Request(
      `http://localhost?path=${encodeURIComponent(path)}`
    );
    const params = Promise.resolve({ encodedFullName: "acme%2Frepo" });
    const res = await GET(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty("content");
    expect(body.content).toBe(rawContent);
  });
});

// ─── GET /spec-content — file not found ───────────────────────────────────────

describe("GET /api/repos/[encodedFullName]/spec-content — file not found", () => {
  beforeEach(() => vi.resetModules());

  it("returns 404 when file does not exist", async () => {
    mockSession();
    mockOctokit({ "openspec/changes/missing/specs/nope.md": "404" });

    const { GET } = await import(
      "@/app/api/repos/[encodedFullName]/spec-content/route"
    );
    const path = "openspec/changes/missing/specs/nope.md";
    const req = new Request(
      `http://localhost?path=${encodeURIComponent(path)}`
    );
    const params = Promise.resolve({ encodedFullName: "acme%2Frepo" });
    const res = await GET(req, { params });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("File not found");
  });
});

// ─── GET /spec-content — missing path param ───────────────────────────────────

describe("GET /api/repos/[encodedFullName]/spec-content — missing path", () => {
  beforeEach(() => vi.resetModules());

  it("returns 400 when path query param is missing", async () => {
    mockSession();
    mockOctokit({});

    const { GET } = await import(
      "@/app/api/repos/[encodedFullName]/spec-content/route"
    );
    const req = new Request("http://localhost");
    const params = Promise.resolve({ encodedFullName: "acme%2Frepo" });
    const res = await GET(req, { params });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Missing path parameter");
  });
});

// ─── GET /spec-content — unauthenticated ──────────────────────────────────────

describe("GET /api/repos/[encodedFullName]/spec-content — unauthenticated", () => {
  beforeEach(() => vi.resetModules());

  it("returns 401 when session is missing", async () => {
    mockNoSession();

    const { GET } = await import(
      "@/app/api/repos/[encodedFullName]/spec-content/route"
    );
    const req = new Request("http://localhost?path=some%2Ffile.md");
    const params = Promise.resolve({ encodedFullName: "acme%2Frepo" });
    const res = await GET(req, { params });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Not authenticated");
  });
});
