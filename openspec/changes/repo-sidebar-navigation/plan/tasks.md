<!-- Original implementation tasks (completed) -->

## 1. Data model

- [x] 1.1 Merge `PinnedRepo` model from `data-model/schema.prisma` into `prisma/schema.prisma`
- [x] 1.2 Run `npx prisma migrate dev --name add_pinned_repos` to generate and apply migration
- [x] 1.3 Verify `prisma/migrations/` contains the new `add_pinned_repos` migration SQL

## 2. Contracts

- [x] 2.1 Review `contracts/api/repo-sidebar-navigation.yaml` — confirm endpoint paths, field names, and error responses match spec scenarios

## 3. Gradient utility

- [x] 3.1 Create `lib/gradients.ts` — export `getRepoGradient(fullName: string): string` using djb2 hash over a fixed palette of 12 gradient CSS strings
- [x] 3.2 Ensure the palette array is append-only (add a comment to that effect in the file)

## 4. API routes

- [x] 4.1 Create `app/api/pinned-repos/route.ts` — implement `GET` (list, ordered by `last_browsed DESC`, max 10) and `POST` (pin with eviction logic)
- [x] 4.2 Create `app/api/pinned-repos/[encodedFullName]/route.ts` — implement `DELETE` (unpin, 404 if not found) and `PATCH` (record browse, update `last_browsed`)
- [x] 4.3 Auth-guard all four handlers — return 401 if no session

## 5. App shell layout

- [x] 5.1 Create route group `app/(shell)/` and move `app/page.tsx` inside it as `app/(shell)/page.tsx`
- [x] 5.2 Create `app/(shell)/layout.tsx` as a server component — fetch pinned repos from DB and pass to the client sidebar; render `<RepoSidebar>` + `{children}`
- [x] 5.3 Ensure `app/login/page.tsx` and `app/api/**` remain outside the `(shell)` group

## 6. Sidebar component

- [x] 6.1 Create `components/RepoSidebar.tsx` — client component accepting `initialPinnedRepos` prop
- [x] 6.2 Render each pinned repo as a square button: gradient background from `getRepoGradient`, first two letters of repo name (uppercase), active ring when `full_name` matches current route segments
- [x] 6.3 Add "+" button at the bottom of the sidebar that opens `<RepoPicker>`
- [x] 6.4 Implement right-click context menu on each repo square with "Remove from sidebar" option
- [x] 6.5 On removal: call `DELETE /api/pinned-repos/[encodedFullName]`; if the removed repo was active, call `router.push('/')`
- [x] 6.6 On navigation to a repo: call `PATCH /api/pinned-repos/[encodedFullName]` to update `last_browsed`; re-sort sidebar list client-side

## 7. Repo picker component

- [x] 7.1 Create `components/RepoPicker.tsx` — modal/popover overlay, fetches from `GET /api/repos` and filters out already-pinned repos
- [x] 7.2 Show "All your repositories have been added." empty state when filtered list is empty
- [x] 7.3 On repo selection: call `POST /api/pinned-repos`; close picker; update sidebar state
- [x] 7.4 Dismiss on Escape key and click-outside

## 8. Repo page

- [x] 8.1 Create `app/(shell)/repo/[owner]/[name]/page.tsx` — server component that renders `<h1>{owner}/{name}</h1>`
- [x] 8.2 Protect the route — redirect to `/login` if no session
- [x] 8.3 Add a neutral empty state to `app/(shell)/page.tsx` — "Select a repository from the sidebar or add one to get started."

## 9. Tests

- [x] 9.1 Translate unit flows (gradient determinism, first-two-letters display) → `tests/unit/repo-sidebar.test.ts`
- [x] 9.2 Translate contract flows (GET/POST /api/pinned-repos, DELETE/PATCH /api/pinned-repos/[encodedFullName]) → `tests/contract/pinned-repos.contract.test.ts`
- [x] 9.3 Translate e2e flows (sidebar renders, add/remove repo, navigation, active indicator, repo page placeholder, picker dismiss) → `tests/e2e/repo-sidebar.spec.ts`

<!-- Amendment: insertion-order sidebar -->

## 10. Data model — insertion order

- [x] 10.1 Replace `last_browsed` with `pinned_at` on `PinnedRepo` in `prisma/schema.prisma`
- [x] 10.2 Run `npx prisma migrate dev --name pinned_repo_insertion_order` to generate and apply migration

## 11. API routes — insertion order

- [x] 11.1 Update `GET /api/pinned-repos` — change `orderBy` from `last_browsed: "desc"` to `pinned_at: "asc"`; update response field from `last_browsed` to `pinned_at`
- [x] 11.2 Update `POST /api/pinned-repos` — eviction now removes oldest `pinned_at` (not `last_browsed`); response returns `pinned_at` instead of `last_browsed`
- [x] 11.3 Delete `app/api/pinned-repos/[encodedFullName]/route.ts` PATCH handler — browse recording is no longer needed; keep DELETE only

## 12. Sidebar component — remove browse tracking

- [x] 12.1 Remove `PATCH /api/pinned-repos/[encodedFullName]` call from `handleRepoClick` in `components/RepoSidebar.tsx`
- [x] 12.2 Remove client-side re-sort of repos after navigation — sidebar order is now stable
- [x] 12.3 Update `handleRepoAdded` to append new repos at the end (not top) of the list

## 13. Tests — update for insertion order

- [x] 13.1 Update `tests/contract/pinned-repos.contract.test.ts` — replace `last_browsed` with `pinned_at` in all assertions; remove PATCH endpoint tests; update GET to assert `pinned_at ASC` order
- [x] 13.2 Update `tests/e2e/repo-sidebar.spec.ts` — replace "repo moves to top" flow with "sidebar order is stable on navigation" flow
