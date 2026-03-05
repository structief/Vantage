## ADDED Requirements

### [x] Requirement: Repo Sidebar
The application SHALL display a persistent vertical sidebar containing user-pinned repositories as square icon buttons, positioned to the left of the main navigation panel. Each repo button SHALL show the first two uppercase letters of the repository name over a deterministic gradient background derived from the repo name. The sidebar SHALL include an "Add repo" button (+ icon) that opens a picker for adding repos from the user's accessible repository list.

#### Scenario: Sidebar renders pinned repos
- **WHEN** the user is authenticated and has pinned at least one repository
- **THEN** the sidebar SHALL display one square button per pinned repo, each showing the first two letters of the repo name over its assigned gradient, ordered by the date the repo was added (oldest at top, newest at bottom)

#### Scenario: No pinned repos
- **WHEN** the user is authenticated and has pinned no repositories
- **THEN** the sidebar SHALL show only the "Add repo" button

#### Scenario: Gradient is deterministic
- **WHEN** a repo is added to the sidebar
- **THEN** the gradient assigned to it SHALL be derived from the repo's full name (owner/repo) so that the same repo always receives the same gradient across sessions and devices

#### Scenario: First two letters displayed
- **WHEN** a repo button is rendered in the sidebar
- **THEN** it SHALL display exactly the first two letters of the repository name (not the owner), uppercase, centered within the square

### [x] Requirement: Sidebar Cap — Insertion Order
The sidebar SHALL display at most 10 repositories, ordered by the date each repo was added (oldest first, stable). The sidebar order SHALL NOT change when the user navigates to a repo. When a new repo is added and the sidebar already contains 10 repos, the least-recently-added repo SHALL be evicted automatically without user confirmation.

#### Scenario: Sidebar order is stable on navigation
- **WHEN** the user navigates to a repo already in the sidebar
- **THEN** the sidebar order SHALL remain unchanged

#### Scenario: Automatic eviction at cap
- **WHEN** the user adds a repo and the sidebar already contains 10 repos
- **THEN** the oldest-added repo SHALL be removed from the sidebar and the newly added repo SHALL appear at the bottom of the list

#### Scenario: Picker blocked at cap
- **WHEN** the sidebar already contains 10 repos
- **THEN** the "+" button SHALL remain visible so users can still add repos (triggering eviction of the oldest-added)

### [x] Requirement: Add Repo to Sidebar
The application SHALL allow the user to add a repository from their GitHub-accessible repository list to the sidebar via a picker UI triggered from the sidebar's "+" button.

#### Scenario: Opening the picker
- **WHEN** the user clicks the "+" button at the bottom of the sidebar
- **THEN** a repo picker overlay SHALL open, listing the user's accessible repositories that are not already pinned to the sidebar

#### Scenario: Adding a repo
- **WHEN** the user selects a repository from the picker
- **THEN** the picker SHALL close, the selected repo SHALL be appended to the sidebar, and its gradient SHALL be assigned immediately

#### Scenario: All repos already pinned
- **WHEN** the user opens the picker but all accessible repos are already in the sidebar
- **THEN** the picker SHALL display an empty state message: "All your repositories have been added."

#### Scenario: Picker dismissed without selection
- **WHEN** the user dismisses the picker (Escape key or clicking outside)
- **THEN** no repo SHALL be added and the sidebar state SHALL remain unchanged

### [x] Requirement: Remove Repo from Sidebar
The application SHALL allow the user to remove a pinned repository from the sidebar.

#### Scenario: Removing a repo
- **WHEN** the user right-clicks a repo button in the sidebar
- **THEN** a context menu SHALL appear with a "Remove from sidebar" option

#### Scenario: Confirming removal
- **WHEN** the user selects "Remove from sidebar" from the context menu
- **THEN** the repo SHALL be removed from the sidebar immediately, and if it was the active repo, the application SHALL redirect to `/`

### [x] Requirement: Repo Context Switching
The application SHALL switch the active repository context when the user clicks a repo button in the sidebar.

#### Scenario: Switching to a repo
- **WHEN** the user clicks a repo button in the sidebar
- **THEN** the main content area SHALL navigate to that repo's page, displaying the repository's full name as the page title

#### Scenario: Active repo indicator
- **WHEN** a repo is the currently active context
- **THEN** its sidebar button SHALL display a visual active indicator (e.g., highlighted border or ring)

#### Scenario: Repo page placeholder
- **WHEN** the user navigates to a repo page that has no specs yet
- **THEN** the main content area SHALL show the repository's full name as an `<h1>` title with no other content required at this stage
