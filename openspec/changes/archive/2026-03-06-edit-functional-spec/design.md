## Context

The spec viewer (`SpecDetailView`) currently renders functional spec markdown files in read-only mode. The constitution lists "spec authoring" as in-scope: every save must produce a git commit; `updateSpecFile` in `lib/github-spec.ts` already supports committing a file update via the GitHub API. A `spec-content` GET route exists for fetching raw file content.

No editor UI exists today. The overview tab shows `SpecMarkdownRenderer` (read-only). The criteria tab has an established loading overlay pattern (`disabled` prop → spinner + `bg-white/80` overlay) that the save overlay should mirror.

## Goals / Non-Goals

**Goals:**
- Add an inline edit mode to the spec viewer overview that swaps the read-only renderer for a WYSIWYG-style editor backed by markdown
- Auto-reset validation state for any requirement whose title changes on save
- Commit the updated content to GitHub with an auto-generated message on save
- Show a loading overlay during the save API call, matching CriteriaTab style

**Non-Goals:**
- Real-time collaborative editing
- Editing specs outside the overview tab (criteria, contracts, tests tabs remain read-only)
- Creating new spec files from scratch (out of scope per constitution)
- Branch selection — commits go to the repo default branch (same as today's validate flow)

## Decisions

### Decision: Rich text editor library — TipTap
**Choice**: Use TipTap (`@tiptap/react` + `@tiptap/starter-kit`) with `@tiptap/extension-markdown` for markdown serialisation/deserialisation.
**Why**: TipTap is headless — it ships zero default styles and integrates with Tailwind without conflict. The `extension-markdown` package handles bidirectional conversion (markdown ↔ ProseMirror doc) so the stored value is always valid markdown. The editor renders visual formatting (bold, headings, lists, blockquotes, code) without exposing raw syntax characters to the user, satisfying the "UI friendly in markup in the foreground" requirement. It is ESM-native and works with Next.js App Router client components.
**Alternatives**: Plain `<textarea>` with a split preview panel — rejected because it still exposes raw markdown syntax to the user. `react-md-editor` — rejected because it renders a split-pane with visible syntax, not a WYSIWYG surface.

### Decision: Edit button placement — title section header
**Choice**: Render an "Edit" icon-button in `SpecTitleSection` (top-right of the header area), visible only when `repoFullName` and `specPath` are present. Edit/Cancel/Save state is lifted to `SpecDetailView` as `isEditing` boolean.
**Why**: The title section is already the action area of the viewer. Placing the toggle there is consistent with Linear/Notion conventions (edit affordance near the title). Lifting state to `SpecDetailView` keeps the editor and the tab bar in sync — the overview tab content switches between `SpecMarkdownRenderer` and a new `SpecEditor` component based on `isEditing`.
**Alternatives**: A toolbar button inside the overview tab content area — rejected because it would scroll out of view on long specs.

### Decision: Criteria invalidation — compare requirement names after successful save
**Choice**: After the save API responds successfully, extract requirement names from the original markdown and the edited markdown using the existing `extractRequirementNames` utility. For each index where the name has changed, remove that index from the current `validatedIndices` set and send the updated set to the validate API (same `/api/repos/[encodedFullName]/specs/validate` endpoint) in a single bulk call, or by resetting via the existing `handleToggle` path.
**Why**: `extractRequirementNames` is already implemented and battle-tested, and computing the diff client-side keeps UI logic simple. Delaying persistence of invalidations until after a successful commit ensures SQLite validation state stays in lockstep with the git-backed spec content.
**Alternatives**: Let the server infer invalidation from diff — rejected because it adds server-side complexity and the spec content model is intentionally git-only (no spec-content table in SQLite). Clearing validation before the commit succeeds was rejected to avoid divergence between git and SQLite if the save fails.

### Decision: Save API — new PUT route reusing `updateSpecFile`
**Choice**: Add a `PUT /api/repos/[encodedFullName]/specs/update` route that accepts `{ path, content }` in the request body, calls `updateSpecFile` from `lib/github-spec.ts`, and returns `{ sha }` on success.
**Why**: `updateSpecFile` already handles SHA fetching, base64 encoding, and Octokit error handling. A dedicated route keeps the save concern separate from the existing validate route. The auto-generated commit message (`docs: update <filename>`) is constructed server-side from the `path` parameter to keep client logic thin.
**Alternatives**: Reuse the existing `spec-content` GET route as a PUT — rejected because REST convention and Next.js route handlers make a separate handler cleaner.

### Decision: Edit button availability
**Choice**: Only specs loaded from change-scoped paths (`openspec/changes/<change-name>/specs/**`) expose the \"Edit\" button; base specs under `openspec/specs/` remain read-only in Vantage.
**Why**: Change-scoped specs represent in-progress amendments that are safe to mutate from the app. Base specs under `openspec/specs/` are the merged, authoritative history; keeping them read-only avoids accidental edits to already-approved specs.
**Alternatives**: Allow editing for all specs regardless of location — rejected to keep a clear separation between permanent specs and change-local work-in-progress.

### Decision: When to persist criteria invalidations
**Choice**: Criteria invalidations caused by renaming a `### Requirement:` heading are persisted only after the spec save commit succeeds (after the update API returns 200). If the save fails, validation remains unchanged.
**Why**: This keeps SQLite validation state and the git-backed spec content strictly consistent. If the commit fails, the user can retry or discard edits without entering a half-updated state.
**Alternatives**: Clear validation immediately on heading change or before the save request is sent — rejected because it can leave the UI and database out of sync with the actual spec file if the GitHub update fails.

## Data model changes

None. Spec content is authoritative in git. No SQLite changes required.

## API changes

**New route**: `PUT /api/repos/[encodedFullName]/specs/update`

Request body:
```json
{ "path": "openspec/changes/my-change/specs/feature-foo.md", "content": "<markdown string>" }
```

Response (200):
```json
{ "sha": "<commit-sha>" }
```

Errors: 401 (unauthenticated), 400 (missing path/content), 404 (file not found on GitHub), 500 (GitHub API error).

The client sends this request from `SpecDetailView` when the user confirms save, then calls the validate API to persist any criteria invalidations resulting from renamed requirement headings.

## Risks / Trade-offs

- [Concurrent edits] Two users editing the same spec file simultaneously will produce a conflict on the second save (GitHub API returns 409). → Mitigation: surface the conflict as an inline error message; instruct the user to reload and re-apply their changes. True conflict resolution is deferred per constitution.
- [TipTap markdown fidelity] Complex markdown constructs (nested lists, HTML blocks) may not round-trip perfectly through TipTap's markdown extension. → Mitigation: the spec format (`### Requirement:` / `#### Scenario:`) uses a small, predictable subset of markdown that TipTap handles reliably. Add an e2e test for a round-trip save.
- [Bundle size] TipTap adds ~40 KB gzipped to the client bundle for the spec viewer page. → Mitigation: dynamically import `SpecEditor` with `next/dynamic` so it is only loaded when the user enters edit mode.

## Open Questions

- None at this time.
