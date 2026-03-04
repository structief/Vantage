# Test flows: repo-sidebar-navigation

<!-- Generated from specs/feature-repo-sidebar-navigation.md. Each flow maps to a spec scenario.
     Translated to actual test code during opsx-apply. -->

---

## Flow: Sidebar renders pinned repos
Type: e2e
Spec: specs/feature-repo-sidebar-navigation.md > Requirement: Repo Sidebar

Setup:
- Authenticated user session exists (github_login = "testuser")
- Two PinnedRepo rows exist: `testuser/alpha` (pinned_at: 10 min ago) and `testuser/beta` (pinned_at: 5 min ago)

Steps:
1. Navigate to any shell page (e.g. `/`)
2. Observe the sidebar

Expected:
- Sidebar renders two square buttons, `testuser/alpha` first (oldest), `testuser/beta` second (newest)
- Each button shows the first two uppercase letters of the repo name (AL, BE)
- Each button has a gradient background

Edge cases:
- User has 0 pinned repos → only the "+" button is visible

---

## Flow: No pinned repos
Type: e2e
Spec: specs/feature-repo-sidebar-navigation.md > Requirement: Repo Sidebar

Setup:
- Authenticated user session exists
- No PinnedRepo rows for this user

Steps:
1. Navigate to any shell page
2. Observe the sidebar

Expected:
- Sidebar contains only the "Add repo" ("+") button
- No repo squares are rendered

---

## Flow: Gradient is deterministic
Type: unit
Spec: specs/feature-repo-sidebar-navigation.md > Requirement: Repo Sidebar

Setup:
- Import `getRepoGradient(fullName: string): string` from `lib/gradients.ts`

Steps:
1. Call `getRepoGradient("acme/api")` → record result A
2. Call `getRepoGradient("acme/api")` again → record result B
3. Call `getRepoGradient("other/repo")` → record result C

Expected:
- A === B (same input always returns same gradient)
- A may or may not equal C (different inputs may differ — not required to differ, but must not change between calls)

Edge cases:
- Empty string input → returns a valid gradient string from the palette (no crash)
- Single-character full_name → returns a valid gradient string

---

## Flow: First two letters displayed
Type: unit
Spec: specs/feature-repo-sidebar-navigation.md > Requirement: Repo Sidebar

Setup:
- Import `getRepoInitials(repoName: string): string` from `lib/gradients.ts`

Steps:
1. Call `getRepoInitials("my-service")`
2. Observe result

Expected:
- Returns "MY" (first two letters of "my-service", uppercased)

Edge cases:
- Repo name is one character ("x") → returns "X" (single letter, no crash)

---

## Flow: Sidebar order is stable on navigation
Type: e2e
Spec: specs/feature-repo-sidebar-navigation.md > Requirement: Sidebar Cap — Insertion Order

Setup:
- Authenticated user session
- Two pinned repos: `testuser/alpha` (pinned_at older), `testuser/beta` (pinned_at newer)
- Sidebar shows: alpha (top), beta (bottom)

Steps:
1. Click `testuser/beta` in the sidebar to navigate to it
2. Observe sidebar order after navigation

Expected:
- Sidebar order remains: alpha (top), beta (bottom)
- No re-ordering occurs

---

## Flow: Automatic eviction at cap
Type: contract
Spec: specs/feature-repo-sidebar-navigation.md > Requirement: Sidebar Cap — Insertion Order
See: contracts/api/repo-sidebar-navigation.yaml (POST /api/pinned-repos)

Setup:
- Authenticated user session (github_login = "testuser")
- 10 PinnedRepo rows exist for "testuser"; the oldest-added is `testuser/old-repo`
- `testuser/new-repo` exists in RepoCache but is not pinned

Steps:
1. POST `/api/pinned-repos` with body `{ "full_name": "testuser/new-repo" }`
2. Query all PinnedRepo rows for "testuser"

Expected:
- Response: 201 `{ full_name: "testuser/new-repo", pinned_at: <now> }`
- `testuser/old-repo` row is deleted (oldest pinned_at)
- Total row count remains 10
- `testuser/new-repo` has the most recent `pinned_at`

---

## Flow: Picker blocked at cap (+ button still visible)
Type: e2e
Spec: specs/feature-repo-sidebar-navigation.md > Requirement: Sidebar Cap — Insertion Order

Setup:
- Authenticated user session
- 10 PinnedRepo rows exist

Steps:
1. Navigate to any shell page
2. Observe the sidebar

Expected:
- The "+" button is visible and clickable

---

## Flow: Opening the picker
Type: e2e
Spec: specs/feature-repo-sidebar-navigation.md > Requirement: Add Repo to Sidebar

Setup:
- Authenticated user session
- At least one repo in RepoCache that is not yet pinned

Steps:
1. Click the "+" button in the sidebar
2. Observe the picker overlay

Expected:
- Picker overlay appears
- Picker lists repos from `/api/repos` that are NOT already in the user's pinned list

Edge cases:
- All repos already pinned → picker shows "All your repositories have been added."

---

## Flow: Adding a repo
Type: e2e
Spec: specs/feature-repo-sidebar-navigation.md > Requirement: Add Repo to Sidebar

Setup:
- Authenticated user session
- Picker is open, `acme/new-repo` is listed

Steps:
1. Click `acme/new-repo` in the picker
2. Observe picker and sidebar

Expected:
- POST `/api/pinned-repos` called with `{ full_name: "acme/new-repo" }`
- Picker closes
- `acme/new-repo` square appears at the bottom of the sidebar

---

## Flow: All repos already pinned
Type: e2e
Spec: specs/feature-repo-sidebar-navigation.md > Requirement: Add Repo to Sidebar

