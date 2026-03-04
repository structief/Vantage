## ADDED Requirements

### Requirement: All Specs Page — Render Spec List
When a user navigates to `/repo/[owner]/[name]/specs`, the page SHALL render a list of all specs sourced from the connected repo's `openspec/changes/` directory (active) and `openspec/changes/archive/` directory (archived). The list SHALL include specs from both active and archived changes.

#### Scenario: Navigating to the All Specs page
- **WHEN** the user navigates to `/repo/[owner]/[name]/specs`
- **THEN** the page SHALL display all specs discovered from the connected repo's `openspec/` directory, organised by project group when applicable

#### Scenario: Empty repo — no openspec directory
- **WHEN** the connected repo contains no `openspec/changes/` directory
- **THEN** the page SHALL display a message "No specs found in this repository."

#### Scenario: Loading state
- **WHEN** the All Specs page is first rendered and spec data is being fetched
- **THEN** a skeleton loading state (animated placeholders) SHALL be shown until data resolves

### Requirement: Project Group Headings
Specs that belong to changes nested inside a subdirectory of `openspec/changes/` (e.g. `openspec/changes/auth/login-flow/`) SHALL be grouped under that subdirectory name as a project group heading. Specs whose parent change directory sits directly inside `openspec/changes/` (one level deep, e.g. `openspec/changes/secondary-sidebar-nav/`) SHALL be listed without a group heading. The `archive` subdirectory SHALL be treated as the "Archived" project group.

#### Scenario: Specs with a folder prefix
- **WHEN** a spec belongs to a change nested under a subdirectory (e.g. `openspec/changes/auth/login-flow/specs/feature.md`)
- **THEN** the subdirectory name (e.g. `auth`) SHALL be rendered as a project group heading, and the spec SHALL appear indented beneath it

#### Scenario: Specs without a folder prefix
- **WHEN** a spec belongs to a change directly inside `openspec/changes/` (e.g. `openspec/changes/secondary-sidebar-nav/specs/feature.md`)
- **THEN** the spec SHALL be listed without a project group heading

#### Scenario: Archived specs in the archive subdirectory
- **WHEN** a spec belongs to a change inside `openspec/changes/archive/`
- **THEN** the spec SHALL appear under an "Archived" project group heading, visually distinguished from active specs (e.g. subdued text or an "Archived" label)

### Requirement: Spec List Item — Doc Icon
Each spec item in the list SHALL be displayed with a document icon to its left, the spec slug as the primary label, and no additional metadata in the list row.

#### Scenario: Spec item appearance
- **WHEN** a spec is listed on the All Specs page
- **THEN** a document icon SHALL appear to the left of the spec slug text; the slug SHALL be derived from the spec filename without the `.md` extension

### Requirement: Spec Selection — Slug and Title Display
When the user clicks a spec item, the page SHALL update to display the selected spec's slug and its title (read from the `# Title` heading on the first line of the spec file, if present; otherwise fall back to the slug).

#### Scenario: Selecting a spec
- **WHEN** the user clicks a spec item in the list
- **THEN** the page SHALL display the spec's slug and its title prominently in the content area (no full spec rendering required)

#### Scenario: Spec file has no title heading
- **WHEN** the selected spec file contains no `# Heading` on its first line
- **THEN** the page SHALL display the slug as both the slug label and the title

#### Scenario: Selected spec is visually highlighted in the list
- **WHEN** a spec item is selected
- **THEN** that item SHALL receive an active/highlighted style in the list (filled background pill, consistent with navigation link active state)
