# Test flows: edit-functional-spec

<!-- Generated from specs/feature-edit-functional-spec.md. Each flow maps to a spec scenario.
     Translated to actual test code during opsx-apply. -->

## Flow: Entering edit mode
Type: e2e
Spec: specs/feature-edit-functional-spec.md > Requirement: Edit Mode Toggle in Spec Viewer

Setup:
- A repository with at least one spec file is connected in Vantage.
- The user is authenticated and has navigated to a spec detail view with a valid repoFullName and specPath.

Steps:
1. Observe the spec overview tab rendering the spec content in read-only mode.
2. Click the "Edit" button in the spec viewer header.

Expected:
- The overview content area switches to an inline editor surface.
- The editor is pre-populated with the current markdown content of the spec file.

Edge cases:
- If repoFullName or specPath are missing, the "Edit" button is not rendered and cannot be clicked.

## Flow: Editor is markdown-backed
Type: unit
Spec: specs/feature-edit-functional-spec.md > Requirement: Edit Mode Toggle in Spec Viewer

Setup:
- The spec editor component has been initialized with a markdown string containing headings, bold, italics, lists, and inline code.

Steps:
1. Render the editor with the initial markdown value.
2. Apply formatting changes (e.g. toggle bold, change a heading level, add a list item) using the editor controls.
3. Read back the serialized document value as markdown.

Expected:
- The serialized value is valid markdown.
- Visual formatting in the editor (bold, headings, lists, inline code) corresponds to the appropriate markdown syntax in the serialized value.

Edge cases:
- Simple requirement/scene structure (`### Requirement:` / `#### Scenario:`) round-trips without structural changes.

## Flow: Cancelling edit mode reverts changes
Type: e2e
Spec: specs/feature-edit-functional-spec.md > Requirement: Edit Mode Toggle in Spec Viewer

Setup:
- The user is in edit mode on a spec detail view.
- The editor shows the current spec markdown content.

Steps:
1. Modify the editor content (e.g. change some body text).
2. Click the "Cancel" button.

Expected:
- The editor surface is dismissed.
- The spec overview reverts to the original read-only markdown rendering.
- None of the local edits are persisted to GitHub.

Edge cases:
- If a save was in progress when cancel was clicked, cancel is disabled until the save completes or fails.

## Flow: Requirement title edited — validation cleared
Type: unit
Spec: specs/feature-edit-functional-spec.md > Requirement: Criteria Invalidation on Requirement Title Change

Setup:
- There is an original markdown string containing at least one `### Requirement:` heading.
- The current validation state includes that requirement index as validated.

Steps:
1. Produce an edited markdown string in which the text of one `### Requirement:` heading has changed.
2. Run the comparison logic that derives requirement names from before and after (using extractRequirementNames).
3. Compute the set of indices whose requirement name has changed.
4. Issue a simulated successful save (e.g. mock a 200 response from the update API).
5. After the successful save, apply the diff to the validated indices set.

Expected:
- The indices whose requirement titles changed are removed from the validated indices set only after the save succeeds.
- Indices whose requirement titles did not change remain validated throughout.

Edge cases:
- Whitespace-only changes in the heading text do not cause unnecessary invalidation.

## Flow: Successful spec save with git commit
Type: contract
Spec: specs/feature-edit-functional-spec.md > Requirement: Spec Save with Git Commit

Setup:
- The user is in edit mode with modified markdown content.
- The client is configured to call PUT /api/repos/{encodedFullName}/specs/update with the edited markdown and path.

Steps:
1. Click the "Save" button in the editor.
2. The client sends a PUT request to `/api/repos/{encodedFullName}/specs/update` with a JSON body containing `path` and `content`.
3. The backend calls `updateSpecFile` with the same path, content, and an auto-generated commit message.

Expected:
- A loading overlay appears over the editor while the request is in flight.
- The API responds with HTTP 200 and a body conforming to `UpdateSpecResponse` in `contracts/api/edit-functional-spec.yaml`.
- The editor closes and the overview re-renders with the newly saved markdown content.

Edge cases:
- If the GitHub API returns a 409 conflict, the API responds with an error status and message; the editor remains open, the overlay is removed, and the user sees an inline error.

## Flow: Save failure keeps edits and removes overlay
Type: e2e
Spec: specs/feature-edit-functional-spec.md > Requirement: Spec Save with Git Commit

Setup:
- The user is in edit mode with unsaved changes.
- The backend is configured to simulate a failure (e.g. GitHub returns 500).

Steps:
1. Click the "Save" button in the editor.
2. Wait for the save request to fail.

Expected:
- The loading overlay is dismissed once the failure is detected.
- The editor remains visible with the user's unsaved changes intact.
- An inline error message is shown near the save button describing that the save failed.

Edge cases:
- Re-trying save after a transient error eventually succeeds and transitions to the successful save behavior.

