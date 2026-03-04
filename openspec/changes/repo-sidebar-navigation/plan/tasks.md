## 1. Data model

- [ ] 1.1 Merge `PinnedRepo` model from `data-model/schema.prisma` into `prisma/schema.prisma`
- [ ] 1.2 Run `npx prisma migrate dev --name add_pinned_repos` to generate and apply migration
- [ ] 1.3 Verify `prisma/migrations/` contains the new `add_pinned_repos` migration SQL

## 2. Contracts

- [ ] 2.1 Review `contracts/api/repo-sidebar-navigation.yaml` — confirm endpoint paths, field names, and error responses match spec scenarios

## 3. Gradient utility

- [ ] 3.1 Create `lib/gradients.ts` — export `getRepoGradient(fullName: string): string` using djb2 hash over a fixed palette of 12 gradient CSS strings
- [ ] 3.2 Ensure the palette array is append-only (add a comment to that effect in the file)

## 4. API routes

- [ ] 4.1 Create `app/api/pinned-repos/route.ts` — implement `GET` (list, ordered by `last_browsed DESC`, max 10) and `POST` (pin with eviction logic)
- [ ] 4.2 Create `app/api/pinned-repos/[encodedFullName]/route.ts` — implement `DELETE` (unpin, 404 if not found) and `PATCH` (record browse, update `last_browsed`)
- [ ] 4.3 Auth-guard all four handlers — return 401 if no session

## 5. App shell layout

- [ ] 5.1 Create route group `app/(shell)/` and move `app/page.tsx` inside it as `app/(shell)/page.tsx`
- [ ] 5.2 Create `app/(shell)/layout.tsx` as a server component — fetch pinned repos from DB and pass to the client sidebar; render `<RepoSidebar>` + `{children}`
- [ ] 5.3 Ensure `app/login/page.tsx` and `app/api/**` remain outside the `(shell)` group

## 6. Sidebar component

- [ ] 6.1 Create `components/RepoSidebar.tsx` — client component accepting `initialPinnedRepos` prop
- [ ] 6.2 Render each pinned repo as a square button: gradient background from `getRepoGradient`, first two letters of repo name (uppercase), active ring when `full_name` matches current route segments
- [ ] 6.3 Add "+" button at the bottom of the sidebar that opens `<RepoPicker>`
- [ ] 6.4 Implement right-click context menu on each repo square with "Remove from sidebar" option
- [ ] 6.5 On removal: call `DELETE /api/pinned-repos/[encodedFullName]`; if the removed repo was active, call `router.push('/')`
- [ ] 6.6 On navigation to a repo: call `PATCH /api/pinned-repos/[encodedFullName]` to update `last_browsed`; re-sort sidebar list client-side

## 7. Repo picker component

- [ ] 7.1 Create `components/RepoPicker.tsx` — modal/popover overlay, fetches from `GET /api/repos` and filters out already-pinned repos
- [ ] 7.2 Show "All your repositories have been added." empty state when filtered list is empty
- [ ] 7.3 On repo selection: call `POST /api/pinned-repos`; close picker; update sidebar state
- [ ] 7.4 Dismiss on Escape key and click-outside

## 8. Repo page

- [ ] 8.1 Create `app/(shell)/repo/[owner]/[name]/page.tsx` — server component that renders `<h1>{owner}/{name}</h1>`
- [ ] 8.2 Protect the route — redirect to `/login` if no session
- [ ] 8.3 Add a neutral empty state to `app/(shell)/page.tsx` — "Select a repository from the sidebar or add one to get started."

## 9. Tests

- [ ] 9.1 Translate unit flows (gradient determinism, first-two-letters display) → `tests/unit/repo-sidebar.test.ts`
- [ ] 9.2 Translate contract flows (GET/POST /api/pinned-repos, DELETE/PATCH /api/pinned-repos/[encodedFullName]) → `tests/contract/pinned-repos.contract.test.ts`
- [ ] 9.3 Translate e2e flows (sidebar renders, add/remove repo, navigation, active indicator, repo page placeholder, picker dismiss) → `tests/e2e/repo-sidebar.spec.ts`
