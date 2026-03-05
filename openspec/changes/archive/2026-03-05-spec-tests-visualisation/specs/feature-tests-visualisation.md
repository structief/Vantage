## ADDED Requirements

### [x] Requirement: Tests Tab Structured Visualisation

The spec detail view SHALL replace the current Tests tab (simple file list) with a structured visualisation that groups test cases by type, displays individual test case descriptions, and surfaces the last deployment run results — aligned with the Tests spec view UX.

#### Scenario: Test suites grouped by type

- **WHEN** the "Tests" tab is active and the spec's change directory contains one or more `.flow.md` files in `tests/`
- **THEN** each test flow file SHALL be parsed and flows SHALL be grouped into sections by flow `Type` (unit, contract, e2e)
- **AND** each section SHALL display a heading derived from the type (e.g. "Registration Unit Tests", "OAuth Integration Tests") and a short description when available
- **AND** flows of the same type from the same or multiple flow files MAY be grouped into one section per type

#### Scenario: Individual test cases listed

- **WHEN** a test suite section is rendered
- **THEN** each flow within that section SHALL be displayed as a test case with: a sequential identifier (TC-1, TC-2, …), the flow name as the title, and the first Expected item (or Steps summary) as the description/assertion
- **AND** test cases SHALL appear in document order within each section

#### Scenario: Deployment runs section with last results

- **WHEN** the Tests tab is active and deployment run data is available for the spec or its change
- **THEN** a "DEPLOYMENT RUNS" section SHALL be displayed above or between test suite sections
- **AND** each run SHALL show: version, environment (e.g. Prod, Staging), date, pass/fail summary (e.g. "4 passed", "3 passed 1 failed"), and source (e.g. "by ci-pipeline")
- **AND** runs SHALL be ordered by date descending (most recent first)
- **AND** "All passed" SHALL use green styling; any failure SHALL use red for the failing count
- **AND** each run MAY include a link or affordance (arrow) to navigate to detailed results when supported

#### Scenario: Empty tests tab

- **WHEN** the Tests tab is active and no test flow files exist in the change's `tests/` directory
- **THEN** the content area SHALL display "No test flows defined yet."

#### Scenario: Tab badge reflects test group count

- **WHEN** the spec has associated test flow files
- **THEN** the Tests tab badge SHALL display the count of distinct test groups (sections), not raw file count
- **AND** the badge SHALL be omitted when no test flows exist

#### Scenario: UI alignment with Vantage design system

- **WHEN** any test content is rendered
- **THEN** typography SHALL use the constitution's scale (metadata ~11–12px, body ~13–14px, headings ~16–20px); backgrounds SHALL use near-white and white card/panel surfaces; borders SHALL be subtle; spacing SHALL follow 16–24px padding units; status colors SHALL use green for passed and red for failures
- **AND** the layout SHALL match the Tests spec view reference: test suites as sections, test cases as rows with TC-ID and description, deployment runs as compact run cards with status pill and optional navigation affordance

#### Scenario: Deployment runs absent

- **WHEN** no deployment run data is available
- **THEN** the DEPLOYMENT RUNS section SHALL be omitted
- **AND** only test suite sections and test cases SHALL be shown
