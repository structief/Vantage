/**
 * Contract tests translated from:
 * openspec/changes/repo-sidebar-navigation/tests/feature-repo-sidebar-navigation.flow.md
 * Contract ref: openspec/changes/repo-sidebar-navigation/contracts/api/repo-sidebar-navigation.yaml
 *
 * Flows covered:
 *  - List pinned repos — API contract (ordered by pinned_at ASC)
 *  - Pin repo — API contract (evicts oldest pinned_at at cap)
 *  - Unpin repo — API contract
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const LOGIN = "octocat";

function mockSession(login = LOGIN) {
  vi.doMock("@/auth", () => ({
    auth: vi.fn().mockResolvedValue({
      user: { login },
      expires: new Date(Date.now() + 3600_000).toISOString(),
    }),
  }));
}

function mockNoSession() {
  vi.doMock("@/auth", () => ({
    auth: vi.fn().mockResolvedValue(null),
  }));
}

const PINNED_ROW = {
  github_login: LOGIN,
  full_name: "octocat/hello-world",
  pinned_at: new Date("2026-01-01T10:00:00Z"),
};

// ─── Flow: List pinned repos — API contract ───────────────────────────────────

describe("GET /api/pinned-repos — list pinned repos (pinned_at ASC)", () => {
  beforeEach(() => vi.resetModules());

  it("returns 200 with PinnedRepoListResponse shape sorted by pinned_at asc", async () => {
    mockSession();
    const older = { ...PINNED_ROW, full_name: "octocat/old", pinned_at: new Date("2026-01-01T08:00:00Z") };
    const newer = { ...PINNED_ROW, full_name: "octocat/new", pinned_at: new Date("2026-01-01T10:00:00Z") };
    vi.doMock("@/lib/db", () => ({
      prisma: {
        pinnedRepo: {
          findMany: vi.fn().mockResolvedValue([older, newer]),
        },
      },
    }));

    const { GET } = await import("@/app/api/pinned-repos/route");
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty("pinned_repos");
    expect(Array.isArray(body.pinned_repos)).toBe(true);
    // First entry is oldest (pinned_at ASC)
    expect(body.pinned_repos[0].full_name).toBe("octocat/old");
    expect(body.pinned_repos[0]).toHaveProperty("pinned_at");
    expect(typeof body.pinned_repos[0].pinned_at).toBe("string");
    // No last_browsed field in response
    expect(body.pinned_repos[0]).not.toHaveProperty("last_browsed");
  });

  it("returns 401 when unauthenticated", async () => {
    mockNoSession();
    vi.doMock("@/lib/db", () => ({ prisma: {} }));

    const { GET } = await import("@/app/api/pinned-repos/route");
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toHaveProperty("message");
  });
});

// ─── Flow: Pin repo — API contract ───────────────────────────────────────────

describe("POST /api/pinned-repos — pin repo", () => {
  beforeEach(() => vi.resetModules());

  it("returns 201 PinnedRepo with pinned_at when repo is in cache and not yet pinned", async () => {
    mockSession();
    vi.doMock("@/lib/db", () => ({
      prisma: {
        repoCache: {
          findUnique: vi.fn().mockResolvedValue({
            github_login: LOGIN,
            fetched_at: new Date(),
            repositories: JSON.stringify([{ full_name: "octocat/hello-world" }]),
          }),
        },
        pinnedRepo: {
          findUnique: vi.fn().mockResolvedValue(null),
          count: vi.fn().mockResolvedValue(0),
          create: vi.fn().mockResolvedValue(PINNED_ROW),
        },
      },
    }));

    const { POST } = await import("@/app/api/pinned-repos/route");
    const req = new Request("http://localhost/api/pinned-repos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: "octocat/hello-world" }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.full_name).toBe("octocat/hello-world");
    expect(body).toHaveProperty("pinned_at");
    expect(body).not.toHaveProperty("last_browsed");
  });

  it("returns 400 when repo not found in cache", async () => {
    mockSession();
    vi.doMock("@/lib/db", () => ({
      prisma: {
        repoCache: {
          findUnique: vi.fn().mockResolvedValue({
            github_login: LOGIN,
            fetched_at: new Date(),
            repositories: JSON.stringify([]),
          }),
        },
        pinnedRepo: {},
      },
    }));

    const { POST } = await import("@/app/api/pinned-repos/route");
    const req = new Request("http://localhost/api/pinned-repos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: "octocat/not-mine" }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toBe("Repository not found in your repository list.");
  });

  it("returns 400 when repo is already pinned", async () => {
    mockSession();
    vi.doMock("@/lib/db", () => ({
      prisma: {
        repoCache: {
          findUnique: vi.fn().mockResolvedValue({
            github_login: LOGIN,
            fetched_at: new Date(),
            repositories: JSON.stringify([{ full_name: "octocat/hello-world" }]),
          }),
        },
        pinnedRepo: {
          findUnique: vi.fn().mockResolvedValue(PINNED_ROW),
        },
      },
    }));

    const { POST } = await import("@/app/api/pinned-repos/route");
    const req = new Request("http://localhost/api/pinned-repos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: "octocat/hello-world" }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toBe("Repository is already in your sidebar.");
  });

  it("evicts oldest pinned_at repo when at cap (10) and returns 201", async () => {
    mockSession();
    const oldestRow = { ...PINNED_ROW, full_name: "octocat/oldest", pinned_at: new Date("2025-01-01") };
    const deleteMock = vi.fn().mockResolvedValue({});
    vi.doMock("@/lib/db", () => ({
      prisma: {
        repoCache: {
          findUnique: vi.fn().mockResolvedValue({
            github_login: LOGIN,
            fetched_at: new Date(),
            repositories: JSON.stringify([{ full_name: "octocat/new-repo" }]),
          }),
        },
        pinnedRepo: {
          findUnique: vi.fn().mockResolvedValue(null),
          count: vi.fn().mockResolvedValue(10),
          findFirst: vi.fn().mockResolvedValue(oldestRow),
          delete: deleteMock,
          create: vi.fn().mockResolvedValue({ ...PINNED_ROW, full_name: "octocat/new-repo" }),
        },
      },
    }));

    const { POST } = await import("@/app/api/pinned-repos/route");
    const req = new Request("http://localhost/api/pinned-repos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: "octocat/new-repo" }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.full_name).toBe("octocat/new-repo");
    expect(deleteMock).toHaveBeenCalledOnce();
  });

  it("returns 401 when unauthenticated", async () => {
    mockNoSession();
    vi.doMock("@/lib/db", () => ({ prisma: {} }));

    const { POST } = await import("@/app/api/pinned-repos/route");
    const req = new Request("http://localhost/api/pinned-repos", {
      method: "POST",
      body: JSON.stringify({ full_name: "octocat/hello-world" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });
});

// ─── Flow: Unpin repo — API contract ─────────────────────────────────────────

describe("DELETE /api/pinned-repos/[encodedFullName] — unpin repo", () => {
  beforeEach(() => vi.resetModules());

  it("returns 204 and deletes the row when the repo is pinned", async () => {
    mockSession();
    const deleteMock = vi.fn().mockResolvedValue({});
    vi.doMock("@/lib/db", () => ({
      prisma: {
        pinnedRepo: {
          findUnique: vi.fn().mockResolvedValue(PINNED_ROW),
          delete: deleteMock,
        },
      },
    }));

    const { DELETE } = await import("@/app/api/pinned-repos/[encodedFullName]/route");
    const req = new Request("http://localhost/api/pinned-repos/octocat%2Fhello-world", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params: Promise.resolve({ encodedFullName: "octocat%2Fhello-world" }) });

    expect(res.status).toBe(204);
    expect(deleteMock).toHaveBeenCalledOnce();
  });

  it("returns 404 when repo is not pinned", async () => {
    mockSession();
    vi.doMock("@/lib/db", () => ({
      prisma: {
        pinnedRepo: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      },
    }));

    const { DELETE } = await import("@/app/api/pinned-repos/[encodedFullName]/route");
    const req = new Request("http://localhost/api/pinned-repos/octocat%2Fhello-world", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params: Promise.resolve({ encodedFullName: "octocat%2Fhello-world" }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.message).toBe("Repository not found in your sidebar.");
  });

  it("returns 401 when unauthenticated", async () => {
    mockNoSession();
    vi.doMock("@/lib/db", () => ({ prisma: {} }));

    const { DELETE } = await import("@/app/api/pinned-repos/[encodedFullName]/route");
    const req = new Request("http://localhost", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ encodedFullName: "octocat%2Fhello-world" }) });

    expect(res.status).toBe(401);
  });
});
