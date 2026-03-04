# Test flows: Repo Specs Listing

<!-- Generated from specs/feature-repo-specs-listing.md. Each flow maps to a spec scenario.
     Translated to actual test code during opsx-apply. -->

## Flow: Navigating to the All Specs page
Type: e2e
Spec: specs/feature-repo-specs-listing.md > Requirement: All Specs Page — Render Spec List

Setup:
- User is authenticated via GitHub OAuth
- Connected repo contains openspec/changes/ with at least one change directory that has a specs/*.md file

Steps:
1. Navigate to /repo/[owner]/[name]/specs
2. Wait for spec list to finish loading

Expected:
- Page renders the spec listing without errors
- At least one spec item is visible with a document icon and slug label

Edge cases:
- N/A (covered by empty-repo flow below)

---

## Flow: Empty repo — no openspec directory
Type: e2e
Spec: specs/feature-repo-specs-listing.md > Requirement: All Specs Page — Render Spec List

Setup:
- User is authenticated
- Connected repo contains no openspec/changes/ directory

Steps:
1. Navigate to /repo/[owner]/[name]/specs
2. Wait for content to load

Expected:
- Page renders the message "No specs found in this repository."
- No spec items or group headings are rendered

Edge cases:
- N/A

---

## Flow: Loading state
Type: e2e
Spec: specs/feature-repo-specs-listing.md > Requirement: All Specs Page — Render Spec List

Setup:
- User is authenticated
- Network request to /api/repos/.../specs is delayed (simulated slow network or intercept)

Steps:
1. Navigate to /repo/[owner]/[name]/specs
2. Observe the page before the API response resolves

Expected:
- Skeleton loading placeholders (animated) are visible in place of the spec list
- No spec items are rendered yet

Edge cases:
- N/A

---

## Flow: GET /specs — returns grouped spec listing
Type: contract
Spec: specs/feature-repo-specs-listing.md > Requirement: All Specs Page — Render Spec List

Setup:
- Authenticated session with valid GitHub access token
- Connected repo has:
  - openspec/changes/secondary-sidebar-nav/specs/feature-secondary-sidebar-nav.md (active, ungrouped)
  - openspec/changes/archive/2026-03-04-repo-sidebar-nav/specs/feature-repo-sidebar-nav.md (archived)

Steps:
1. Send GET /api/repos/owner%2Fname/specs with session cookie

Expected:
- Response status: 200
- Response body matches SpecsListResponse schema (see contracts/api/repo-specs-listing.yaml)
- Entry for secondary-sidebar-nav spec: { slug: "feature-secondary-sidebar-nav", group: null, status: "active", path: "openspec/changes/secondary-sidebar-nav/specs/feature-secondary-sidebar-nav.md" }
- Entry for archive spec: { group: "archive", status: "archived" }
- Ungrouped active entries appear before archived entries

Edge cases:
- No openspec/changes/ directory → 200 with { "specs": [] }
- Unauthenticated request → 401 with { "error": "Not authenticated" }
- encodedFullName without "/" after decode → 400 with { "error": "Invalid repository name" }

---

## Flow: Specs with a folder prefix
Type: e2e
Spec: specs/feature-repo-specs-listing.md > Requirement: Project Group Headings

Setup:
- Connected repo has openspec/changes/auth/login-flow/specs/feature-login.md

Steps:
1. Navigate to /repo/[owner]/[name]/specs
2. Wait for spec list to load

Expected:
- A project group heading "auth" (or "Auth") is rendered
- The spec item "feature-login" appears indented beneath the "auth" group heading

Edge cases:
- N/A

---

## Flow: Specs without a folder prefix
Type: e2e
Spec: specs/feature-repo-specs-listing.md > Requirement: Project Group Headings

Setup:
- Connected repo has openspec/changes/secondary-sidebar-nav/specs/feature-secondary-sidebar-nav.md (top-level change)

Steps:
1. Navigate to /repo/[owner]/[name]/specs
2. Wait for spec list to load

Expected:
- The spec item "feature-secondary-sidebar-nav" is rendered without a preceding project group heading

Edge cases:
- N/A

---

## Flow: Archived specs in the archive subdirectory
Type: e2e
Spec: specs/feature-repo-specs-listing.md > Requirement: Project Group Headings

Setup:
- Connected repo has openspec/changes/archive/2026-03-04-old-feature/specs/feature-old.md

Steps:
1. Navigate to /repo/[owner]/[name]/specs
2. Wait for spec list to load

Expected:
- An "Archived" project group heading is rendered
- The spec item "feature-old" appears under the "Archived" group
- The archived group is visually subdued compared to active specs (e.g. lower opacity or muted text colour)

Edge cases:
- N/A

---

## Flow: Spec item appearance
Type: e2e
Spec: specs/feature-repo-specs-listing.md > Requirement: Spec List Item — Doc Icon

Setup:
- Connected repo has at least one spec file

Steps:
1. Navigate to /repo/[owner]/[name]/specs
2. Wait for spec list to load
3. Inspect each spec item in the list

Expected:
- Each spec item displays a document icon to the left of its label
- The label is the spec filename without the .md extension (slug)
- No additional metadata is shown in the list row

Edge cases:
- N/A

---

## Flow: Selecting a spec
Type: e2e
Spec: specs/feature-repo-specs-listing.md > Requirement: Spec Selection — Slug and Title Display

Setup:
- Connected repo has a spec file with content starting with "# My Spec Title\n..."
- The spec's slug is "feature-my-spec"

Steps:
1. Navigate to /repo/[owner]/[name]/specs
2. Wait for spec list to load
3. Click the spec item "feature-my-spec"

Expected:
- Browser navigates to /repo/[owner]/[name]/specs/feature-my-spec
- Page displays the slug "feature-my-spec" prominently
- Page displays the title "My Spec Title" prominently
- The "feature-my-spec" item in the list has an active/highlighted style (filled background pill)

Edge cases:
- N/A

---

## Flow: Spec file has no title heading
Type: e2e
Spec: specs/feature-repo-specs-listing.md > Requirement: Spec Selection — Slug and Title Display

Setup:
- Connected repo has a spec file whose content does not start with a # heading
- The spec's slug is "feature-no-title"

Steps:
1. Navigate to /repo/[owner]/[name]/specs/feature-no-title directly

Expected:
- Page displays the slug "feature-no-title" as both the slug label and the title
- No error state is shown

Edge cases:
- N/A

---

## Flow: Selected spec is visually highlighted in the list
Type: e2e
Spec: specs/feature-repo-specs-listing.md > Requirement: Spec Selection — Slug and Title Display

Setup:
- User has navigated to /repo/[owner]/[name]/specs/feature-secondary-sidebar-nav

Steps:
1. Observe the spec list rendered alongside the detail view

Expected:
- The "feature-secondary-sidebar-nav" item in the list has an active/highlighted style
- No other spec item is highlighted

Edge cases:
- Navigating to /repo/[owner]/[name]/specs (no spec selected) → no item is highlighted

---

## Flow: GET /spec-content — returns file content
Type: contract
Spec: specs/feature-repo-specs-listing.md > Requirement: Spec Selection — Slug and Title Display

Setup:
- Authenticated session
- Connected repo has openspec/changes/secondary-sidebar-nav/specs/feature-secondary-sidebar-nav.md with content starting "# Secondary Sidebar Nav\n..."

Steps:
1. Send GET /api/repos/owner%2Fname/spec-content?path=openspec%2Fchanges%2Fsecondary-sidebar-nav%2Fspecs%2Ffeature-secondary-sidebar-nav.md with session cookie

Expected:
- Response status: 200
- Response body matches SpecContentResponse schema (see contracts/api/repo-specs-listing.yaml)
- content field contains the raw text of the file

Edge cases:
- path points to a non-existent file → 404 with { "error": "File not found" }
- path query param is missing → 400 with { "error": "Missing path parameter" }
- Unauthenticated request → 401 with { "error": "Not authenticated" }
