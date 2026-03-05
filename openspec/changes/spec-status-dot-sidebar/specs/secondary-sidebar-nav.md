## MODIFIED Requirements

### Requirement: Projects Section
Below the navigation links, the secondary sidebar SHALL display a "PROJECTS" section.

In **expanded mode**: shows a "PROJECTS" header (uppercase, small, subdued), followed by collapsable project group rows. Each row shows the project name in semibold text and a spec count badge on the right. A right-pointing chevron indicates collapsed state; it rotates downward when expanded. Expanded groups list their specs indented below, each with a document icon and a status dot.

In **collapsed mode**: shows each project group as a small square with its two-letter initials (styled like a mini version of the primary repo icons, but smaller). A tooltip with the full project name appears on hover.

Projects and specs SHALL be sourced from the connected repo's `openspec/changes/` directory via the GitHub API. Each top-level change directory becomes a project group. Spec files inside each change's `specs/` subdirectory are listed as individual specs.

When rendering spec names in the list, the `feature-` prefix SHALL be stripped from the display label. The underlying slug remains unchanged for routing purposes; only the visible text is affected.

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

#### Scenario: Feature prefix stripped from spec display label
- **WHEN** a spec slug begins with the prefix `feature-` (e.g. `feature-add-auth`)
- **THEN** the sidebar SHALL display the name without the prefix (e.g. `add-auth`); routing and internal references SHALL continue to use the full slug

#### Scenario: Empty projects list
- **WHEN** the active repo has no openspec changes directory or no change subdirectories
- **THEN** in expanded mode the PROJECTS section SHALL display "No projects yet." in subdued text

#### Scenario: Loading state
- **WHEN** the secondary sidebar is first rendered for an active repo and project data is being fetched
- **THEN** a skeleton loading state (animated placeholders) SHALL be shown in the PROJECTS section

## ADDED Requirements

### Requirement: Spec Status Dot in Sidebar
Each spec listed in the secondary sidebar SHALL display a small colored dot immediately before the spec name. The dot reflects the spec's current review status and SHALL update in real-time as the user validates or unvalidates criteria in the spec detail view.

The status-to-color mapping SHALL match the mapping used in the spec detail view title section:
- **Draft** (no criteria validated): gray dot (`bg-gray-400`)
- **In review** (some but not all criteria validated): amber dot (`bg-amber-400`)
- **Reviewed** (all criteria validated): green dot (`bg-green-500`)

The current status of each open spec SHALL be held in a shared React context so that changes made in the spec detail view propagate immediately to the sidebar without a page reload or network request.

For specs that have never been opened in the current session, the dot SHALL default to the **Draft** state.

#### Scenario: Default dot state for unvisited spec
- **WHEN** a spec is listed in the sidebar and has not been opened in the current session
- **THEN** the spec's dot SHALL appear in the Draft color (gray)

#### Scenario: Dot reflects in-review status
- **WHEN** the user has validated at least one but not all criteria for the currently open spec
- **THEN** the dot next to that spec's name in the sidebar SHALL immediately change to amber

#### Scenario: Dot reflects reviewed status
- **WHEN** the user has validated all criteria for the currently open spec
- **THEN** the dot next to that spec's name in the sidebar SHALL immediately change to green

#### Scenario: Dot reverts when criteria are unvalidated
- **WHEN** the user unvalidates criteria such that the status transitions from Reviewed back to In review, or from In review back to Draft
- **THEN** the sidebar dot SHALL update to reflect the new status immediately

#### Scenario: Dot persists across sidebar spec list navigations
- **WHEN** the user opens spec A (sets it to In review), then clicks spec B in the sidebar
- **THEN** spec A's dot SHALL remain amber in the sidebar list while spec B is active
