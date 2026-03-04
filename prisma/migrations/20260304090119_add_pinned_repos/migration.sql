-- CreateTable
CREATE TABLE "pinned_repos" (
    "github_login" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "last_browsed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("github_login", "full_name")
);

-- CreateIndex
CREATE INDEX "pinned_repos_github_login_last_browsed_idx" ON "pinned_repos"("github_login", "last_browsed" DESC);
