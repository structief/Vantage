# Test flows: spec-detail-view

<!-- Generated from specs/feature-spec-detail-view.md. Each flow maps to a spec scenario.
     Translated to actual test code during opsx-apply. -->

## Flow: Navigating to a spec
Type: e2e
Spec: specs/feature-spec-detail-view.md > Requirement: Spec Detail Route

Setup:
- User is authenticated via GitHub OAuth
- A repo is pinned with at least one openspec change (`test-change`) containing a spec file `feature-test.md`
- The secondary sidebar is visible and the `test-change` project group is expanded

Steps:
1. Click the spec link `feature-test` in the secondary sidebar under `test-change`
2. Observe browser URL and page content

Expected:
- Browser URL changes to `/repo/[owner]/[name]/specs/test-change/feature-test`
- The spec detail view is rendered with the spec's title, author, date, status badge, progress bar, and tab bar

## Flow: Spec not found
Type: e2e
Spec: specs/feature-spec-detail-view.md > Requirement: Spec Detail Route

Setup:
- User is authenticated via GitHub OAuth
- A repo is pinned

Steps:
1. Navigate directly to `/repo/[owner]/[name]/specs/nonexistent-change/no-such-spec`
2. Observe page content

Expected:
- The main content area displays a "Spec not found" message
- A link back to the spec list (All Specs) is visible

## Flow: Title rendered from frontmatter
Type: unit
Spec: specs/feature-spec-detail-view.md > Requirement: Spec Title Section

Setup:
- A spec markdown string with frontmatter `title: "User Registration Flow"` is provided as input

Steps:
1. Call the `extractSpecMeta(markdown)` utility with the spec string
2. Inspect the returned `title` field

Expected:
- Returned `title` equals `"User Registration Flow"`

## Flow: Title fallback to filename
Type: unit
Spec: specs/feature-spec-detail-view.md > Requirement: Spec Title Section

Setup:
- A spec markdown string with no `title` frontmatter field is provided
- The filename is `user-registration-flow`

Steps:
1. Call `extractSpecMeta(markdown, filename)` with the spec string and filename `"user-registration-flow"`
2. Inspect the returned `title` field

Expected:
- Returned `title` equals `"User Registration Flow"` (kebab-case converted to title-case)

## Flow: Creator shown from GitHub
Type: e2e
Spec: specs/feature-spec-detail-view.md > Requirement: Spec Title Section

Setup:
- User is authenticated
- A real spec file exists in the repo with at least one commit

Steps:
1. Navigate to the spec detail page for that spec
2. Inspect the title section

Expected:
- GitHub avatar image is visible in the title section
- GitHub username is displayed next to the avatar

Edge cases:
- GitHub API returns `author: null` (unlinked email) → display commit author name only, no avatar

## Flow: Last updated date shown
Type: e2e
Spec: specs/feature-spec-detail-view.md > Requirement: Spec Title Section

Setup:
- User is authenticated
- A spec file exists with a known most-recent commit date

Steps:
1. Navigate to the spec detail page
2. Inspect the title section for the date label

Expected:
- Date is displayed in the format "Updated [Month] [Day], [Year]" (e.g. "Updated Feb 28, 2026")

## Flow: Status badge placeholder
Type: e2e
Spec: specs/feature-spec-detail-view.md > Requirement: Spec Title Section

Setup:
- User is authenticated
- Any valid spec detail page is loaded

Steps:
1. Navigate to the spec detail page
2. Inspect the title section for the status badge

Expected:
- A badge labeled "Draft" is visible in the title section
- No interaction is possible on the badge

## Flow: Progress bar with partial completion
Type: unit
Spec: specs/feature-spec-detail-view.md > Requirement: Criteria Progress Bar

Setup:
- A spec markdown string containing 7 `### Requirement:` headers is provided
- Validated count is 0 (placeholder)

Steps:
1. Call `extractCriteriaCount(markdown)`
2. Render `<CriteriaProgressBar total={7} validated={0} />`
3. Inspect rendered output

Expected:
- `extractCriteriaCount` returns `7`
- Progress bar renders with label "0 of 7 criteria validated"
- Progress bar fill is 0%

## Flow: Progress bar with no criteria
Type: unit
Spec: specs/feature-spec-detail-view.md > Requirement: Criteria Progress Bar

Setup:
- A spec markdown string with no `### Requirement:` headers is provided

Steps:
1. Call `extractCriteriaCount(markdown)`
2. Render `<CriteriaProgressBar total={0} validated={0} />`

Expected:
- `extractCriteriaCount` returns `0`
- Progress bar component is not rendered (returns null)

## Flow: Progress bar with all criteria validated
Type: unit
Spec: specs/feature-spec-detail-view.md > Requirement: Criteria Progress Bar

