## ADDED Requirements

### Requirement: Spec Detail Route
When the user selects a spec from the secondary sidebar or the spec list, the application SHALL navigate to `/repo/[owner]/[name]/specs/[spec-slug]` and render the spec detail view in the main content area.

#### Scenario: Navigating to a spec
- **WHEN** the user clicks a spec link in the secondary sidebar or the spec list view
- **THEN** the browser SHALL navigate to `/repo/[owner]/[name]/specs/[spec-slug]` and the spec detail view SHALL be rendered

#### Scenario: Spec not found
- **WHEN** the user navigates to a `[spec-slug]` that does not exist in the repo
- **THEN** the main content area SHALL display a "Spec not found" message with a link back to the spec list

### Requirement: Spec Title Section
The top of the spec detail view SHALL display a title section containing: the spec's readable name (derived from the spec's frontmatter `title` field, or the filename if absent), the GitHub username and avatar of the last git committer for the spec file, the date of the last commit to the spec file formatted as "Updated [Month] [Day], [Year]", and a status badge indicating the spec's lifecycle state.

#### Scenario: Title rendered from frontmatter
- **WHEN** the spec file contains a `title` field in its YAML frontmatter
- **THEN** the title section SHALL display that value as the spec's readable name in a large heading

#### Scenario: Title fallback to filename
- **WHEN** the spec file has no `title` frontmatter field
- **THEN** the title section SHALL display the filename (without `.md`) converted from kebab-case to title-case as the readable name

#### Scenario: Creator shown from GitHub
- **WHEN** the spec detail view is rendered
- **THEN** the title section SHALL display the GitHub avatar and username of the user who made the last commit to the spec file, retrieved from the GitHub API

#### Scenario: Last updated date shown
- **WHEN** the spec detail view is rendered
- **THEN** the title section SHALL display the date of the most recent commit to the spec file as "Updated [Month] [Day], [Year]"

#### Scenario: Status badge placeholder
- **WHEN** the spec detail view is rendered
- **THEN** the title section SHALL display a status badge with one of three states: "Draft", "In Review", or "Approved"; the initial value SHALL be hardcoded as "Draft" (placeholder — no persistence required in this change)

### [x] Requirement: Criteria Progress Bar
Below the title section, the spec detail view SHALL display a horizontal progress bar that shows how many of the spec's criteria have been validated out of the total.

#### Scenario: Progress bar with partial completion
- **WHEN** the spec has criteria and some are validated
- **THEN** the progress bar SHALL fill proportionally and display a label such as "N of M criteria validated"

#### Scenario: Progress bar with no criteria
- **WHEN** the spec markdown contains no criteria section or has zero criteria items
- **THEN** the progress bar SHALL be hidden and the label SHALL NOT be rendered

#### Scenario: Progress bar with all criteria validated
- **WHEN** all criteria are validated
- **THEN** the progress bar SHALL display as fully filled with a "completed" visual treatment (e.g., green fill)

### Requirement: Horizontal Tab Navigation
Below the criteria progress bar, the spec detail view SHALL display a horizontal tab bar with four tabs: "Overview", "Criteria", "Contracts", and "Tests". Only one tab SHALL be active at a time. The active tab SHALL be visually distinguished with an underline indicator. The default active tab SHALL be "Overview".

#### Scenario: Default tab on load
- **WHEN** the user navigates to a spec detail view
- **THEN** the "Overview" tab SHALL be active by default and its content SHALL be rendered in the content area below

#### Scenario: Switching tabs
- **WHEN** the user clicks a tab
- **THEN** that tab SHALL become active, its underline indicator SHALL appear, the previously active tab's indicator SHALL disappear, and the content area SHALL update to show the selected tab's content

#### Scenario: Criteria tab badge
- **WHEN** the spec has criteria items
- **THEN** the "Criteria" tab SHALL display a numeric badge showing the total count of criteria items

#### Scenario: Contracts tab badge
- **WHEN** the spec has associated contract files
- **THEN** the "Contracts" tab SHALL display a numeric badge showing the count of contract files

#### Scenario: Tests tab badge
- **WHEN** the spec has associated test flow files
- **THEN** the "Tests" tab SHALL display a numeric badge showing the count of test flow files

### Requirement: Overview Tab Content
The Overview tab SHALL render the full body of the spec markdown file as formatted HTML. All standard markdown constructs SHALL be rendered (headings, paragraphs, lists, blockquotes, inline code, code blocks). Frontmatter SHALL be stripped before rendering.

#### Scenario: Markdown rendered as HTML
- **WHEN** the "Overview" tab is active
- **THEN** the spec's markdown body SHALL be rendered as styled HTML in the content area below the tab bar

#### Scenario: Frontmatter stripped
- **WHEN** the spec file contains YAML frontmatter (delimited by `---`)
- **THEN** the frontmatter block SHALL NOT appear in the rendered output

### Requirement: Criteria Tab Content
The Criteria tab SHALL list all criteria items extracted from the spec's criteria section (if present). Each criterion SHALL be shown as a checklist row with a checkbox (read-only in this change), the criterion text, and a "validated" or "pending" indicator.

#### Scenario: Criteria list rendered
- **WHEN** the "Criteria" tab is active and the spec has a criteria section
- **THEN** each criterion item SHALL be rendered as a row with a checkbox, the criterion text, and its validation state

#### Scenario: Empty criteria tab
- **WHEN** the "Criteria" tab is active and the spec has no criteria
- **THEN** the tab content area SHALL display "No criteria defined for this spec."

### Requirement: Contracts Tab Content
The Contracts tab SHALL list all contract files associated with the spec's change directory (`contracts/` folder within the change). Each entry shows the filename and a document icon.

#### Scenario: Contracts listed
- **WHEN** the "Contracts" tab is active and the change has contract files
- **THEN** each contract file SHALL be listed with its filename and a document icon

#### Scenario: Empty contracts tab
- **WHEN** the "Contracts" tab is active and no contract files exist
- **THEN** the tab content area SHALL display "No contracts defined yet."

### Requirement: Tests Tab Content
The Tests tab SHALL list all test flow files associated with the spec's change directory (`tests/` folder within the change). Each entry shows the test flow filename and a document icon.

#### Scenario: Tests listed
- **WHEN** the "Tests" tab is active and the change has test flow files
- **THEN** each test flow file SHALL be listed with its filename and a document icon

#### Scenario: Empty tests tab
- **WHEN** the "Tests" tab is active and no test flow files exist
- **THEN** the tab content area SHALL display "No test flows defined yet."
