# Test flows: secondary-sidebar-nav

<!-- Generated from specs/feature-secondary-sidebar-nav.md -->

## Flow: Secondary sidebar present on repo route
Type: e2e
Spec: specs/feature-secondary-sidebar-nav.md > Requirement: Secondary Sidebar — Always Visible

Setup:
- User is authenticated
- At least one repo is pinned
- User navigates to /repo/owner/name

Steps:
1. Render the shell layout at /repo/owner/name
2. Observe the DOM

Expected:
- The secondary sidebar element is present and visible in the DOM
- The primary repo icon sidebar is also present to its left

---

## Flow: Secondary sidebar absent on home route
Type: e2e
Spec: specs/feature-secondary-sidebar-nav.md > Requirement: Secondary Sidebar — Always Visible

Setup:
- User is authenticated
- User navigates to /

Steps:
1. Render the shell layout at /
2. Observe the DOM

Expected:
- No secondary sidebar element is rendered in the DOM
- The primary repo icon sidebar is present

---

## Flow: Switching to collapsed mode
Type: e2e
Spec: specs/feature-secondary-sidebar-nav.md > Requirement: Secondary Sidebar Toggle

Setup:
- User is authenticated with an active repo
- Secondary sidebar is in expanded mode

Steps:
1. Click the toggle button at the top of the primary sidebar
2. Observe the secondary sidebar

Expected:
- Nav link text labels are no longer visible
- Nav link icons are still visible
- Project group names are replaced by two-letter initial squares
- The secondary sidebar panel is still rendered (not hidden)

---

## Flow: Switching to expanded mode
Type: e2e
Spec: specs/feature-secondary-sidebar-nav.md > Requirement: Secondary Sidebar Toggle

Setup:
- User is authenticated with an active repo
- Secondary sidebar is in collapsed mode (vantage:secondary-sidebar:mode = "collapsed" in localStorage)

Steps:
1. Click the toggle button
2. Observe the secondary sidebar

Expected:
- Nav link text labels become visible alongside icons
- Project group names become visible
- The panel width increases to 220px

---

## Flow: Toggle mode persists on navigation
Type: e2e
Spec: specs/feature-secondary-sidebar-nav.md > Requirement: Secondary Sidebar Toggle

Setup:
- User is authenticated with an active repo
- Secondary sidebar is in expanded mode

Steps:
1. Click toggle → secondary sidebar enters collapsed mode
2. Navigate to /repo/owner/name/specs
3. Observe the secondary sidebar

Expected:
- Secondary sidebar is still in collapsed mode after navigation
- localStorage key "vantage:secondary-sidebar:mode" equals "collapsed"

---

## Flow: Repo identity in expanded mode
Type: e2e
Spec: specs/feature-secondary-sidebar-nav.md > Requirement: Secondary Sidebar Panel

Setup:
- User is authenticated
- Active repo is "acme/frontend"

Steps:
1. Render the secondary sidebar in expanded mode at /repo/acme/frontend

Expected:
- Repo gradient icon for "acme/frontend" is visible
- Repo name "acme/frontend" (or "frontend") is visible as semibold text

---

## Flow: Repo identity in collapsed mode
Type: e2e
Spec: specs/feature-secondary-sidebar-nav.md > Requirement: Secondary Sidebar Panel

Setup:
- User is authenticated
- Active repo is "acme/frontend"
- Secondary sidebar is in collapsed mode

Steps:
1. Render the secondary sidebar in collapsed mode at /repo/acme/frontend

Expected:
- Repo gradient icon is visible
- No text label for the repo name is visible

---

## Flow: Expanded mode — icon and label for nav links
Type: e2e
Spec: specs/feature-secondary-sidebar-nav.md > Requirement: Navigation Links

Setup:
- Secondary sidebar is in expanded mode
- Active repo is set

Steps:
1. Render the secondary sidebar

Expected:
- "All Specs" link shows a grid icon and the text "All Specs"
- "Activity" link shows a bell icon and the text "Activity"
- "Settings" link shows a gear icon and the text "Settings"

---

## Flow: Collapsed mode — icon only with tooltip
Type: e2e
Spec: specs/feature-secondary-sidebar-nav.md > Requirement: Navigation Links

Setup:
- Secondary sidebar is in collapsed mode

Steps:
1. Render the secondary sidebar
2. Hover over the All Specs icon

Expected:
- Only icons are visible for all nav links (no text labels)
- A tooltip "All Specs" appears on hover

---

## Flow: Active nav link is highlighted
Type: e2e
Spec: specs/feature-secondary-sidebar-nav.md > Requirement: Navigation Links

Setup:
- User is at /repo/owner/name/specs

Steps:
1. Render the secondary sidebar

Expected:
- The "All Specs" link has a filled background pill highlight
- "Activity" and "Settings" links do not have the highlight

---

## Flow: Navigating via a sidebar link
Type: e2e
Spec: specs/feature-secondary-sidebar-nav.md > Requirement: Navigation Links

Setup:
- User is at /repo/acme/frontend (no sub-route active)
- Secondary sidebar is expanded

Steps:
1. Click "Activity" in the secondary sidebar

