## ADDED Requirements

### [x] Requirement: Secondary Sidebar — Always Visible
The secondary sidebar SHALL always be rendered and visible whenever a repo is active (any `/repo/[owner]/[name]` route). It SHALL never be fully hidden or removed from the layout. When no repo is active (the `/` home route), the secondary sidebar SHALL NOT be rendered.

#### Scenario: Secondary sidebar present on repo route
- **WHEN** the user navigates to any `/repo/[owner]/[name]` sub-route
- **THEN** the secondary sidebar SHALL be rendered to the right of the primary repo icon sidebar

#### Scenario: Secondary sidebar absent on home route
- **WHEN** the user is on the `/` home route (no active repo)
- **THEN** the secondary sidebar SHALL NOT be rendered; the primary repo icon sidebar fills the full left edge

### [x] Requirement: Secondary Sidebar Toggle
A toggle button SHALL appear at the top of the primary repo icon sidebar. It controls the **display mode** of the secondary sidebar: either **expanded** (icons + text labels) or **collapsed** (icons only, or two-letter initials for project groups). The toggle state SHALL persist in `localStorage`. The default state is expanded.

#### Scenario: Switching to collapsed mode
- **WHEN** the secondary sidebar is in expanded mode and the user clicks the toggle button
- **THEN** the secondary sidebar SHALL transition to collapsed mode: nav link text labels disappear, only icons remain; project group names collapse to their two-letter initials

#### Scenario: Switching to expanded mode
- **WHEN** the secondary sidebar is in collapsed mode and the user clicks the toggle button
- **THEN** the secondary sidebar SHALL transition to expanded mode: full text labels and project names become visible alongside their icons

#### Scenario: Toggle state persists on navigation
- **WHEN** the user changes the toggle mode and navigates to a different page within the same repo context
- **THEN** the secondary sidebar SHALL remain in the mode the user last set

### [x] Requirement: Secondary Sidebar Panel
The secondary sidebar SHALL display:
1. The active repo's name and gradient icon at the top
2. Three fixed navigation links below the repo identity area
3. A PROJECTS section below the navigation links

In **expanded mode** the panel SHALL be 220px wide. In **collapsed mode** the panel SHALL shrink to a narrow width (52px) showing only icons/initials, matching the visual rhythm of the primary sidebar.

Both modes SHALL share the same light background (`#f7f7f8`) and right border, matching the primary sidebar aesthetic.

#### Scenario: Repo identity in expanded mode
- **WHEN** the secondary sidebar is in expanded mode with an active repo
- **THEN** the top of the panel SHALL display the repo's gradient icon alongside the repo name in semibold text

#### Scenario: Repo identity in collapsed mode
- **WHEN** the secondary sidebar is in collapsed mode with an active repo
- **THEN** only the repo's gradient icon SHALL be visible at the top (no text)

### [x] Requirement: Navigation Links
The secondary sidebar SHALL display three fixed navigation links, each with a matching icon:

1. **All Specs** — grid/squares icon
2. **Activity** — bell icon
3. **Settings** — gear/cog icon

Each link SHALL navigate to the corresponding sub-route of the active repo: `/repo/[owner]/[name]/specs`, `/repo/[owner]/[name]/activity`, `/repo/[owner]/[name]/settings`.

#### Scenario: Expanded mode — icon and label
- **WHEN** the secondary sidebar is in expanded mode
- **THEN** each navigation link SHALL show its icon and its text label side by side

#### Scenario: Collapsed mode — icon only
- **WHEN** the secondary sidebar is in collapsed mode
- **THEN** each navigation link SHALL show only its icon; the text label SHALL be hidden; a tooltip with the label SHALL appear on hover

#### Scenario: Active link is highlighted
- **WHEN** the user is on a sub-route of the active repo (e.g., `/repo/owner/name/specs`)
- **THEN** the matching navigation link SHALL be visually highlighted with a filled background pill

#### Scenario: Navigating via a sidebar link
- **WHEN** the user clicks a navigation link
- **THEN** the browser SHALL navigate to the corresponding route and that link SHALL enter the active/highlighted state

### [x] Requirement: Projects Section
Below the navigation links, the secondary sidebar SHALL display a "PROJECTS" section.

In **expanded mode**: shows a "PROJECTS" header (uppercase, small, subdued), followed by collapsable project group rows. Each row shows the project name in semibold text and a spec count badge on the right. A right-pointing chevron indicates collapsed state; it rotates downward when expanded. Expanded groups list their specs indented below, each with a document icon.

In **collapsed mode**: shows each project group as a small square with its two-letter initials (styled like a mini version of the primary repo icons, but smaller). A tooltip with the full project name appears on hover.

Projects and specs SHALL be sourced from the connected repo's `openspec/changes/` directory via the GitHub API. Each top-level change directory becomes a project group. Spec files inside each change's `specs/` subdirectory are listed as individual specs.

If the repo has no openspec changes, the section SHALL display "No projects yet." (expanded) or nothing (collapsed).

#### Scenario: Collapsed project group in expanded mode
- **WHEN** a project group is in its default (collapsed) state and the sidebar is in expanded mode
- **THEN** only the project name and spec count badge are visible; specs below are hidden; a right-pointing chevron is shown

#### Scenario: Expanding a project group
- **WHEN** the user clicks a collapsed project group row
- **THEN** the chevron SHALL rotate to point downward and the spec list under that group SHALL become visible

#### Scenario: Collapsing an expanded project group
- **WHEN** the user clicks an expanded project group row
- **THEN** the chevron SHALL rotate back to right-pointing and the spec list SHALL collapse

#### Scenario: Project group collapse state persists in session
- **WHEN** the user expands a project group and navigates within the same repo context
- **THEN** the project group SHALL remain expanded

#### Scenario: Project groups in collapsed sidebar mode
- **WHEN** the secondary sidebar is in collapsed mode
- **THEN** each project group SHALL be shown as a small square with its two-letter initials; no text labels or spec lists are visible

#### Scenario: Clicking a spec in the list
- **WHEN** the user clicks a spec listed under a project group (expanded mode)
- **THEN** the browser SHALL navigate to `/repo/[owner]/[name]/specs/[spec-slug]`

#### Scenario: Empty projects list
- **WHEN** the active repo has no openspec changes directory or no change subdirectories
- **THEN** in expanded mode the PROJECTS section SHALL display "No projects yet." in subdued text

#### Scenario: Loading state
- **WHEN** the secondary sidebar is first rendered for an active repo and project data is being fetched
- **THEN** a skeleton loading state (animated placeholders) SHALL be shown in the PROJECTS section
