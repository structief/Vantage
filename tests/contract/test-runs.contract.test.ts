/**
 * Contract tests translated from:
 * openspec/changes/spec-tests-visualisation/tests/feature-tests-visualisation.flow.md
 * Contract ref: openspec/changes/spec-tests-visualisation/contracts/api/test-runs.yaml
 *
 * Flows covered:
 *  - POST /api/repos/{encodedFullName}/test-runs — 200 creates TestRun, returns id
 *  - POST /api/repos/{encodedFullName}/test-runs — 401 when not authenticated
 *  - POST /api/repos/{encodedFullName}/test-runs — 400 when required fields missing
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

function mockPrisma(createResult: { id: string }) {
  vi.doMock("@/lib/db", () => ({
    prisma: {
      testRun: {
        create: vi.fn().mockResolvedValue(createResult),
      },
    },
  }));
}

describe("POST /api/repos/[encodedFullName]/test-runs — success", () => {
  beforeEach(() => vi.resetModules());

  it("returns 200 with id when valid payload", async () => {
    mockSession();
    mockPrisma({ id: "clx123testrun" });

    const { POST } = await import(
      "@/app/api/repos/[encodedFullName]/test-runs/route"
    );
    const req = new Request("http://localhost/api/repos/acme%2Ffrontend/test-runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        changePath: "spec-tests-visualisation",
        specSlug: "feature-tests-visualisation",
        passedCount: 4,
        failedCount: 0,
      }),
    });
    const params = Promise.resolve({ encodedFullName: "acme%2Ffrontend" });
    const res = await POST(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty("id");
    expect(typeof body.id).toBe("string");
  });
});

describe("POST /api/repos/[encodedFullName]/test-runs — 401 unauthenticated", () => {
  beforeEach(() => vi.resetModules());

  it("returns 401 when not authenticated", async () => {
    mockNoSession();

    const { POST } = await import(
      "@/app/api/repos/[encodedFullName]/test-runs/route"
    );
    const req = new Request("http://localhost/api/repos/acme%2Ffrontend/test-runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        changePath: "spec-tests-visualisation",
        specSlug: "feature-tests-visualisation",
        passedCount: 4,
        failedCount: 0,
      }),
    });
    const params = Promise.resolve({ encodedFullName: "acme%2Ffrontend" });
    const res = await POST(req, { params });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toMatchObject({ error: "Not authenticated" });
  });
});

describe("POST /api/repos/[encodedFullName]/test-runs — 400 missing required fields", () => {
  beforeEach(() => vi.resetModules());

  it("returns 400 when changePath missing", async () => {
    mockSession();

    const { POST } = await import(
      "@/app/api/repos/[encodedFullName]/test-runs/route"
    );
    const req = new Request("http://localhost/api/repos/acme%2Ffrontend/test-runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        specSlug: "feature-tests-visualisation",
        passedCount: 4,
        failedCount: 0,
      }),
    });
    const params = Promise.resolve({ encodedFullName: "acme%2Ffrontend" });
    const res = await POST(req, { params });

    expect(res.status).toBe(400);
  });

  it("returns 400 when specSlug missing", async () => {
    mockSession();

    const { POST } = await import(
      "@/app/api/repos/[encodedFullName]/test-runs/route"
    );
    const req = new Request("http://localhost/api/repos/acme%2Ffrontend/test-runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        changePath: "spec-tests-visualisation",
        passedCount: 4,
        failedCount: 0,
      }),
    });
    const params = Promise.resolve({ encodedFullName: "acme%2Ffrontend" });
    const res = await POST(req, { params });

    expect(res.status).toBe(400);
  });

  it("returns 400 when passedCount missing", async () => {
    mockSession();

    const { POST } = await import(
      "@/app/api/repos/[encodedFullName]/test-runs/route"
    );
    const req = new Request("http://localhost/api/repos/acme%2Ffrontend/test-runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        changePath: "spec-tests-visualisation",
        specSlug: "feature-tests-visualisation",
        failedCount: 0,
      }),
    });
    const params = Promise.resolve({ encodedFullName: "acme%2Ffrontend" });
    const res = await POST(req, { params });

    expect(res.status).toBe(400);
  });

  it("returns 400 when failedCount missing", async () => {
    mockSession();

    const { POST } = await import(
      "@/app/api/repos/[encodedFullName]/test-runs/route"
    );
    const req = new Request("http://localhost/api/repos/acme%2Ffrontend/test-runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        changePath: "spec-tests-visualisation",
        specSlug: "feature-tests-visualisation",
        passedCount: 4,
      }),
    });
    const params = Promise.resolve({ encodedFullName: "acme%2Ffrontend" });
    const res = await POST(req, { params });

    expect(res.status).toBe(400);
  });
});
