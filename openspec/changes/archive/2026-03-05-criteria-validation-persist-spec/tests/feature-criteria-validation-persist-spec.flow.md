# Test flows: criteria validation persist spec

<!-- Generated from specs/feature-criteria-validation-persist-spec.md. Each flow maps to a spec scenario.
     Translated to actual test code during opsx-apply. See contracts/api/spec-validation.yaml -->

## Flow: Parsing validated state from checkbox
Type: unit
Spec: specs/feature-criteria-validation-persist-spec.md > Requirement: Inline Checkbox for Validation State in Spec Markdown

Setup:
- Spec markdown contains `### [x] Requirement: Foo`

Steps:
1. Parse the spec with extractRequirementState (or equivalent)
2. Look up requirement at index of "Foo"

Expected:
- The Criteria tab / parsed state shows "Foo" as validated (checkbox checked)

Edge cases:
- `### [x] Requirement: Foo` with extra spaces → still parsed as validated

---

## Flow: Parsing unvalidated state from checkbox
Type: unit
Spec: specs/feature-criteria-validation-persist-spec.md > Requirement: Inline Checkbox for Validation State in Spec Markdown

Setup:
- Spec markdown contains `### [ ] Requirement: Foo`

Steps:
1. Parse the spec with extractRequirementState
2. Look up requirement at index of "Foo"

Expected:
- The Criteria tab / parsed state shows "Foo" as unvalidated (checkbox unchecked)

Edge cases:
- `### [ ] Requirement: Foo` (space in [ ]) → parsed as unvalidated

---

## Flow: Legacy heading without checkbox
Type: unit
Spec: specs/feature-criteria-validation-persist-spec.md > Requirement: Inline Checkbox for Validation State in Spec Markdown

Setup:
- Spec markdown contains `### Requirement: Foo` (no [ ] or [x] prefix)

Steps:
1. Parse the spec with extractRequirementState

Expected:
- The requirement is treated as unvalidated; Criteria tab shows it unchecked

Edge cases:
- `### Requirement:` with no name → edge case for parser, skip or treat as unvalidated

---

## Flow: Commit on validate
Type: contract
Spec: specs/feature-criteria-validation-persist-spec.md > Requirement: Toggle Criteria Commits to Spec File

Setup:
- Authenticated session with GitHub token
- Spec file exists at path with `### [ ] Requirement: Foo` at index 0
- See contracts/api/spec-validation.yaml

Steps:
1. Call POST /api/repos/{encodedFullName}/specs/validate with body { path, requirementIndex: 0, validated: true }
2. Assert 200 response

Expected:
- Response contains derived status (Draft | In review | Reviewed)
- Spec file in repo has `### [x] Requirement: Foo` (verified via refetch or mock)
- Git commit exists with message like "Validate: Foo"

Edge cases:
- requirementIndex out of range → 400

---

## Flow: Commit on unvalidate
Type: contract
Spec: specs/feature-criteria-validation-persist-spec.md > Requirement: Toggle Criteria Commits to Spec File

Setup:
- Authenticated session
- Spec file exists with `### [x] Requirement: Foo` at index 0

Steps:
1. Call POST /api/repos/{encodedFullName}/specs/validate with body { path, requirementIndex: 0, validated: false }
2. Assert 200 response

Expected:
- Response contains derived status
- Spec file has `### [ ] Requirement: Foo`
- Git commit with message like "Unvalidate: Foo"

---

## Flow: Commit failure handling
Type: contract
Spec: specs/feature-criteria-validation-persist-spec.md > Requirement: Toggle Criteria Commits to Spec File

Setup:
- GitHub API configured to fail (e.g. 422 conflict, network error, or insufficient permissions)

Steps:
1. Call POST /api/repos/{encodedFullName}/specs/validate with valid payload
2. Observe response

Expected:
- Response is 4xx or 5xx with error message
- Spec file is NOT modified
- Client receives error; criterion reverts to previous state (e2e concern)

---

## Flow: Initial state from parsed spec
Type: e2e
Spec: specs/feature-criteria-validation-persist-spec.md > Requirement: Server-Side Parsing of Validation State

Setup:
- Spec file with mix of [ ] and [x] requirements
- User navigates to spec detail page

Steps:
1. Load spec detail page
2. Inspect Criteria tab, progress bar, status badge, sidebar dot

Expected:
- Criteria tab shows correct checked/unchecked state per parsed checkboxes
- Progress bar reflects validated count
- Status badge shows Draft | In review | Reviewed accordingly
- Sidebar dot matches status (gray / amber / green)

---