Setup:
- total=4, validated=4

Steps:
1. Render `<CriteriaProgressBar total={4} validated={4} />`

Expected:
- Progress bar is fully filled
- Fill color uses the "completed" green treatment (e.g. `bg-green-500`)
- Label reads "4 of 4 criteria validated"

## Flow: Default tab on load
Type: e2e
Spec: specs/feature-spec-detail-view.md > Requirement: Horizontal Tab Navigation

Setup:
- User is authenticated
- A valid spec detail page is loaded

Steps:
1. Navigate to the spec detail page
2. Inspect the tab bar and content area

Expected:
- The "Overview" tab has an underline indicator
- The content area below the tab bar displays the rendered markdown body of the spec
- No other tab is underlined

## Flow: Switching tabs
Type: e2e
Spec: specs/feature-spec-detail-view.md > Requirement: Horizontal Tab Navigation

Setup:
- Spec detail page is loaded with "Overview" as the active tab

Steps:
1. Click the "Criteria" tab
2. Observe tab indicator and content area

Expected:
- "Criteria" tab gains the underline indicator
- "Overview" tab loses the underline indicator
- Content area updates to show the criteria list

## Flow: Criteria tab badge count
Type: unit
Spec: specs/feature-spec-detail-view.md > Requirement: Horizontal Tab Navigation

Setup:
- A spec markdown string with 7 `### Requirement:` headers

Steps:
1. Render `<SpecDetailView>` with the spec markdown
2. Inspect the "Criteria" tab badge

Expected:
- Badge on the "Criteria" tab displays `7`

## Flow: Markdown rendered as HTML
Type: e2e
Spec: specs/feature-spec-detail-view.md > Requirement: Overview Tab Content

Setup:
- A spec markdown string with headings, paragraphs, and a code block

Steps:
1. Navigate to the spec detail page with Overview tab active
2. Inspect the rendered HTML

Expected:
- `<h2>`, `<h3>`, `<p>`, `<ul>`, `<code>` elements are present in the DOM
- Text content matches the spec markdown body

## Flow: Frontmatter stripped from rendered output
Type: unit
Spec: specs/feature-spec-detail-view.md > Requirement: Overview Tab Content

Setup:
- A spec markdown string with YAML frontmatter block (between `---` delimiters)

Steps:
1. Call `stripFrontmatter(markdown)` on the string
2. Check the returned string

Expected:
- The returned string does not contain the `---` delimiters or any frontmatter key-value pairs
- The markdown body content is preserved

## Flow: Criteria list rendered
Type: e2e
Spec: specs/feature-spec-detail-view.md > Requirement: Criteria Tab Content

Setup:
- Spec detail page is loaded; the spec has 3 `### Requirement:` items

Steps:
1. Click the "Criteria" tab
2. Inspect the content area

Expected:
- 3 rows are rendered, each with a checkbox and the requirement name as text
- Each checkbox is read-only (not interactive)
- Each row shows "pending" validation state

## Flow: Empty criteria tab
Type: e2e
Spec: specs/feature-spec-detail-view.md > Requirement: Criteria Tab Content

Setup:
- Spec detail page is loaded; the spec has no `### Requirement:` headers

Steps:
1. Click the "Criteria" tab
2. Inspect the content area

Expected:
- Content area displays exactly "No criteria defined for this spec."

## Flow: Contracts listed
Type: e2e
Spec: specs/feature-spec-detail-view.md > Requirement: Contracts Tab Content

Setup:
- The change directory contains `contracts/api/spec-detail-view.yaml`

Steps:
1. Click the "Contracts" tab
2. Inspect the content area

Expected:
- One row is rendered with a document icon and filename `spec-detail-view.yaml`

## Flow: Empty contracts tab
Type: e2e
Spec: specs/feature-spec-detail-view.md > Requirement: Contracts Tab Content

Setup:
- The change directory has no `contracts/` folder

Steps:
1. Click the "Contracts" tab
2. Inspect the content area

Expected:
- Content area displays exactly "No contracts defined yet."

## Flow: Tests listed
Type: e2e
Spec: specs/feature-spec-detail-view.md > Requirement: Tests Tab Content

Setup:
- The change directory contains `tests/feature-spec-detail-view.flow.md`

Steps:
1. Click the "Tests" tab
2. Inspect the content area

Expected:
- One row is rendered with a document icon and filename `feature-spec-detail-view.flow.md`

## Flow: Empty tests tab
Type: e2e
Spec: specs/feature-spec-detail-view.md > Requirement: Tests Tab Content

Setup:
- The change directory has no `tests/` folder

Steps:
1. Click the "Tests" tab
2. Inspect the content area

Expected:
- Content area displays exactly "No test flows defined yet."
