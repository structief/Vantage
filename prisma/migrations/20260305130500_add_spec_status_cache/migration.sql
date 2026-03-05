-- CreateTable
CREATE TABLE "spec_status_cache" (
    "repoFullName" TEXT NOT NULL,
    "specPath" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "fetchedAt" DATETIME NOT NULL,

    CONSTRAINT "spec_status_cache_pkey" PRIMARY KEY ("repoFullName", "specPath")
);
