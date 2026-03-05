## ADDED Requirements

### [x] Requirement: Contracts Tab

The spec detail view SHALL provide a "Contracts" tab that visualises API contracts (OpenAPI from `contracts/api/` and JSON Schema from `contracts/data/`) and data models (Prisma schema) in a structured, readable format aligned with Vantage's design system.

#### Scenario: Rich API contract visualisation

- **WHEN** the "Contracts" tab is active and the spec's change directory contains one or more OpenAPI contract files in `contracts/api/` (YAML or JSON)
- **THEN** each API endpoint SHALL be rendered as a distinct card with: HTTP method and path as heading; operation summary/description; REQUEST section (parameters as a table: field name, required flag, type, description); RESPONSE section (fields as a table with name, type, description); STATUS CODES section (code and description)
- **AND** the visual structure SHALL follow the card-style layout shown in the reference UX (Contracts spec view)

#### Scenario: JSON Schema visualisation (contracts/data)

- **WHEN** the "Contracts" tab is active and the spec's change directory contains one or more JSON Schema files in `contracts/data/`
- **THEN** each schema definition SHALL be rendered as a distinct card with: definition name/title as heading; description; properties as a table (field name, type, required, description)

#### Scenario: Data models visualisation

- **WHEN** the "Contracts" tab is active and the spec's change directory contains `data-model/schema.prisma`
- **THEN** each Prisma model SHALL be rendered as a distinct card with: model name as heading; fields listed in a table with field name, type, and optional modifiers (e.g. required, unique, relation)
- **AND** the data models section SHALL appear in the same tab content area, below or alongside the contracts section, using the same card styling

#### Scenario: Tab label and badge

- **WHEN** the spec has associated contract files (from `contracts/api/` or `contracts/data/`) or a data model
- **THEN** the tab SHALL display the label "Contracts" with a numeric badge showing the total count of contract files (api + data) plus one if a schema exists (e.g. 2 api + 1 data + schema = badge 4)
- **AND** the badge SHALL be omitted when neither contracts nor data model exist

#### Scenario: Empty tab content

- **WHEN** the "Contracts" tab is active and no contract files exist in `contracts/api/` or `contracts/data/` and no `data-model/schema.prisma` exists
- **THEN** the content area SHALL display "No contracts or data models defined yet."

#### Scenario: Partial content

- **WHEN** the tab is active and only contracts exist (no schema)
- **THEN** only the contracts section SHALL be shown (API contracts and/or JSON Schema definitions)
- **WHEN** the tab is active and only the schema exists (no contract files)
- **THEN** only the data models section SHALL be shown

#### Scenario: UI alignment with Vantage design system

- **WHEN** any contract or data model content is rendered
- **THEN** typography SHALL use the constitution's scale (metadata ~11–12px, body ~13–14px, headings ~16–20px); backgrounds SHALL use near-white (#f4f4f5 / #f9f9f9) and white card surfaces; borders SHALL be subtle (1px, low opacity); spacing SHALL follow 16–24px padding units; cards SHALL use flat white, ~8–10px border-radius, no drop shadows or very faint ones