Setup:
- Authenticated user session
- All repos from RepoCache are already in the pinned list

Steps:
1. Click the "+" button

Expected:
- Picker opens and displays: "All your repositories have been added."
- No repo items are listed

---

## Flow: Picker dismissed without selection
Type: e2e
Spec: specs/feature-repo-sidebar-navigation.md > Requirement: Add Repo to Sidebar

Setup:
- Authenticated user session
- Picker is open with at least one repo listed

Steps:
1. Press Escape key
2. Observe sidebar

Expected:
- Picker closes
- No POST to `/api/pinned-repos` is made
- Sidebar state is unchanged

Edge cases:
- Click outside the picker overlay → same outcome (picker closes, no change)

---

## Flow: Removing a repo
Type: e2e
Spec: specs/feature-repo-sidebar-navigation.md > Requirement: Remove Repo from Sidebar

Setup:
- Authenticated user session
- `acme/api` is pinned and visible in the sidebar

Steps:
1. Right-click the `acme/api` square in the sidebar
2. Observe context menu

Expected:
- Context menu appears with a "Remove from sidebar" option

---

## Flow: Confirming removal (non-active repo)
Type: e2e
Spec: specs/feature-repo-sidebar-navigation.md > Requirement: Remove Repo from Sidebar

Setup:
- Authenticated user session
- `acme/api` is pinned; current page is `/repo/acme/other-repo` (acme/api is NOT active)

Steps:
1. Right-click `acme/api` square → context menu appears
2. Click "Remove from sidebar"

Expected:
- DELETE `/api/pinned-repos/acme%2Fapi` is called
- `acme/api` square disappears from the sidebar
- URL remains `/repo/acme/other-repo` (no redirect, non-active repo removed)

---

## Flow: Confirming removal (active repo)
Type: e2e
Spec: specs/feature-repo-sidebar-navigation.md > Requirement: Remove Repo from Sidebar

Setup:
- Authenticated user session
- Current page is `/repo/acme/api` (`acme/api` IS the active repo)

Steps:
1. Right-click `acme/api` square → context menu appears
2. Click "Remove from sidebar"

Expected:
- DELETE `/api/pinned-repos/acme%2Fapi` is called
- `acme/api` square disappears from the sidebar
- App redirects to `/`

---

## Flow: Switching to a repo
Type: e2e
Spec: specs/feature-repo-sidebar-navigation.md > Requirement: Repo Context Switching

Setup:
- Authenticated user session
- `acme/api` is pinned; current page is `/`

Steps:
1. Click the `acme/api` square in the sidebar

Expected:
- App navigates to `/repo/acme/api`
- Main content area displays `<h1>acme/api</h1>` (or equivalent)
- Sidebar order is unchanged

---

## Flow: Active repo indicator
Type: e2e
Spec: specs/feature-repo-sidebar-navigation.md > Requirement: Repo Context Switching

Setup:
- Authenticated user session
- `acme/api` is pinned; current URL is `/repo/acme/api`

Steps:
1. Observe the sidebar

Expected:
- The `acme/api` square has a visual active indicator (ring or highlighted border)
- Other repo squares do not have this indicator

---

## Flow: Repo page placeholder
Type: e2e
Spec: specs/feature-repo-sidebar-navigation.md > Requirement: Repo Context Switching

Setup:
- Authenticated user session
- `acme/api` is pinned

Steps:
1. Navigate to `/repo/acme/api`

Expected:
- Page renders an `<h1>` with text "acme/api"
- No other content is required

Edge cases:
- Route `/repo/acme/api` accessed directly (deep link) → same outcome

---

## Flow: List pinned repos — API contract
Type: contract
Spec: specs/feature-repo-sidebar-navigation.md > Requirement: Repo Sidebar
See: contracts/api/repo-sidebar-navigation.yaml (GET /api/pinned-repos)

Setup:
- Authenticated session; 3 PinnedRepo rows in DB ordered by pinned_at ASC

Steps:
1. GET `/api/pinned-repos`

Expected:
- 200 response
- Body matches `PinnedRepoListResponse` schema: `{ pinned_repos: [{ full_name, pinned_at }, ...] }`
- Array is sorted by `pinned_at` ascending (oldest first)

Edge cases:
- Unauthenticated → 401 `{ message: "..." }`

---

## Flow: Pin repo — API contract
Type: contract
Spec: specs/feature-repo-sidebar-navigation.md > Requirement: Add Repo to Sidebar
See: contracts/api/repo-sidebar-navigation.yaml (POST /api/pinned-repos)

Setup:
- Authenticated session; `acme/new-repo` exists in RepoCache, is not yet pinned

Steps:
1. POST `/api/pinned-repos` with `{ "full_name": "acme/new-repo" }`

Expected:
- 201 response
- Body matches `PinnedRepo` schema: `{ full_name: "acme/new-repo", pinned_at: <ISO timestamp> }`

Edge cases:
- `full_name` not in RepoCache → 400 `{ message: "Repository not found in your repository list." }`
- `full_name` already pinned → 400 `{ message: "Repository is already in your sidebar." }`
- Unauthenticated → 401

---

## Flow: Unpin repo — API contract
Type: contract
Spec: specs/feature-repo-sidebar-navigation.md > Requirement: Remove Repo from Sidebar
See: contracts/api/repo-sidebar-navigation.yaml (DELETE /api/pinned-repos/{encodedFullName})

Setup:
- Authenticated session; `acme/api` is pinned

Steps:
1. DELETE `/api/pinned-repos/acme%2Fapi`

Expected:
- 204 response (no body)
- Row deleted from `pinned_repos` table

Edge cases:
- Repo not pinned → 404 `{ message: "Repository not found in your sidebar." }`
- Unauthenticated → 401
