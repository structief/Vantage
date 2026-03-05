# Test flows: Repo Specs Listing

<!-- Generated from specs/feature-repo-specs-listing.md. Each flow maps to a spec scenario.
     Translated to actual test code during opsx-apply. -->

## Flow: GET /specs — returns grouped spec listing
Type: contract
Spec: specs/feature-repo-specs-listing.md > Requirement: Specs Listing API

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

## Flow: GET /specs — no openspec directory
Type: contract
Spec: specs/feature-repo-specs-listing.md > Requirement: Specs Listing API

Setup:
- Authenticated session
- Connected repo has no openspec/changes/ directory

Steps:
1. Send GET /api/repos/owner%2Fname/specs with session cookie

Expected:
- Response status: 200
- Response body: { "specs": [] }

Edge cases:
- N/A

---

## Flow: GET /specs — unauthenticated
Type: contract
Spec: specs/feature-repo-specs-listing.md > Requirement: Specs Listing API

Setup:
- No authenticated session

Steps:
1. Send GET /api/repos/owner%2Fname/specs without a valid session cookie

Expected:
- Response status: 401
- Response body: { "error": "Not authenticated" }

Edge cases:
- N/A

---

## Flow: GET /specs — invalid encoded repo name
Type: contract
Spec: specs/feature-repo-specs-listing.md > Requirement: Specs Listing API

Setup:
- Authenticated session

Steps:
1. Send GET /api/repos/justareponame/specs (no slash after decode)

Expected:
- Response status: 400
- Response body: { "error": "Invalid repository name" }

Edge cases:
- N/A

---

## Flow: GET /spec-content — returns file content
Type: contract
Spec: specs/feature-repo-specs-listing.md > Requirement: Spec Content API

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

---

## Flow: GET /spec-content — file not found
Type: contract
Spec: specs/feature-repo-specs-listing.md > Requirement: Spec Content API

Setup:
- Authenticated session
- path param points to a non-existent file

Steps:
1. Send GET /api/repos/owner%2Fname/spec-content?path=openspec%2Fchanges%2Fmissing%2Fspecs%2Fnope.md

Expected:
- Response status: 404
- Response body: { "error": "File not found" }

Edge cases:
- N/A

---

## Flow: GET /spec-content — missing path param
Type: contract
Spec: specs/feature-repo-specs-listing.md > Requirement: Spec Content API

Setup:
- Authenticated session

Steps:
1. Send GET /api/repos/owner%2Fname/spec-content (no path query param)

Expected:
- Response status: 400
- Response body: { "error": "Missing path parameter" }

Edge cases:
- N/A

---

## Flow: GET /spec-content — unauthenticated
Type: contract
Spec: specs/feature-repo-specs-listing.md > Requirement: Spec Content API

Setup:
- No authenticated session

Steps:
1. Send GET /api/repos/owner%2Fname/spec-content?path=some%2Ffile.md without a valid session cookie

Expected:
- Response status: 401
- Response body: { "error": "Not authenticated" }

Edge cases:
- N/A

---

## Flow: Selecting a spec from the sidebar
Type: e2e
Spec: specs/feature-repo-specs-listing.md > Requirement: Spec Detail Page — Slug and Title

Setup:
- User is authenticated
- Connected repo has a spec file with content starting with "# My Spec Title\n..."
- The spec's slug is "feature-my-spec"
- The secondary sidebar shows the project group containing "feature-my-spec" in expanded state

Steps:
1. Navigate to /repo/[owner]/[name]/specs or any repo sub-route
2. Expand the project group in the secondary sidebar that contains "feature-my-spec"
3. Click the "feature-my-spec" spec item in the sidebar

Expected:
- Browser navigates to /repo/[owner]/[name]/specs/feature-my-spec
- Page displays the slug "feature-my-spec" (monospace label)
- Page displays the title "My Spec Title" as a heading

Edge cases:
- N/A

---

## Flow: Spec file has no title heading
Type: e2e
Spec: specs/feature-repo-specs-listing.md > Requirement: Spec Detail Page — Slug and Title

Setup:
- Connected repo has a spec file whose content contains no # heading
- The spec's slug is "feature-no-title"

Steps:
1. Navigate to /repo/[owner]/[name]/specs/feature-no-title directly

Expected:
- Page displays "feature-no-title" as both the monospace slug label and the title heading
- No error state is shown

Edge cases:
- N/A

---

## Flow: Spec not found
Type: e2e
Spec: specs/feature-repo-specs-listing.md > Requirement: Spec Detail Page — Slug and Title

Setup:
- User is authenticated
- "nonexistent-spec" does not match any spec file in the connected repo

Steps:
1. Navigate to /repo/[owner]/[name]/specs/nonexistent-spec directly

Expected:
- Page displays "Spec not found."
- No crash or unhandled error

Edge cases:
- N/A
