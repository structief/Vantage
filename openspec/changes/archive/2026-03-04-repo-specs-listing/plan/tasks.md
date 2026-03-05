## 1. API — Specs listing endpoint

- [x] 1.1 Create `app/api/repos/[encodedFullName]/specs/route.ts` — GET handler that scans `openspec/changes/` (and one level of subdirectories) via Octokit, returns `{ specs: SpecEntry[] }` with correct `group`, `status`, and `path` per entry; active-ungrouped first, named groups alphabetically, archived last
- [x] 1.2 Handle missing `openspec/changes/` (GitHub 404) → return `{ specs: [] }` with 200
- [x] 1.3 Handle unauthenticated requests → 401; invalid `encodedFullName` (no `/` after decode) → 400

## 2. API — Spec content endpoint

- [x] 2.1 Create `app/api/repos/[encodedFullName]/spec-content/route.ts` — GET handler that reads a single file by `?path=` query param via Octokit and returns `{ content: string }`
- [x] 2.2 Handle missing `path` query param → 400 `{ "error": "Missing path parameter" }`
- [x] 2.3 Handle file not found (GitHub 404) → 404 `{ "error": "File not found" }`
- [x] 2.4 Handle unauthenticated requests → 401

## 3. Shared infrastructure

- [x] 3.1 Create `lib/repo-specs.ts` with `getSpecsListing`, `getSpecContent`, and `extractTitle` helpers shared across API routes and the detail page server component
- [x] 3.2 Extract `DocIcon` SVG from `SecondarySidebar.tsx` to `components/icons/DocIcon.tsx` and update import

## 4. Pages

- [x] 4.1 Update `app/(shell)/repo/[owner]/[name]/specs/page.tsx` — simple server component with a "Select a spec from the sidebar" prompt (spec listing is in the secondary sidebar)
- [x] 4.2 Create `app/(shell)/repo/[owner]/[name]/specs/[slug]/page.tsx` — server component that calls `getSpecsListing` to find the entry for `slug`, calls `getSpecContent` to fetch raw content, extracts title from first `# Heading` line (fallback: slug), renders slug and title prominently; shows "Spec not found." when no matching entry exists

## 5. Tests

- [x] 5.1 Translate contract flows from `tests/feature-repo-specs-listing.flow.md` → `tests/contract/repo-specs-listing.contract.test.ts` covering: GET /specs 200 with grouped data, GET /specs 200 empty (no openspec dir), GET /specs 401 unauthenticated, GET /specs 400 invalid name, GET /spec-content 200 with file content, GET /spec-content 404 file not found, GET /spec-content 400 missing path, GET /spec-content 401 unauthenticated
- [x] 5.2 Translate e2e flows from `tests/feature-repo-specs-listing.flow.md` → `tests/e2e/repo-specs-listing.e2e.test.ts` covering: clicking a spec in the sidebar navigates to detail page with slug + title, spec with no # heading shows slug as title, nonexistent slug shows "Spec not found."
