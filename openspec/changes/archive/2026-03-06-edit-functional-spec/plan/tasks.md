## 1. Data model

- [x] 1.1 Confirm no persisted data model changes are required for spec editing (spec content remains git-only).

## 2. Contracts

- [x] 2.1 Finalize `contracts/api/edit-functional-spec.yaml` for `PUT /api/repos/{encodedFullName}/specs/update` (paths, request body, responses).

## 3. Implementation

- [x] 3.1 Add `PUT /api/repos/[encodedFullName]/specs/update` route handler using `updateSpecFile` and auto-generated commit messages.
- [x] 3.2 Introduce a markdown-backed `SpecEditor` client component using TipTap, wired for markdown in/out.
- [x] 3.3 Add an \"Edit\" / \"Cancel\" / \"Save\" control surface in the spec title section, gated on `repoFullName` and `specPath`, and lift `isEditing` state into `SpecDetailView`.
- [x] 3.7 Fix `isChangeScoped` guard to exclude archived specs (`openspec/changes/archive/` paths SHALL return false).
- [x] 3.4 Implement client-side logic to compare requirement headings before/after edit and clear validation for renamed requirements only after a successful save commit.
- [x] 3.5 Wire the save flow from `SpecDetailView` to call the new update API, handle success/failure, and refresh the overview content.
- [x] 3.6 Implement a loading overlay around the editor during save, visually consistent with the criteria tab overlay.

## 4. Tests

- [x] 4.1 Translate `tests/feature-edit-functional-spec.flow.md` \"Entering edit mode\" and \"Cancelling edit mode\" flows into Playwright e2e tests.
- [x] 4.2 Translate `tests/feature-edit-functional-spec.flow.md` \"Editor is markdown-backed\" and \"Requirement title edited — validation cleared\" flows into unit tests (editor + diff logic).
- [x] 4.4 Translate `tests/feature-edit-functional-spec.flow.md` \"Edit button not shown for archived specs\" flow into unit tests for `isChangeScoped`.
- [x] 4.3 Translate `tests/feature-edit-functional-spec.flow.md` \"Successful spec save with git commit\" and \"Save failure keeps edits and removes overlay\" flows into contract/e2e tests for the update API route.

