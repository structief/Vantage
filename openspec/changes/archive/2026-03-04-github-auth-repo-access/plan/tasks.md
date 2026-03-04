# Tasks — github-auth-repo-access

Generated from: specs, design, contracts (api/github-auth-repo-access.yaml), data-model (schema.prisma), test flows

---

## 1. Dependencies

- [x] 1.1 Install runtime dependencies: `npm install next-auth@beta @octokit/rest @prisma/client`
- [x] 1.2 Install dev dependencies — Prisma CLI: `npm install -D prisma`
- [x] 1.3 Install test dependencies: `npm install -D vitest @vitest/coverage-v8 supertest @types/supertest @playwright/test`
- [x] 1.4 Initialise Playwright browsers: `npx playwright install --with-deps chromium`

---

## 2. Database — Prisma + SQLite

- [x] 2.1 Copy `data-model/schema.prisma` into project root `prisma/schema.prisma`; ensure `DATABASE_URL` defaults to `file:.vantage/vantage.db`
- [x] 2.2 Run `npx prisma migrate dev --name add_user_profile_and_repo_cache` to create `UserProfile` and `RepoCache` tables
- [x] 2.3 Create `lib/db.ts`: export a singleton `PrismaClient` instance (guard against hot-reload creating multiple connections in dev)

---

## 3. NextAuth config

- [x] 3.1 Create `auth.ts` at project root: configure GitHub provider with `repo` and `read:org` scopes, JWT session strategy, and `NEXTAUTH_SECRET`
- [x] 3.2 Add `signIn` callback to `auth.ts`: call `prisma.userProfile.upsert({ where: { github_login }, create/update: { name, avatar_url } })` using profile data from the GitHub OAuth response
- [x] 3.3 Add `jwt` callback to `auth.ts`: extend token with `{ login, name, avatarUrl, accessToken }` from the GitHub profile
- [x] 3.4 Create `app/api/auth/[...nextauth]/route.ts`: export `GET` and `POST` from the NextAuth handler
- [x] 3.5 Create `middleware.ts` at project root: protect all routes except `/api/auth/**` and `/login`; preserve return URL on redirect; guard against open-redirect by validating return URL is same-origin

---

## 4. Login screen

- [x] 4.1 Create `app/login/page.tsx`: render "Sign in with GitHub" button that calls `signIn("github")`
- [x] 4.2 Render `error` query param: map `OAuthCallback`, `OAuthSignin`, `AccessDenied` → human-readable messages per spec ("Authorization was cancelled…", descriptive OAuth error)
- [x] 4.3 Render session-expiry message when redirected with `?reason=session_expired` query param

---

## 5. User profile — API and nav header

- [x] 5.1 Create `app/api/me/route.ts`: authenticate via NextAuth session; query `prisma.userProfile.findUnique({ where: { github_login: session.user.login } })`; return `UserProfile` shape per contract; return 401 if unauthenticated, 404 with `PROFILE_NOT_FOUND` if row missing
- [x] 5.2 Create `components/NavHeader.tsx`: fetch `/api/me` on mount (SWR or `use`); display `name` (not login handle) and `<img src={avatar_url} />` in the navigation header on all protected pages

---

## 6. Repository API routes

- [x] 6.1 Create `lib/github.ts`: export `fetchAllRepos(accessToken)` using `@octokit/rest` with `octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, { affiliation: "owner,collaborator,organization_member", per_page: 100 })`; map result to `CachedRepository` shape; cap at 1000
- [x] 6.2 Create `app/api/repos/route.ts` (GET): authenticate; check `prisma.repoCache.findUnique`; if cache is missing or `fetched_at` > 5 min old, call `fetchAllRepos` and upsert `RepoCache`; return `RepoListResponse` per contract
- [x] 6.3 Create `app/api/repos/refresh/route.ts` (POST): authenticate; always call `fetchAllRepos`; upsert `RepoCache`; handle GitHub 403/429 per spec (message: "GitHub rate limit reached. Please try again in a few minutes.")

---

## 7. Environment config and test setup

- [x] 7.1 Create `.env.example` with `GITHUB_ID`, `GITHUB_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DATABASE_URL=file:.vantage/vantage.db`
- [x] 7.2 Add `.vantage/` to `.gitignore` (excludes `vantage.db` from version control)
- [x] 7.3 Create `vitest.config.ts`: set `environment: "node"`, include `tests/unit/**` and `tests/contract/**`, exclude `tests/e2e/**`
- [x] 7.4 Create `playwright.config.ts`: set `baseURL` from `NEXTAUTH_URL` (default `http://localhost:3000`), `testDir: "tests/e2e"`, webServer block that runs `next start`; use `chromium` only for CI

---

## 8. Tests — translate flows to project test code

All source flows: `openspec/changes/github-auth-repo-access/tests/feature-github-auth-repo-access.flow.md`
Output: project `tests/` directory (not inside openspec/)

- [x] 8.1 Translate e2e flows → `tests/e2e/github-auth.e2e.test.ts`
  Flows: "Successful login", "User denies GitHub access", "Accessing a protected route while unauthenticated", "Successful logout", "Session expired before explicit logout", "Page reload while authenticated", "Display name and avatar visible after login"

- [x] 8.2 Translate unit flows → `tests/unit/github-auth.unit.test.ts`
  Flows: "Session token absent on startup", "Display name persisted across server restart", "Repository with insufficient permissions", "User has no accessible repositories"

- [x] 8.3 Translate contract flows → `tests/contract/github-auth.contract.test.ts`
  Flows: "Repositories loaded after login", "User manually refreshes the repository list", "GitHub API rate limit exceeded during listing"
  Each test asserts that request/response shapes match `contracts/api/github-auth-repo-access.yaml`
