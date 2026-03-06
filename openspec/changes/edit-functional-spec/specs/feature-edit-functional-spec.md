## ADDED Requirements

### Requirement: Edit Mode Toggle in Spec Viewer

The spec viewer overview tab SHALL expose an "*Edit*" button that enters edit mode for the displayed functional spec file. In edit mode the raw markdown is replaced by a rich text editor that renders markup visually (bold, italic, headings, lists, code) while storing plain markdown as the underlying representation. A "Cancel" button SHALL discard all unsaved changes and revert the view to read-only mode. A "Save" button SHALL commit the edited content to the connected git repository.

#### Scenario: Entering edit mode

- **WHEN** the user clicks the "Edit" button in the spec viewer
- **THEN** the overview content area SHALL switch from read-only markdown rendering to an inline rich text editor pre-populated with the current markdown content of the spec file

#### Scenario: Editor is markdown-backed

- **WHEN** the user types or applies formatting in the editor
- **THEN** the underlying document SHALL remain valid markdown; display formatting (bold, headings, lists, blockquotes, inline code) SHALL be presented as rendered UI elements rather than raw syntax characters

#### Scenario: Cancelling edit mode

- **WHEN** the user clicks "Cancel" while in edit mode
- **THEN** the editor SHALL be dismissed, all unsaved changes discarded, and the spec viewer SHALL revert to the original read-only markdown view

#### Scenario: Edit button not shown without repo context

- **WHEN** the spec viewer is rendered without a valid `repoFullName` and `specPath`
- **THEN** the "Edit" button SHALL NOT be rendered

#### Scenario: Edit button only for change-scoped specs

- **WHEN** the `specPath` points to a file outside the `openspec/changes/` directory (for example, a base spec under `openspec/specs/`)
- **THEN** the "Edit" button SHALL NOT be rendered, even if `repoFullName` and `specPath` are present

---

### Requirement: Criteria Invalidation on Requirement Title Change

When a requirement heading (`### Requirement: <name>`) is renamed inside the editor, the corresponding criteria entry SHALL automatically revert to "not validated" status. This prevents stale validation against a requirement that no longer matches its original intent.

#### Scenario: Requirement title edited — validation cleared after successful save

- **WHEN** the user edits the text of a `### Requirement:` heading in the editor so that the resulting title differs from the stored title and the subsequent spec save commit succeeds
- **THEN** the validation state for that requirement index SHALL be reset to "not validated" only after the save has completed successfully

#### Scenario: Unchanged requirement titles retain their validation

- **WHEN** the user saves the spec without altering any `### Requirement:` heading text
- **THEN** all previously validated requirement indices SHALL remain validated after save

---

### Requirement: Spec Save with Git Commit

When the user confirms a save from edit mode, the updated markdown SHALL be committed to the connected git repository via the GitHub API with an auto-generated commit message. A loading overlay SHALL be displayed over the editor during the API call, matching the style used by the criteria validation overlay.

#### Scenario: Successful save

- **WHEN** the user clicks "Save" in edit mode
- **THEN** a loading overlay SHALL appear over the editor, the updated markdown SHALL be written to the repository file at the original `specPath` via a GitHub commit, and upon success the editor SHALL close and the overview SHALL display the newly saved content

#### Scenario: Auto-generated commit message

- **WHEN** a save is triggered
- **THEN** the commit message SHALL follow the pattern `"docs: update <filename>"` where `<filename>` is the spec's filename (e.g. `docs: update feature-add-auth.md`)

#### Scenario: Save failure — overlay dismissed with error

- **WHEN** the GitHub API call fails during a save
- **THEN** the loading overlay SHALL be dismissed, the editor SHALL remain open with the user's changes intact, and an inline error message SHALL be displayed near the save button

#### Scenario: Loading overlay blocks interaction

- **WHEN** the loading overlay is active during a save
- **THEN** the editor content SHALL be non-interactive (pointer events disabled, opacity reduced) and the overlay SHALL display a spinner and "Saving…" label matching the criteria tab overlay appearance