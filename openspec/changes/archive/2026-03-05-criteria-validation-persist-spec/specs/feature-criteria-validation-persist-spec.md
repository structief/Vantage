## ADDED Requirements

### [x] Requirement: Inline Checkbox for Validation State in Spec Markdown
Each requirement heading SHALL include a checkbox marker immediately before the requirement name: `[ ]` for unvalidated and `[x]` for validated. The format SHALL be `### [ ] Requirement: <name>` or `### [x] Requirement: <name>`. Legacy headings without a checkbox SHALL be treated as unvalidated (`[ ]`). This keeps validation visible in the raw .md and tied to each requirement, so reordering or editing the spec does not desync state.

#### Scenario: Parsing validated state from checkbox
- **WHEN** a requirement heading is `### [x] Requirement: Foo`
- **THEN** the Criteria tab SHALL display "Foo" as checked/validated

#### Scenario: Parsing unvalidated state from checkbox
- **WHEN** a requirement heading is `### [ ] Requirement: Foo`
- **THEN** the Criteria tab SHALL display "Foo" as unchecked/pending

#### Scenario: Legacy heading without checkbox
- **WHEN** a requirement heading is `### Requirement: Foo` (no `[ ]` or `[x]` prefix)
- **THEN** the requirement SHALL be treated as unvalidated and the Criteria tab SHALL display it as unchecked

### [x] Requirement: Toggle Criteria Commits to Spec File
When the user toggles a criterion's validation state in the Criteria tab, the application SHALL update the spec markdown file in the repository and create a git commit. The commit message SHALL describe the change (e.g., "Validate: Foo" or "Unvalidate: Foo"). The update SHALL change only the checkbox in that requirement's heading (`[ ]` ↔ `[x]`); the rest of the spec SHALL remain unchanged.

#### Scenario: Commit on validate
- **WHEN** the user clicks an unchecked checkbox to mark a criterion as validated
- **THEN** the application SHALL update the requirement heading from `[ ]` to `[x]`, create a commit with a message such as "Validate: <requirement name>", and the UI SHALL reflect the new state

#### Scenario: Commit on unvalidate
- **WHEN** the user clicks a checked checkbox to mark a criterion as unvalidated
- **THEN** the application SHALL update the requirement heading from `[x]` to `[ ]`, create a commit with a message such as "Unvalidate: <requirement name>", and the UI SHALL reflect the new state

#### Scenario: Commit failure handling
- **WHEN** the commit fails (e.g., network error, insufficient permissions, or conflict)
- **THEN** the application SHALL display an error to the user and SHALL NOT update the local UI state; the criterion SHALL revert to its previous validation state

### [x] Requirement: Server-Side Parsing of Validation State
When loading a spec for the spec detail view, the server SHALL parse the spec markdown to extract the validation state of each requirement from the inline `[ ]` / `[x]` checkbox. The server SHALL pass the parsed `validatedIndices` (or equivalent) to the client so that the Criteria tab, progress bar, spec status badge, and secondary sidebar dot all reflect the persisted state from the spec file.

#### Scenario: Initial state from parsed spec
- **WHEN** the spec detail page loads
- **THEN** the Criteria tab, progress bar, spec status badge, and secondary sidebar dot SHALL display the validation state parsed from the inline checkboxes in the spec markdown

#### Scenario: Progress bar reflects persisted state
- **WHEN** the user navigates to a spec that has partial validation persisted
- **THEN** the progress bar SHALL show the correct validated count and fill proportion

#### Scenario: Spec status and sidebar dot from persisted state
- **WHEN** the user navigates to a spec (or the secondary sidebar renders)
- **THEN** the spec status badge (Draft / In review / Reviewed) and the status dot in the secondary sidebar SHALL be derived from the persisted validation state, not from session-only state

### [x] Requirement: Sidebar Status for Non-Archived Specs
The secondary sidebar SHALL display the correct status dot (Draft / In review / Reviewed) for each non-archived spec. The application SHALL NOT parse archived specs on initial load; archived specs SHALL be parsed and their status SHALL be resolved only when the user loads one. This avoids overloading the system with speculative fetches for archived content.

#### Scenario: Non-archived specs show correct dot in sidebar
- **WHEN** the user views the secondary sidebar with projects expanded
- **THEN** each non-archived spec SHALL display a status dot reflecting its persisted validation state (gray / amber / green)

#### Scenario: Archived spec dot on first render
- **WHEN** the sidebar renders and includes archived specs
- **THEN** archived specs SHALL display the default Draft dot (gray) until the user loads one

#### Scenario: Archived spec status after load
- **WHEN** the user loads an archived spec
- **THEN** the application SHALL parse that spec and update the sidebar dot for it; the updated status SHALL persist for the session or until invalidated

### Requirement: Spec Status Cache in Database
The application SHALL cache parsed spec status (Draft / In review / Reviewed) in the local SQLite database to avoid repeated GitHub fetches and parsing. The cache SHALL be keyed by repository and spec file path. The cache SHALL be invalidated or updated when: (a) the user toggles a criterion (upsert with new status), (b) the user loads a spec (re-parse and upsert), or (c) the cached entry is older than a configured TTL (e.g. 15 minutes). When serving the sidebar, the application SHALL prefer cached status when fresh; when stale or missing, it SHALL fetch and parse the spec, upsert the cache, and return the status.

#### Scenario: Sidebar uses cached status when fresh
- **WHEN** the sidebar requests status for non-archived specs and the cache has a recent entry
- **THEN** the application SHALL return the cached status without fetching from GitHub

#### Scenario: Cache refreshed on toggle
- **WHEN** the user toggles a criterion and the commit succeeds
- **THEN** the application SHALL upsert the spec's status in the cache

#### Scenario: Cache refreshed on spec load
- **WHEN** the user loads a spec (archived or active)
- **THEN** the application SHALL parse the spec, derive the status, and upsert the cache

#### Scenario: Stale cache triggers re-fetch
- **WHEN** a cached entry is older than the TTL
- **THEN** the application SHALL treat it as stale, fetch the spec from GitHub, parse it, upsert the cache, and return the new status
