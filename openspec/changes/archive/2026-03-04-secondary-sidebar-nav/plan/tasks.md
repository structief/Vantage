## 1. Contracts

- [x] 1.1 Create `contracts/api/secondary-sidebar-nav.yaml` — `GET /api/repos/{encodedFullName}/projects`
- [x] 1.2 Create `contracts/data/github-contents.json` — consumed fields from GitHub Contents API

## 2. API route

- [x] 2.1 Create `app/api/repos/[encodedFullName]/projects/route.ts` — GET handler that reads `openspec/changes/` from GitHub API via Octokit, lists top-level `dir` entries, fetches `specs/` subdirectory for each to count `.md` files, converts slugs to title-cased names, returns `ProjectsResponse`
- [x] 2.2 Return `{ projects: [] }` (not an error) when GitHub returns 404 for the `openspec/changes/` path
- [x] 2.3 Return 401 if session is missing; return 400 if `encodedFullName` decodes to a string without a `/`

## 3. Utility

- [x] 3.1 Add `slugToTitle(slug: string): string` utility in `lib/utils.ts` (replace `-` and `_` with spaces, title-case each word)
- [x] 3.2 Add `getProjectInitials(slug: string): string` in `lib/utils.ts` — returns first two chars of the first two words (e.g. "repo-sidebar-navigation" → "RS")

## 4. SecondarySidebar component

- [x] 4.1 Create `components/SecondarySidebar.tsx` as a client component
- [x] 4.2 Implement `useSecondarySidebarMode` hook inside the component: reads/writes `vantage:secondary-sidebar:mode` (`"expanded" | "collapsed"`) in `localStorage`; default is `"expanded"`; SSR-safe (initialise from `localStorage` in `useEffect`)
- [x] 4.3 In expanded mode render the panel at `w-[220px]`; in collapsed mode at `w-[52px]`; apply `transition-all duration-200` for smooth width change
- [x] 4.4 Render repo identity area at the top: in expanded mode show the gradient icon + repo name; in collapsed mode show only the gradient icon (reuse `getRepoGradient` and `getRepoInitials` from `lib/gradients.ts`)
- [x] 4.5 Render three nav links (All Specs, Activity, Settings) with their icons; in expanded mode show icon + label; in collapsed mode show icon only with `title` tooltip
- [x] 4.6 Derive active nav link from `usePathname()` — a link is active when the pathname starts with its route prefix (`/repo/[owner]/[name]/specs`, `/activity`, `/settings`); apply filled-pill highlight to the active link
- [x] 4.7 Render the PROJECTS section header ("PROJECTS", uppercase, subdued) visible only in expanded mode
- [x] 4.8 Fetch `/api/repos/${encodedFullName}/projects` via `fetch` inside a `useEffect` when `activeFullName` changes; show skeleton placeholder rows while loading
- [x] 4.9 In expanded mode: render each project as a collapsable row — chevron icon, title-cased name, spec count badge; manage open/closed state per group in `useState` (keyed by slug); chevron rotates with CSS `transition`
- [x] 4.10 In expanded mode: render spec list under each expanded group — each item has a document icon and the spec slug formatted as a title; clicking navigates to `/repo/[owner]/[name]/specs/[spec-slug]`
- [x] 4.11 In collapsed mode: render each project as a small square (32×32px, rounded-md) with its two-letter initials and a `title` tooltip showing the full name; use a muted solid background (no gradient needed)
- [x] 4.12 Render "No projects yet." subdued text when `projects` array is empty and sidebar is expanded

## 5. Toggle button in RepoSidebar

- [x] 5.1 Add a toggle button at the very top of the `aside` in `RepoSidebar.tsx`
- [x] 5.2 The toggle button calls a shared `onToggleMode` callback (lifted state) or directly writes to `localStorage` and fires a custom `storage` event so `SecondarySidebar` can react — use a custom event approach to avoid prop-drilling through the server-rendered layout
- [x] 5.3 Toggle button icon: a panel/sidebar icon (two vertical bars) that visually flips between left-emphasis (expanded) and right-emphasis (collapsed); use an SVG inline icon

## 6. Shell layout wiring

- [x] 6.1 In `app/(shell)/layout.tsx` render `<SecondarySidebar>` immediately after `<RepoSidebar>` in the flex row; pass `activeFullName` derived from the URL or leave it client-side (preferred — use `usePathname` inside the component itself)
- [x] 6.2 Conditionally render `<SecondarySidebar>` only when on a `/repo/` route — handle this client-side within `SecondarySidebar` by returning `null` when `activeFullName` is `null`

## 7. Stub route pages

- [x] 7.1 Create `app/(shell)/repo/[owner]/[name]/specs/page.tsx` — placeholder page rendering `<h1>All Specs</h1>` with the repo name
- [x] 7.2 Create `app/(shell)/repo/[owner]/[name]/activity/page.tsx` — placeholder page rendering `<h1>Activity</h1>`
- [x] 7.3 Create `app/(shell)/repo/[owner]/[name]/settings/page.tsx` — placeholder page rendering `<h1>Settings</h1>`

## 8. Tests

- [x] 8.1 Translate contract flows from `tests/feature-secondary-sidebar-nav.flow.md` → `tests/contract/secondary-sidebar-nav.contract.test.ts`: mock Octokit, assert 200 with `ProjectsResponse` schema for normal case; assert 200 `{ projects: [] }` when GitHub 404s; assert 401 for unauthenticated; assert 400 for bad `encodedFullName`
- [x] 8.2 Translate unit flows → `tests/unit/secondary-sidebar-nav.test.ts`: unit-test `slugToTitle` and `getProjectInitials` for representative slugs
- [x] 8.3 Translate e2e flows → `tests/e2e/secondary-sidebar-nav.spec.ts`: toggle mode persistence, nav link active state, project group expand/collapse, "No projects yet." empty state, absence of sidebar on home route
