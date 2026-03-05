/**
 * Playwright global setup — runs once before all e2e tests.
 *
 * 1. Seeds a dedicated test user (login: "e2etest") with two pinned repos into
 *    the SQLite database so the shell layout renders a populated sidebar.
 * 2. Mints a NextAuth v5 JWT signed with NEXTAUTH_SECRET and writes an
 *    authenticated Playwright storageState to tests/e2e/.auth/user.json.
 *    All test files that need auth load this storageState automatically.
 */

import { encode } from "next-auth/jwt";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

const E2E_LOGIN = "e2etest";
const COOKIE_NAME = "authjs.session-token"; // NextAuth v5 dev cookie name
const AUTH_FILE = path.join(process.cwd(), "tests/e2e/.auth/user.json");

export const PINNED_REPOS = [
  { full_name: "acme/alpha", pinned_at: new Date(Date.now() - 10 * 60 * 1000) },
  { full_name: "acme/beta", pinned_at: new Date(Date.now() - 5 * 60 * 1000) },
];

export default async function globalSetup() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.warn(
      "[e2e global-setup] NEXTAUTH_SECRET is not set — " +
        "authenticated tests will fail. Add it to your .env file."
    );
  }

  const prisma = new PrismaClient();
  try {
    // Seed test user profile
    await prisma.userProfile.upsert({
      where: { github_login: E2E_LOGIN },
      create: {
        github_login: E2E_LOGIN,
        name: "E2E Test User",
        avatar_url: "https://avatars.githubusercontent.com/u/1",
      },
      update: {
        name: "E2E Test User",
        avatar_url: "https://avatars.githubusercontent.com/u/1",
      },
    });

    // Seed pinned repos for test user
    for (const repo of PINNED_REPOS) {
      await prisma.pinnedRepo.upsert({
        where: { github_login_full_name: { github_login: E2E_LOGIN, full_name: repo.full_name } },
        create: { github_login: E2E_LOGIN, full_name: repo.full_name, pinned_at: repo.pinned_at },
        update: { pinned_at: repo.pinned_at },
      });
    }
  } finally {
    await prisma.$disconnect();
  }

  if (!secret) return;

  // Mint a NextAuth v5 JWT for the test user
  const token = await encode({
    token: {
      login: E2E_LOGIN,
      name: "E2E Test User",
      avatarUrl: "https://avatars.githubusercontent.com/u/1",
      accessToken: "gho_e2e_test_token",
      sub: E2E_LOGIN,
    },
    secret,
    salt: COOKIE_NAME,
    maxAge: 60 * 60 * 24, // 24 hours
  });

  const storageState = {
    cookies: [
      {
        name: COOKIE_NAME,
        value: token,
        domain: "localhost",
        path: "/",
        expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        httpOnly: true,
        secure: false,
        sameSite: "Lax" as const,
      },
    ],
    origins: [],
  };

  await mkdir(path.dirname(AUTH_FILE), { recursive: true });
  await writeFile(AUTH_FILE, JSON.stringify(storageState, null, 2));
  console.log("[e2e global-setup] Auth storageState written to", AUTH_FILE);
}
