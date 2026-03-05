# Test flows: secondary-sidebar-nav

<!-- Generated from specs/secondary-sidebar-nav/spec.md. Covers the delta scenarios added
     by the spec-status-dot-sidebar change. Translated to actual test code during opsx-apply. -->

## Flow: Feature prefix stripped from spec display label
Type: unit
Spec: specs/secondary-sidebar-nav/spec.md > Requirement: Projects Section

Setup:
- SpecFileList receives a `specs` array containing an entry with `slug: "feature-add-auth"` and `path: "openspec/changes/my-project/specs/feature-add-auth.md"`
- `repoBase` is set to `/repo/owner/name`
- `pathname` does not match the spec's href (spec is not active)

Steps:
1. Render `SpecFileList` with the above props
2. Inspect the rendered text content of the spec list item

Expected:
- The rendered label text SHALL be `"add-auth"` (prefix `feature-` stripped)
- The `href` used for navigation SHALL still be derived from the full slug `"feature-add-auth"` (routing is unaffected)
- No label text starting with `"feature-"` SHALL be visible in the rendered output

Edge cases:
- Slug without `feature-` prefix (e.g. `"add-auth"`) → label renders as-is: `"add-auth"`
- Slug of exactly `"feature-"` (empty remainder) → label renders as empty string (no visible text)
- Slug with `"feature-"` appearing mid-string (e.g. `"my-feature-foo"`) → label renders unchanged: `"my-feature-foo"` (only leading prefix is stripped)


## Flow: Default dot state for unvisited spec
Type: unit
Spec: specs/secondary-sidebar-nav/spec.md > Requirement: Spec Status Dot in Sidebar

Setup:
- `SpecStatusContext` is freshly initialised (no prior `updateSpecStatus` calls)
- `SpecFileList` is rendered with one spec entry: `{ slug: "add-auth", path: "..." }`

Steps:
1. Render `SpecFileList` wrapped in `SpecStatusProvider`
2. Inspect the status dot rendered next to `"add-auth"`

Expected:
- A dot element SHALL be present immediately before the spec label
- The dot SHALL carry the CSS class `bg-gray-400` (Draft color)
- No amber or green class SHALL be present on the dot


## Flow: Dot reflects in-review status
Type: unit
Spec: specs/secondary-sidebar-nav/spec.md > Requirement: Spec Status Dot in Sidebar

Setup:
- `SpecStatusProvider` wraps both `SpecDetailView` and `SpecFileList`
- Spec `"add-auth"` has 3 criteria (total); `validatedIndices` starts empty

Steps:
1. Render `SpecDetailView` for `"add-auth"` inside the provider
2. Toggle one criterion (index 0) to validated — `validatedIndices` becomes `{0}`
3. `deriveStatus(1, 3)` returns `"In review"`; `SpecDetailView` calls `updateSpecStatus("add-auth", "In review")`
4. Inspect the dot next to `"add-auth"` in `SpecFileList` (rendered from the same provider)

Expected:
- The dot SHALL carry the CSS class `bg-amber-400`
- The class `bg-gray-400` SHALL no longer be present on that dot
- The update SHALL be reflected without a page reload or network request


## Flow: Dot reflects reviewed status
Type: unit
Spec: specs/secondary-sidebar-nav/spec.md > Requirement: Spec Status Dot in Sidebar

Setup:
- `SpecStatusProvider` wraps both `SpecDetailView` and `SpecFileList`
- Spec `"add-auth"` has 2 criteria; `validatedIndices` starts as `{0}` (In review)

Steps:
1. Toggle the remaining criterion (index 1) to validated — `validatedIndices` becomes `{0, 1}`
2. `deriveStatus(2, 2)` returns `"Reviewed"`; `SpecDetailView` calls `updateSpecStatus("add-auth", "Reviewed")`
3. Inspect the dot next to `"add-auth"` in `SpecFileList`

Expected:
- The dot SHALL carry the CSS class `bg-green-500`
- Neither `bg-gray-400` nor `bg-amber-400` SHALL be present on that dot


## Flow: Dot reverts when criteria are unvalidated
Type: unit
Spec: specs/secondary-sidebar-nav/spec.md > Requirement: Spec Status Dot in Sidebar

Setup:
- `SpecStatusProvider` wraps both consumers
- Spec `"add-auth"` has 2 criteria; both are validated (`validatedIndices = {0, 1}`, status = Reviewed)

Steps:
1. Unvalidate criterion 1 → `validatedIndices` becomes `{0}`
2. `deriveStatus(1, 2)` returns `"In review"`; `updateSpecStatus("add-auth", "In review")` is called
3. Inspect the dot in the sidebar

Expected:
- The dot SHALL change to `bg-amber-400` (In review)
- `bg-green-500` SHALL no longer be present

Steps (second regression):
1. Unvalidate criterion 0 → `validatedIndices` becomes empty
2. `deriveStatus(0, 2)` returns `"Draft"`; `updateSpecStatus("add-auth", "Draft")` is called
3. Inspect the dot

Expected:
- The dot SHALL change back to `bg-gray-400` (Draft)


## Flow: Dot persists across sidebar spec list navigations
Type: e2e
Spec: specs/secondary-sidebar-nav/spec.md > Requirement: Spec Status Dot in Sidebar

Setup:
- Repo has two specs: `"add-auth"` and `"user-profile"`; both start as Draft (gray dots)
- Browser is on the `"add-auth"` spec detail page
- The secondary sidebar is in expanded mode with both specs visible in the project list

Steps:
1. Validate one criterion for `"add-auth"` → status becomes `"In review"` → dot next to `"add-auth"` turns amber
2. Click `"user-profile"` in the sidebar to navigate to that spec's detail page
3. Inspect the dot next to `"add-auth"` in the sidebar (now not the active spec)
4. Inspect the dot next to `"user-profile"` (now the active spec, no criteria validated)

Expected:
- `"add-auth"` dot SHALL remain `bg-amber-400` after navigating away
- `"user-profile"` dot SHALL be `bg-gray-400` (Draft — not yet opened/validated in this session)
- Both dots SHALL be visible simultaneously in the sidebar list
