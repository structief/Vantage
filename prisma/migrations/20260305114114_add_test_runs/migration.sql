-- CreateTable
CREATE TABLE "test_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repoFullName" TEXT NOT NULL,
    "changePath" TEXT NOT NULL,
    "specSlug" TEXT NOT NULL,
    "version" TEXT,
    "environment" TEXT,
    "runAt" DATETIME NOT NULL,
    "passedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT,
    "detailsUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "test_runs_repoFullName_changePath_specSlug_idx" ON "test_runs"("repoFullName", "changePath", "specSlug");
