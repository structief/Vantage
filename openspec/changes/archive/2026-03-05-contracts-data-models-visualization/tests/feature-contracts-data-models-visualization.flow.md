# Test flows: contracts-data-models-visualization

<!-- Generated from specs/feature-contracts-data-models-visualization.md. Each flow maps to a spec scenario.
     Translated to actual test code during opsx-apply. -->

## Flow: Rich API contract visualisation
Type: e2e
Spec: specs/feature-contracts-data-models-visualization.md > Requirement: Contracts Tab

Setup:
- User is authenticated via GitHub OAuth
- A repo is pinned with a spec whose change directory contains `contracts/api/` with at least one OpenAPI YAML file (e.g. `auth.yaml` with path `POST /api/v1/auth/register`)
- GitHub API mocks return the contract file content when requested

Steps:
1. Navigate to the spec detail page
2. Click the "Contracts" tab
3. Inspect the rendered content

Expected:
- Each API endpoint is rendered as a distinct card
- Card heading shows HTTP method and path (e.g. `POST /api/v1/auth/register`)
- Card includes operation summary/description
- REQUEST section shows parameters table (field name, required flag, type, description)
- RESPONSE section shows fields table (name, type, description)
- STATUS CODES section shows code and description for each response
- Card layout follows reference UX style (flat white, border-radius ~8–10px)

Edge cases:
- Malformed YAML → show filename with "Could not parse" or raw preview; tab does not crash

## Flow: JSON Schema visualisation (contracts/data)
Type: e2e
Spec: specs/feature-contracts-data-models-visualization.md > Requirement: Contracts Tab

Setup:
- User is authenticated
- A spec's change directory contains `contracts/data/` with at least one JSON Schema file (e.g. `github-api.json` with definitions including `GitHubUser`)
- GitHub API mocks return the data file content when requested

Steps:
1. Navigate to the spec detail page
2. Click the "Contracts" tab
3. Inspect the rendered content

Expected:
- Each schema definition from `definitions` or `$defs` is rendered as a distinct card
- Card heading shows definition name/title (e.g. `GitHubUser`)
- Card includes description if present
- Properties table shows field name, type, required, description
- Same card styling as API contract cards

## Flow: Data models visualisation
Type: e2e
Spec: specs/feature-contracts-data-models-visualization.md > Requirement: Contracts Tab

Setup:
- User is authenticated
- A spec's change directory contains `data-model/schema.prisma` with at least one model (e.g. `model User { id Int @id ... }`)
- GitHub API mocks return the schema content when requested

Steps:
1. Navigate to the spec detail page
2. Click the "Contracts" tab
3. Inspect the rendered content

Expected:
- Each Prisma model is rendered as a distinct card
- Card heading shows model name (e.g. `User`)
- Fields table shows field name, type, modifiers (required, unique, relation)
- Same card styling as contract cards
- Data models section appears in the same tab content area as contracts

## Flow: Tab label and badge
Type: e2e
Spec: specs/feature-contracts-data-models-visualization.md > Requirement: Contracts Tab

Setup:
- User is authenticated
- A spec has 2 contract files in `contracts/api/`, 1 in `contracts/data/`, and `data-model/schema.prisma` exists

Steps:
1. Navigate to the spec detail page
2. Inspect the Contracts tab in the tab bar

Expected:
- Tab label displays "Contracts"
- Badge shows 4 (2 + 1 contract files + 1 for schema)

Edge cases:
- No contracts and no schema → badge is omitted (or shows 0 per spec: "badge SHALL be omitted when neither contracts nor data model exist")
- Only contracts, no schema → badge shows contract file count only
- Only schema, no contracts → badge shows 1

## Flow: Empty tab content
Type: e2e
Spec: specs/feature-contracts-data-models-visualization.md > Requirement: Contracts Tab

Setup:
- User is authenticated
- A spec's change directory has no files in `contracts/api/`, no files in `contracts/data/`, and no `data-model/schema.prisma`
- GitHub API returns empty directory listings and 404 for schema

Steps:
1. Navigate to the spec detail page
2. Click the "Contracts" tab
3. Inspect the content area

Expected:
- Content area displays exactly "No contracts or data models defined yet."

## Flow: Partial content — contracts only
Type: e2e
Spec: specs/feature-contracts-data-models-visualization.md > Requirement: Contracts Tab

Setup:
- User is authenticated
- Spec has at least one contract file in `contracts/api/` or `contracts/data/` but no `data-model/schema.prisma`

Steps:
1. Navigate to the spec detail page
2. Click the "Contracts" tab
3. Inspect the content

Expected:
- Only the contracts section (API and/or JSON Schema cards) is shown
- No data models section is visible

## Flow: Partial content — schema only
Type: e2e
Spec: specs/feature-contracts-data-models-visualization.md > Requirement: Contracts Tab

Setup:
- User is authenticated
- Spec has `data-model/schema.prisma` but no files in `contracts/api/` or `contracts/data/`

Steps:
1. Navigate to the spec detail page
2. Click the "Contracts" tab
3. Inspect the content

Expected:
- Only the data models section is shown
- No API or JSON Schema cards are visible

## Flow: UI alignment with Vantage design system
Type: e2e
Spec: specs/feature-contracts-data-models-visualization.md > Requirement: Contracts Tab

Setup:
- User is authenticated
- Contracts tab has at least one card to render (API, JSON Schema, or Prisma model)

Steps:
1. Navigate to the spec detail page
2. Click the "Contracts" tab
3. Inspect typography, colors, spacing, and card styling

Expected:
- Typography: metadata ~11–12px, body ~13–14px, headings ~16–20px
- Backgrounds: near-white (#f4f4f5 / #f9f9f9) outer; white card surfaces
- Borders: subtle (1px, low opacity)
- Spacing: 16–24px padding units
- Cards: flat white, ~8–10px border-radius, no drop shadows or very faint ones
