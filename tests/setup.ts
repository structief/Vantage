import { beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db";

beforeAll(async () => {
  // Ensure Prisma connects before tests run
});

afterAll(async () => {
  await prisma.$disconnect();
});
