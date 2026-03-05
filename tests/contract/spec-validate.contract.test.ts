/**
 * Contract tests translated from:
 * openspec/changes/criteria-validation-persist-spec/tests/feature-criteria-validation-persist-spec.flow.md
 * Contract ref: openspec/changes/criteria-validation-persist-spec/contracts/api/spec-validation.yaml
 *
 * Flows covered:
 *  - POST /api/repos/{encodedFullName}/specs/validate — 401 unauthenticated
 *  - POST /api/repos/{encodedFullName}/specs/validate — 400 invalid payload
 *  - POST /api/repos/{encodedFullName}/specs/validate — 404 spec not found
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

function mockFetchFileContent(content: string) {
  vi.doMock("@/lib/github-spec", () => ({
    fetchFileContent: vi.fn().mockResolvedValue({ content, filename: "feature-foo.md" }),
    updateSpecFile: vi.fn().mockResolvedValue({ sha: "abc123" }),
  }));
}

function mockFetchFileContentNull() {
  vi.doMock("@/lib/github-spec", () => ({
    fetchFileContent: vi.fn().mockResolvedValue(null),
    updateSpecFile: vi.fn(),
  }));
}

function mockPrisma() {
  vi.doMock("@/lib/db", () => ({
    prisma: {
      specStatusCache: {
        upsert: vi.fn().mockResolvedValue({}),
      },
    },
  }));
}

describe("POST /api/repos/[encodedFullName]/specs/validate — 401 unauthenticated", () => {
  beforeEach(() => vi.resetModules());

  it("returns 401 when not authenticated", async () => {
    mockNoSession();

    const { POST } = await import(
      "@/app/api/repos/[encodedFullName]/specs/validate/route"
    );
    const req = new Request("http://localhost/api/repos/acme%2Ffrontend/specs/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "openspec/changes/foo/specs/feature-foo.md",
        requirementIndex: 0,
        validated: true,
      }),
    });
    const params = Promise.resolve({ encodedFullName: "acme%2Ffrontend" });
    const res = await POST(req, { params });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toHaveProperty("error");
    expect(body.error).toBe("Not authenticated");
  });
});

describe("POST /api/repos/[encodedFullName]/specs/validate — 400 invalid payload", () => {
  beforeEach(() => vi.resetModules());

  it("returns 400 when path is missing", async () => {
    mockSession();
    mockFetchFileContent(`### [ ] Requirement: Foo`);
    mockPrisma();

    const { POST } = await import(
      "@/app/api/repos/[encodedFullName]/specs/validate/route"
    );
    const req = new Request("http://localhost/api/repos/acme%2Ffrontend/specs/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requirementIndex: 0, validated: true }),
    });
    const params = Promise.resolve({ encodedFullName: "acme%2Ffrontend" });
    const res = await POST(req, { params });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toHaveProperty("error");
  });

  it("returns 400 when requirementIndex out of range", async () => {
    mockSession();
    mockFetchFileContent(`### [ ] Requirement: Foo`);
    mockPrisma();

    const { POST } = await import(
      "@/app/api/repos/[encodedFullName]/specs/validate/route"
    );
    const req = new Request("http://localhost/api/repos/acme%2Ffrontend/specs/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "openspec/changes/foo/specs/feature-foo.md",
        requirementIndex: 99,
        validated: true,
      }),
    });
    const params = Promise.resolve({ encodedFullName: "acme%2Ffrontend" });
    const res = await POST(req, { params });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toHaveProperty("error");
    expect(body.error).toContain("index");
  });
});

describe("POST /api/repos/[encodedFullName]/specs/validate — 404 spec not found", () => {
  beforeEach(() => vi.resetModules());

  it("returns 404 when spec file not found", async () => {
    mockSession();
    mockFetchFileContentNull();
    mockPrisma();

    const { POST } = await import(
      "@/app/api/repos/[encodedFullName]/specs/validate/route"
    );
    const req = new Request("http://localhost/api/repos/acme%2Ffrontend/specs/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "openspec/changes/foo/specs/feature-foo.md",
        requirementIndex: 0,
        validated: true,
      }),
    });
    const params = Promise.resolve({ encodedFullName: "acme%2Ffrontend" });
    const res = await POST(req, { params });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toHaveProperty("error");
    expect(body.error).toContain("not found");
  });
});
