## Context

Criteria validation state is currently stored only in client-side React state (`validatedIndices` in `SpecDetailView`). Toggling a checkbox updates UI state but does not persist to the spec file. On reload or when another user views the spec, all criteria appear unchecked.

The constitution states: "Git is the single source of truth" and "every user action that changes spec content MUST result in a traceable git commit". Persisting validation to the spec file aligns with this.

Current flow:
- `SpecDetailPage` (server) fetches spec markdown via `fetchSpecFileContent`; does not parse validation state
- `SpecDetailView` initialises `validatedIndices` as empty `Set`
- `CriteriaTab` receives `validatedIndices` and `onToggle`; toggling only updates local state
- `CriteriaProgressBar`, `SpecTitleSection`, and `SpecStatusContext` derive from that local state
- `SecondarySidebar` uses `useSpecStatus().getStatus(slug)` for the dot; status is only set when a spec is visited (via `updateSpecStatus` in `SpecDetailView`)

## Goals / Non-Goals

**Goals:**
- Persist criterion validation to the spec `.md` file so it survives reloads and is shared across users
- Create a git commit with a descriptive message on each toggle
- Parse validation state from the spec when loading; pass it to the Criteria tab, progress bar, status badge, and sidebar dot
- Ensure progress bar, spec status, and sidebar dot reflect persisted state

**Non-Goals:**
- Parsing archived specs on initial load (parse only when user loads one)
- Real-time collaboration or conflict resolution beyond git (last write wins)
- Validation history or audit trail beyond git log

## Decisions

### Decision: Inline checkbox `[ ]` / `[x]` before requirement name
**Choice**: Use `### [ ] Requirement: <name>` for unvalidated and `### [x] Requirement: <name>` for validated. Parse and update the checkbox in the heading line.

**Why**: State is visible in the raw .md; anyone reading the file sees validation at a glance. The checkbox travels with the requirement when the spec is reordered or edited—no separate array to keep in sync. Standard GitHub-style task list syntax; familiar to users. Legacy headings without a checkbox are treated as `[ ]`.

**Alternatives**: Frontmatter `validated: ["A","B"]` — requires a separate structure that can desync when requirements change. Inline suffix `### Requirement: Foo [validated]` — less standard, more parsing edge cases.

### Decision: API route to update spec file and commit
**Choice**: Add `POST /api/repos/[encodedFullName]/specs/validate` (or similar) that accepts `{ path, requirementIndex, validated: boolean }`, fetches the current file, finds the Nth `### Requirement:` heading, toggles `[ ]` ↔ `[x]`, and calls Octokit `repos.createOrUpdateFileContents`.

**Why**: Client cannot commit to GitHub directly; a server action with the user's token is required. Using index is sufficient because we only update one line; the full content ensures we target the correct heading.

**Alternatives**: Pass requirement name instead of index — viable; index avoids string-matching edge cases when names contain special chars.

### Decision: Parse checkbox state per requirement heading
**Choice**: Update `extractRequirementNames` (or add `extractRequirementState`) to parse `### [ ] Requirement: X` vs `### [x] Requirement: X` and return both names and validated indices. Build `Set<number>` for indices where checkbox is `[x]`. Pass as `validatedIndices` to `CriteriaTab`.

**Why**: `CriteriaTab` and progress logic already expect `validatedIndices: Set<number>`; minimal refactor. Single parse pass yields both names and validation state.

### Decision: Server-side parsing and passing initial state
**Choice**: In `SpecDetailPage`, after fetching the spec markdown, parse requirement headings for `[ ]` vs `[x]`, build `initialValidatedIndices`, and pass to `SpecDetailView`. `SpecDetailView` initialises `validatedIndices` from this prop.

**Why**: Single source of truth at load; no flash of wrong state. Client still handles optimistic updates and revert on error.

### Decision: DB cache for spec status with TTL + invalidation on write/load
**Choice**: Add `SpecStatusCache` table: `(repoFullName, specPath)` as composite key, `status` (Draft | In review | Reviewed), `fetchedAt` timestamp. Use cache when `fetchedAt` is within TTL (e.g. 15 min). Invalidate/update: (a) on criterion toggle success — upsert new status; (b) on spec load — re-parse and upsert; (c) when stale — re-fetch from GitHub, parse, upsert.

**Why**: Avoids N GitHub API calls on every sidebar expand; sidebar load becomes fast after first populate. TTL limits staleness from external commits. Invalidation on known writes (toggle, load) keeps cache accurate for user actions.

**Alternatives**: No cache — too many API calls. Cache forever — too stale. Webhooks for invalidation — out of scope; TTL + write invalidation is sufficient.

### Decision: Parse only non-archived specs for sidebar; lazy-parse archived on load
**Choice**: When the sidebar requests statuses, only fetch/parse specs with `status: "active"`. Archived specs show default Draft until the user loads one; on load, parse and upsert cache so the dot updates.

**Why**: Reduces initial load; archived changes are rarely viewed; parsing on load is acceptable.

## Data model changes

### New: `SpecStatusCache`

```prisma
model SpecStatusCache {
  repoFullName String
  specPath     String
  status       String   // "Draft" | "In review" | "Reviewed"
  fetchedAt    DateTime

  @@id([repoFullName, specPath])
  @@map("spec_status_cache")
}
```

- `specPath`: e.g. `openspec/changes/my-change/specs/feature-foo.md`
- `fetchedAt`: used for TTL check (stale if older than 15 min)

## API changes

### New: `GET /api/repos/[encodedFullName]/specs/statuses`

**Query**: None. Returns status for all non-archived specs in the repo.

**Behaviour**: Get specs list (filter `status !== "archived"`). For each spec, check `SpecStatusCache`; if fresh (within TTL), use cached status. If stale or missing, fetch spec content from GitHub, parse checkbox state, derive status, upsert cache, return. Respond with `{ statuses: { [specPath]: "Draft" | "In review" | "Reviewed" } }` keyed by path or slug for client lookup.

**Auth**: Same as existing repos API.

### New: `POST /api/repos/[encodedFullName]/specs/validate`

**Request body**:
```json
{
  "path": "openspec/changes/<changePath>/specs/<filename>.md",
  "requirementIndex": 0,
  "validated": true
}
```

**Behaviour**: Fetch file via `getContent`; find the Nth requirement heading (matching `### [ ] Requirement:` or `### [x] Requirement:`); toggle `[ ]` ↔ `[x]` in that line; call `octokit.rest.repos.createOrUpdateFileContents` with commit message e.g. `Validate: <name>` or `Unvalidate: <name>`. On success, upsert `SpecStatusCache` with the new derived status.

**Response**: 200 on success; 4xx/5xx with error message on failure.

**Auth**: Same as existing repos API — session with `accessToken`.

## Risks / Trade-offs

- [Last-write-wins]: Concurrent edits to the same spec can overwrite each other. Mitigation: GitHub will return 422 if `sha` is stale; we can retry with refetched content or surface a clear error.
- [Merge conflicts on same requirement]: If two users toggle the same requirement concurrently, git merge may conflict. Mitigation: Same as last-write-wins; user resolves conflict and re-toggles if needed.
- [Archived specs show Draft until loaded]: Archived specs are not pre-parsed. Mitigation: Parse and cache on first load; dot updates for that spec from then on (until TTL).

## Open Questions

- TTL value: 15 minutes default — tune based on usage.
- Commit message format: "Validate: X" / "Unvalidate: X" — confirm with team or leave as-is.
