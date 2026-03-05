# Test flows: tests-visualisation

<!-- Generated from specs/feature-tests-visualisation.md. Each flow maps to a spec scenario.
     Translated to actual test code during opsx-apply. -->

## Flow: Test suites grouped by type
Type: e2e
Spec: specs/feature-tests-visualisation.md > Requirement: Tests Tab Structured Visualisation

Setup:
- User is authenticated via GitHub OAuth
- A repo is pinned with a change containing at least one .flow.md file in tests/
- The flow file has flows with Type: unit and Type: e2e (or contract)

Steps:
1. Navigate to the spec detail page for a spec in that change
2. Click the "Tests" tab
3. Inspect the content area for section headings

Expected:
- Flows are grouped into sections by flow Type (unit, contract, e2e)
- Each section has a heading derived from the type (e.g. "Unit Tests", "E2E Tests")
- Sections appear in document order or by type order (unit, contract, e2e)

Edge cases:
- Single flow file with mixed types → multiple sections rendered
- Flow file parse failure → show "Could not parse flow file" for that file, do not crash

## Flow: Individual test cases listed
Type: e2e
Spec: specs/feature-tests-visualisation.md > Requirement: Tests Tab Structured Visualisation

Setup:
- Tests tab is active with parsed flow files containing flows

Steps:
1. Inspect each test suite section
2. Verify each flow is rendered as a test case row

Expected:
- Each flow displays as TC-1, TC-2, … (sequential within section)
- Title matches the flow name (from ## Flow: line)
- Description is the first Expected item or Steps summary
- Test cases appear in document order within each section

## Flow: Deployment runs section with last results
Type: e2e
Spec: specs/feature-tests-visualisation.md > Requirement: Tests Tab Structured Visualisation

Setup:
- User is authenticated
- TestRun records exist for the current repo + changePath + specSlug
- At least one run has passedCount=4, failedCount=0; another has passedCount=3, failedCount=1

Steps:
1. Navigate to the spec detail page
2. Click the "Tests" tab
3. Inspect the DEPLOYMENT RUNS section

Expected:
- "DEPLOYMENT RUNS" heading is visible
- Each run shows version, environment, date, pass/fail summary, and source (e.g. "by ci-pipeline")
- Runs are ordered by date descending (most recent first)
- "All passed" uses green styling
- Failure count (e.g. "1 failed") uses red styling
- Optional arrow or link for drill-down when detailsUrl is present

## Flow: Empty tests tab
Type: e2e
Spec: specs/feature-tests-visualisation.md > Requirement: Tests Tab Structured Visualisation

Setup:
- User is authenticated
- The change directory has no tests/ folder or tests/ is empty (no .flow.md files)

Steps:
1. Navigate to the spec detail page for a spec in that change
2. Click the "Tests" tab
3. Inspect the content area

Expected:
- Content area displays exactly "No test flows defined yet."

## Flow: Tab badge reflects test group count
Type: e2e
Spec: specs/feature-tests-visualisation.md > Requirement: Tests Tab Structured Visualisation

Setup:
- A change has flow files with flows grouped into 2 distinct types (e.g. unit + e2e)

Steps:
1. Navigate to the spec detail page
2. Inspect the Tests tab badge

Expected:
- Badge displays "2" (count of distinct test groups/sections)
- Badge is omitted when no test flows exist

## Flow: UI alignment with Vantage design system
Type: e2e
Spec: specs/feature-tests-visualisation.md > Requirement: Tests Tab Structured Visualisation

Setup:
- Tests tab is active with test content and optional deployment runs

Steps:
1. Inspect typography, spacing, colors, and layout
2. Compare with constitution (metadata ~11–12px, body ~13–14px, headings ~16–20px)

Expected:
- Typography follows constitution scale
- Backgrounds use near-white and white surfaces; borders are subtle
- Spacing uses 16–24px padding units
- Test suites as sections; test cases as rows with TC-ID and description
- Deployment runs as compact run cards with status pill (green/red)
- Status colors: green for passed, red for failures

## Flow: Deployment runs absent
Type: e2e
Spec: specs/feature-tests-visualisation.md > Requirement: Tests Tab Structured Visualisation

Setup:
- User is authenticated
- No TestRun records exist for the current repo + changePath + specSlug
- At least one .flow.md file exists so test suites are shown

Steps:
1. Navigate to the spec detail page
2. Click the "Tests" tab
3. Inspect the content area

Expected:
- DEPLOYMENT RUNS section is not displayed
- Only test suite sections and test cases are shown

## Flow: Record test run API
Type: contract
Spec: specs/feature-tests-visualisation.md > Requirement: Tests Tab Structured Visualisation
See: contracts/api/test-runs.yaml

Setup:
- User is authenticated
- Valid encodedFullName for a pinned repo

Steps:
1. Call POST /api/repos/{encodedFullName}/test-runs with body: { changePath, specSlug, passedCount, failedCount }
2. Inspect response status and body

Expected:
- 200 response with { id } of created TestRun
- TestRun record is persisted in database with correct fields
- 401 when not authenticated
- 400 when required fields (changePath, specSlug, passedCount, failedCount) are missing