Expected:
- Browser navigates to /repo/acme/frontend/activity
- "Activity" link is now in the active/highlighted state

---

## Flow: Collapsed project group in expanded mode
Type: e2e
Spec: specs/feature-secondary-sidebar-nav.md > Requirement: Projects Section

Setup:
- Active repo has projects loaded
- All project groups are in their default (collapsed) state
- Secondary sidebar is in expanded mode

Steps:
1. Render the PROJECTS section

Expected:
- Each project group shows its name and spec count badge
- Specs below each group are hidden
- A right-pointing chevron icon is visible on each group row

---

## Flow: Expanding a project group
Type: e2e
Spec: specs/feature-secondary-sidebar-nav.md > Requirement: Projects Section

Setup:
- Secondary sidebar is expanded
- Project group "Repo Sidebar Navigation" is collapsed

Steps:
1. Click the "Repo Sidebar Navigation" row

Expected:
- The chevron rotates to point downward
- The spec list under that group becomes visible

---

## Flow: Collapsing an expanded project group
Type: e2e
Spec: specs/feature-secondary-sidebar-nav.md > Requirement: Projects Section

Setup:
- Secondary sidebar is expanded
- Project group "Repo Sidebar Navigation" is expanded (specs visible)

Steps:
1. Click the "Repo Sidebar Navigation" row again

Expected:
- The chevron rotates back to right-pointing
- The spec list collapses and is hidden

---

## Flow: Project group collapse state persists in session
Type: e2e
Spec: specs/feature-secondary-sidebar-nav.md > Requirement: Projects Section

Setup:
- Secondary sidebar is expanded
- "Repo Sidebar Navigation" project group is expanded

Steps:
1. Navigate to /repo/acme/frontend/activity
2. Render the secondary sidebar

Expected:
- "Repo Sidebar Navigation" group remains expanded (specs still visible)

---

## Flow: Project groups in collapsed sidebar mode
Type: e2e
Spec: specs/feature-secondary-sidebar-nav.md > Requirement: Projects Section

Setup:
- Secondary sidebar is in collapsed mode
- Active repo has 2 project groups

Steps:
1. Render the PROJECTS section

Expected:
- Each project group is shown as a small square with its two-letter initials
- No text labels are visible
- No spec lists are visible

---

## Flow: Clicking a spec in the list
Type: e2e
Spec: specs/feature-secondary-sidebar-nav.md > Requirement: Projects Section

Setup:
- Secondary sidebar is expanded
- Project group "Repo Sidebar Navigation" is expanded
- It contains a spec "feature-repo-sidebar-navigation.md"

Steps:
1. Click the spec item "feature-repo-sidebar-navigation"

Expected:
- Browser navigates to /repo/owner/name/specs/feature-repo-sidebar-navigation

---

## Flow: Empty projects list
Type: e2e
Spec: specs/feature-secondary-sidebar-nav.md > Requirement: Projects Section

Setup:
- Active repo has no openspec/changes/ directory (or it is empty)
- Secondary sidebar is expanded

Steps:
1. API returns { "projects": [] }
2. Render the PROJECTS section

Expected:
- "No projects yet." text is shown in subdued style
- No project group rows are rendered

---

## Flow: Loading skeleton state
Type: e2e
Spec: specs/feature-secondary-sidebar-nav.md > Requirement: Projects Section

Setup:
- Secondary sidebar is expanded
- Active repo is set
- API call for projects is in-flight (not yet resolved)

Steps:
1. Render the PROJECTS section before the fetch resolves

Expected:
- Animated skeleton placeholder rows are shown in the PROJECTS section
- No project names or spec counts are visible yet

---

## Flow: GET /api/repos/{encodedFullName}/projects — success
Type: contract
Spec: specs/feature-secondary-sidebar-nav.md > Requirement: Projects Section
See: contracts/api/secondary-sidebar-nav.yaml

Setup:
- Authenticated session with GitHub access token
- Repo "acme/frontend" has openspec/changes/ with two subdirectories: "auth-flow" and "billing"
- "auth-flow/specs/" contains 3 .md files; "billing/specs/" contains 1 .md file

Steps:
1. GET /api/repos/acme%2Ffrontend/projects

Expected:
- Response status 200
- Response body matches ProjectsResponse schema
- projects array has 2 items
- First item: { slug: "auth-flow", name: "Auth Flow", specCount: 3 }
- Second item: { slug: "billing", name: "Billing", specCount: 1 }

Edge cases:
- openspec/changes/ does not exist → 200 with { "projects": [] }
- Session missing → 401 with { "error": "Not authenticated" }
- encodedFullName malformed (no slash after decode) → 400 with { "error": "Invalid repository name" }

---

## Flow: GET /api/repos/{encodedFullName}/projects — empty repo
Type: contract
Spec: specs/feature-secondary-sidebar-nav.md > Requirement: Projects Section
See: contracts/api/secondary-sidebar-nav.yaml

Setup:
- Authenticated session
- Repo has no openspec/changes/ directory (GitHub returns 404 for that path)

Steps:
1. GET /api/repos/acme%2Fempty/projects

Expected:
- Response status 200
- Response body: { "projects": [] }
