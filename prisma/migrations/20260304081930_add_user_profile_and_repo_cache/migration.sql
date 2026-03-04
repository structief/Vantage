-- CreateTable
CREATE TABLE "user_profiles" (
    "github_login" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "avatar_url" TEXT NOT NULL,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "repo_cache" (
    "github_login" TEXT NOT NULL PRIMARY KEY,
    "fetched_at" DATETIME NOT NULL,
    "repositories" TEXT NOT NULL
);