## Flow: Progress bar reflects persisted state
Type: e2e
Spec: specs/feature-criteria-validation-persist-spec.md > Requirement: Server-Side Parsing of Validation State

Setup:
- Spec file with 3 requirements; 2 have [x], 1 has [ ]

Steps:
1. Navigate to spec detail page
2. Inspect progress bar

Expected:
- Progress bar shows "2 of 3 criteria validated" with proportional fill

---

## Flow: Spec status and sidebar dot from persisted state
Type: e2e
Spec: specs/feature-criteria-validation-persist-spec.md > Requirement: Server-Side Parsing of Validation State

Setup:
- Spec with all requirements validated ([x])
- User has not visited this spec in current session

Steps:
1. Ensure sidebar fetches statuses (from GET /specs/statuses or via spec load)
2. Navigate to spec
3. Inspect status badge and sidebar dot

Expected:
- Status badge shows "Reviewed"
- Sidebar dot is green

---

## Flow: Non-archived specs show correct dot in sidebar
Type: e2e
Spec: specs/feature-criteria-validation-persist-spec.md > Requirement: Sidebar Status for Non-Archived Specs

Setup:
- Repo has non-archived specs with varying validation states (some Draft, some In review, some Reviewed)
- Statuses API returns correct status per spec (from cache or GitHub)
- User has sidebar expanded with project open

Steps:
1. View secondary sidebar with project expanded
2. Inspect dots next to each non-archived spec

Expected:
- Each non-archived spec displays status dot: gray (Draft), amber (In review), green (Reviewed)

---

## Flow: Archived spec dot on first render
Type: e2e
Spec: specs/feature-criteria-validation-persist-spec.md > Requirement: Sidebar Status for Non-Archived Specs

Setup:
- Repo has archived specs (under openspec/changes/archive/)
- Statuses API does NOT include archived specs
- User has not loaded any archived spec

Steps:
1. Expand archive group in sidebar (if present)
2. Inspect dots next to archived specs

Expected:
- Archived specs display default Draft dot (gray)

---

## Flow: Archived spec status after load
Type: e2e
Spec: specs/feature-criteria-validation-persist-spec.md > Requirement: Sidebar Status for Non-Archived Specs

Setup:
- Archived spec exists with 2 of 3 requirements validated
- User has not loaded it yet (sidebar shows Draft)

Steps:
1. Click archived spec to load it
2. Wait for page load
3. Inspect sidebar dot for that spec

Expected:
- After load, sidebar dot for that spec updates to amber (In review)
- Status persists for session (or until TTL)

---

## Flow: Sidebar uses cached status when fresh
Type: contract
Spec: specs/feature-criteria-validation-persist-spec.md > Requirement: Spec Status Cache in Database

Setup:
- SpecStatusCache has entry for (repoFullName, specPath) with status "In review" and fetchedAt within TTL (e.g. < 15 min ago)

Steps:
1. Call GET /api/repos/{encodedFullName}/specs/statuses
2. Assert response includes status for that spec

Expected:
- Response returns cached "In review" without fetching from GitHub
- No GitHub API call for that spec (verify via mock or spy)

---

## Flow: Cache refreshed on toggle
Type: contract
Spec: specs/feature-criteria-validation-persist-spec.md > Requirement: Spec Status Cache in Database

Setup:
- Spec has 2 of 3 validated; cache may or may not have entry
- Toggle succeeds (POST validate returns 200)

Steps:
1. Call POST /api/repos/{encodedFullName}/specs/validate to validate the third criterion
2. Query SpecStatusCache for (repoFullName, specPath)

Expected:
- Cache contains entry with status "Reviewed" and updated fetchedAt

---

## Flow: Cache refreshed on spec load
Type: e2e
Spec: specs/feature-criteria-validation-persist-spec.md > Requirement: Spec Status Cache in Database

Setup:
- Spec file has partial validation
- Cache may be stale or empty

Steps:
1. Load spec detail page (triggers server-side fetch and parse)
2. Query SpecStatusCache for that spec

Expected:
- Cache has upserted entry with correct status and fetchedAt

---

## Flow: Stale cache triggers re-fetch
Type: contract
Spec: specs/feature-criteria-validation-persist-spec.md > Requirement: Spec Status Cache in Database

Setup:
- SpecStatusCache has entry with fetchedAt older than TTL (e.g. > 15 min)
- Spec file on GitHub has different state (e.g. externally updated)

Steps:
1. Call GET /api/repos/{encodedFullName}/specs/statuses
2. Assert response for that spec

Expected:
- Response reflects freshly fetched/parsed status from GitHub, not stale cache
- Cache is updated with new status and fetchedAt
