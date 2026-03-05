## 1. Data model

- [x] 1.1 Merge `SpecStatusCache` model from `data-model/schema.prisma` into project `prisma/schema.prisma` — add comment referencing specs requirement
- [x] 1.2 Create and run migration for `spec_status_cache` table (e.g. `002_spec_status_cache.sql`)

## 2. Parsing and spec utils

- [x] 2.1 Add `extractRequirementState(markdown: string): { names: string[]; validatedIndices: Set<number> }` to `lib/spec-utils.ts` — parse `### [ ] Requirement: X` vs `### [x] Requirement: X` vs legacy `### Requirement: X`; return names and indices where checkbox is `[x]`
- [x] 2.2 Update `extractRequirementNames` to support new checkbox format (or deprecate in favor of extractRequirementState)
- [x] 2.3 Add `toggleRequirementCheckbox(markdown: string, requirementIndex: number, validated: boolean): string` — finds Nth requirement heading, toggles `[ ]` ↔ `[x]`, returns modified markdown

## 3. GitHub helpers

- [x] 3.1 Add `updateSpecFile(token: string, owner: string, repo: string, path: string, content: string, message: string): Promise<{ sha: string } | null>` to `lib/github-spec.ts` — calls `octokit.rest.repos.createOrUpdateFileContents`; returns sha on success; returns null or throws on failure

## 4. API routes

- [x] 4.1 Create `app/api/repos/[encodedFullName]/specs/statuses/route.ts` — GET handler; get specs list (filter non-archived); for each spec, check SpecStatusCache (TTL 15 min); if stale/missing, fetch from GitHub, parse, upsert cache; return `{ statuses: Record<specPath, status> }`
- [x] 4.2 Create `app/api/repos/[encodedFullName]/specs/validate/route.ts` — POST handler; validate body (path, requirementIndex, validated); fetch spec content; call `toggleRequirementCheckbox`; call `updateSpecFile`; on success, derive status and upsert SpecStatusCache; return `{ status }`; handle 400/401/404/422 errors

## 5. Spec detail page and components

- [x] 5.1 In `app/(shell)/repo/[owner]/[name]/specs/[...specPath]/page.tsx`: after fetching spec markdown, call `extractRequirementState` to get `initialValidatedIndices`; pass to `SpecDetailView`
- [x] 5.2 On spec load (server): after parse, upsert SpecStatusCache with derived status for this spec (so sidebar and future loads use cache)
- [x] 5.3 Update `SpecDetailView`: accept `initialValidatedIndices: Set<number>` prop; initialise `validatedIndices` from it instead of empty Set
- [x] 5.4 Update `SpecDetailView` `handleToggle`: call POST `/api/repos/.../specs/validate` with path, requirementIndex, validated; on success, update local state; on error, revert and show error toast/message
- [x] 5.5 Pass `repoFullName` and `specPath` to `SpecDetailView` so it can call validate API (or derive from route/params)

## 6. Sidebar status loading

- [x] 6.1 Update `SecondarySidebar` (or provider): on mount/expand, fetch `GET /api/repos/.../specs/statuses`; populate SpecStatusContext with statuses keyed by spec path (or slug where unique)
- [x] 6.2 Update `SpecStatusContext` / `SpecStatusProvider`: support preloading status map from API (path → status); `getStatus(slug | path)` returns cached value or "Draft"
- [x] 6.3 Ensure `SpecDetailView` still calls `updateSpecStatus(slug, status)` so visited specs override any stale cache
- [x] 6.4 Add TTL constant (e.g. 15 min) — config or env; use in statuses route and cache check

## 7. Tests

- [x] 7.1 Translate `tests/feature-criteria-validation-persist-spec.flow.md` parsing flows (Parsing validated/unvalidated/legacy) → `tests/unit/spec-utils.test.ts` — `extractRequirementState` with `[x]`, `[ ]`, legacy
- [x] 7.2 Translate `tests/feature-criteria-validation-persist-spec.flow.md` contract flows (Commit on validate/unvalidate, failure handling) → `tests/contract/spec-validate.contract.test.ts` or similar
- [x] 7.3 Translate `tests/feature-criteria-validation-persist-spec.flow.md` cache flows (Sidebar uses cache, cache refreshed on toggle/load, stale triggers re-fetch) → `tests/contract/spec-statuses.contract.test.ts`
- [x] 7.4 Translate `tests/feature-criteria-validation-persist-spec.flow.md` e2e flows (Initial state, progress bar, sidebar dots, archived spec behavior) → `tests/e2e/criteria-validation-persist.e2e.ts`
