DONE

## Session summary

- All 25 tasks from `openspec/changes/github-auth-repo-access/plan/tasks.md` implemented
- 12/12 unit + contract tests passing
- Fixed: `GET /api/repos` 503 path was returning `RATE_LIMITED` instead of `GITHUB_UNAVAILABLE` (contract mismatch)
- Added: `app/page.tsx` (protected home page) + `components/RepoList.tsx` (repo list with refresh)
- Added: `prisma.config.ts` (Prisma v6/v7 CLI compatibility)
