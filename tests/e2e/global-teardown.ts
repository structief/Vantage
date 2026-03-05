/**
 * Playwright global teardown — runs once after all e2e tests.
 * Removes the test user and their pinned repos from the database.
 */

import { PrismaClient } from "@prisma/client";

const E2E_LOGIN = "e2etest";

export default async function globalTeardown() {
  const prisma = new PrismaClient();
  try {
    await prisma.pinnedRepo.deleteMany({ where: { github_login: E2E_LOGIN } });
    await prisma.userProfile.deleteMany({ where: { github_login: E2E_LOGIN } });
  } finally {
    await prisma.$disconnect();
  }
  console.log("[e2e global-teardown] Test user data cleaned up");
}
