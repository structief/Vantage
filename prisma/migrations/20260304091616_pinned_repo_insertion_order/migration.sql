/*
  Warnings:

  - You are about to drop the column `last_browsed` on the `pinned_repos` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_pinned_repos" (
    "github_login" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "pinned_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("github_login", "full_name")
);
INSERT INTO "new_pinned_repos" ("full_name", "github_login") SELECT "full_name", "github_login" FROM "pinned_repos";
DROP TABLE "pinned_repos";
ALTER TABLE "new_pinned_repos" RENAME TO "pinned_repos";
CREATE INDEX "pinned_repos_github_login_pinned_at_idx" ON "pinned_repos"("github_login", "pinned_at" ASC);
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
