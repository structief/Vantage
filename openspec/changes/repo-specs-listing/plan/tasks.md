## 1. API — Specs listing endpoint

- [ ] 1.1 Create `app/api/repos/[encodedFullName]/specs/route.ts` — GET handler that scans `openspec/changes/` (and one level of subdirectories) via Octokit, returns `{ specs: SpecEntry[] }` with correct `group`, `status`, and `path` per entry; active-ungrouped first, named groups alphabetically, archived last
- [ ] 1.2 Handle missing `openspec/changes/` (GitHub 404) → return `{ specs: [] }` with 200
- [ ] 1.3 Handle unauthenticated requests → 401; invalid `encodedFullName` (no `/` after decode) → 400

## 2. API — Spec content endpoint

- [ ] 2.1 Create `app/api/repos/[encodedFullName]/spec-content/route.ts` — GET handler that reads a single file by `?path=` query param via Octokit and returns `{ content: string }`
- [ ] 2.2 Handle missing `path` query param → 400 `{ "error": "Missing path parameter" }`
- [ ] 2.3 Handle file not found (GitHub 404) → 404 `{ "error": "File not found" }`
- [ ] 2.4 Handle unauthenticated requests → 401

## 3. Client component — Specs list

- [ ] 3.1 Create `components/SpecsListClient.tsx` — `"use client"` component that fetches `/api/repos/.../specs` on mount, renders grouped list with section headings, doc icons, and slugs; shows skeleton while loading and "No specs found in this repository." when empty
- [ ] 3.2 Implement grouping render logic: ungrouped active specs (no heading), named-group sections (heading = group name, title-cased), "Archived" section (group `"archive"` → heading "Archived", items visually subdued)
- [ ] 3.3 Each spec item is a Next.js `<Link>` to `/repo/[owner]/[name]/specs/[slug]`; detect active item via `usePathname()` and apply filled-background-pill highlight matching the nav link active style
- [ ] 3.4 Reuse `DocIcon` SVG (currently inlined in `SecondarySidebar.tsx`) — extract to `components/icons/DocIcon.tsx` and update `SecondarySidebar.tsx` import

## 4. Pages

- [ ] 4.1 Replace stub `app/(shell)/repo/[owner]/[name]/specs/page.tsx` with a server component that extracts `owner`/`name` from params and renders `<SpecsListClient owner={owner} name={name} />`
- [ ] 4.2 Create `app/(shell)/repo/[owner]/[name]/specs/[slug]/page.tsx` — server component that reads `owner`, `name`, `slug` from params; fetches `/api/repos/.../spec-content?path=<path>` server-side; extracts title from first `# Heading` line (fallback: slug); renders slug and title prominently

## 5. Tests

- [ ] 5.1 Translate contract flows from `tests/feature-repo-specs-listing.flow.md` → `tests/contract/repo-specs-listing.contract.test.ts` covering: GET /specs 200 with grouped data, GET /specs 200 empty (no openspec dir), GET /specs 401 unauthenticated, GET /spec-content 200 with file content, GET /spec-content 404 file not found, GET /spec-content 400 missing path, GET /spec-content 401 unauthenticated
- [ ] 5.2 Translate e2e flows from `tests/feature-repo-specs-listing.flow.md` → `tests/e2e/repo-specs-listing.e2e.test.ts` covering: spec listing renders with doc icons and slugs, grouping by subdirectory, archived group visual distinction, empty repo message, skeleton loading state, spec selection navigates to detail page with slug + title, active item highlighted in list
