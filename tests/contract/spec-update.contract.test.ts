/**
 * Contract tests translated from:
 * openspec/changes/edit-functional-spec/tests/feature-edit-functional-spec.flow.md
 * Contract ref: openspec/changes/edit-functional-spec/contracts/api/edit-functional-spec.yaml
 *
 * Flows covered:
 *  - Successful spec save with git commit — PUT returns 200 with sha
 *  - 401 unauthenticated
 *  - 400 missing path
 *  - 400 missing content
 *  - 404 file not found on GitHub
 *  - 409 conflict from GitHub
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

function mockUpdateSpecFile(result: { sha: string } | null) {
  vi.doMock("@/lib/github-spec", () => ({
    updateSpecFile: vi.fn().mockResolvedValue(result),
  }));
}

function mockUpdateSpecFileThrows(status: number) {
  vi.doMock("@/lib/github-spec", () => ({
    updateSpecFile: vi.fn().mockRejectedValue(
      Object.assign(new Error("GitHub error"), { status })
    ),
  }));
}

const VALID_BODY = {
  path: "openspec/changes/edit-functional-spec/specs/feature.md",
  content: "### Requirement: Updated Requirement\nBody.",
};

// ─── 401 unauthenticated ──────────────────────────────────────────────────────

describe("PUT /api/repos/[encodedFullName]/specs/update — 401 unauthenticated", () => {
  beforeEach(() => vi.resetModules());

  it("returns 401 when not authenticated", async () => {
    mockNoSession();

    const { PUT } = await import("@/app/api/repos/[encodedFullName]/specs/update/route");
    const req = new Request("http://localhost/api/repos/acme%2Ffrontend/specs/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(VALID_BODY),
    });
    const params = Promise.resolve({ encodedFullName: "acme%2Ffrontend" });
    const res = await PUT(req, { params });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toHaveProperty("error");
    expect(body.error).toBe("Not authenticated");
  });
});

// ─── 400 missing path ────────────────────────────────────────────────────────

describe("PUT /api/repos/[encodedFullName]/specs/update — 400 missing path", () => {
  beforeEach(() => vi.resetModules());

  it("returns 400 when path is missing from the request body", async () => {
    mockSession();
    mockUpdateSpecFile({ sha: "abc123" });

    const { PUT } = await import("@/app/api/repos/[encodedFullName]/specs/update/route");
    const req = new Request("http://localhost/api/repos/acme%2Ffrontend/specs/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "## ADDED Requirements" }),
    });
    const params = Promise.resolve({ encodedFullName: "acme%2Ffrontend" });
    const res = await PUT(req, { params });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toHaveProperty("error");
    expect(body.error).toContain("path");
  });
});

// ─── 400 missing content ─────────────────────────────────────────────────────

describe("PUT /api/repos/[encodedFullName]/specs/update — 400 missing content", () => {
  beforeEach(() => vi.resetModules());

  it("returns 400 when content is missing from the request body", async () => {
    mockSession();
    mockUpdateSpecFile({ sha: "abc123" });

    const { PUT } = await import("@/app/api/repos/[encodedFullName]/specs/update/route");
    const req = new Request("http://localhost/api/repos/acme%2Ffrontend/specs/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: VALID_BODY.path }),
    });
    const params = Promise.resolve({ encodedFullName: "acme%2Ffrontend" });
    const res = await PUT(req, { params });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toHaveProperty("error");
    expect(body.error).toContain("content");
  });
});

// ─── Flow: Successful spec save with git commit ───────────────────────────────

describe("PUT /api/repos/[encodedFullName]/specs/update — 200 successful save", () => {
  beforeEach(() => vi.resetModules());

  it("returns 200 with sha when updateSpecFile succeeds", async () => {
    mockSession();
    mockUpdateSpecFile({ sha: "deadbeef123" });

    const { PUT } = await import("@/app/api/repos/[encodedFullName]/specs/update/route");
    const req = new Request("http://localhost/api/repos/acme%2Ffrontend/specs/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(VALID_BODY),
    });
    const params = Promise.resolve({ encodedFullName: "acme%2Ffrontend" });
    const res = await PUT(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty("sha", "deadbeef123");
  });
});

// ─── 404 file not found ───────────────────────────────────────────────────────

describe("PUT /api/repos/[encodedFullName]/specs/update — 404 file not found", () => {
  beforeEach(() => vi.resetModules());

  it("returns 404 when updateSpecFile returns null (file not found on GitHub)", async () => {
    mockSession();
    mockUpdateSpecFile(null);

    const { PUT } = await import("@/app/api/repos/[encodedFullName]/specs/update/route");
    const req = new Request("http://localhost/api/repos/acme%2Ffrontend/specs/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(VALID_BODY),
    });
    const params = Promise.resolve({ encodedFullName: "acme%2Ffrontend" });
    const res = await PUT(req, { params });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toHaveProperty("error");
    expect(body.error).toContain("not found");
  });
});

// ─── 409 conflict ────────────────────────────────────────────────────────────

describe("PUT /api/repos/[encodedFullName]/specs/update — 409 conflict", () => {
  beforeEach(() => vi.resetModules());

  it("returns 409 when GitHub API reports a commit conflict", async () => {
    mockSession();
    mockUpdateSpecFileThrows(409);

    const { PUT } = await import("@/app/api/repos/[encodedFullName]/specs/update/route");
    const req = new Request("http://localhost/api/repos/acme%2Ffrontend/specs/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(VALID_BODY),
    });
    const params = Promise.resolve({ encodedFullName: "acme%2Ffrontend" });
    const res = await PUT(req, { params });
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body).toHaveProperty("error");
    expect(body.error).toContain("conflict");
  });
});
