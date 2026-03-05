## ADDED Requirements

### [x] Requirement: Specs Listing API
A `GET /api/repos/[encodedFullName]/specs` endpoint SHALL return all spec `.md` files discovered in the connected repo's `openspec/changes/` directory. The response SHALL include one entry per file with the fields `slug` (filename without `.md`), `group` (subdirectory name, or `null` for changes directly under `openspec/changes/`), `path` (full relative path in the repo), and `status` (`"active"` or `"archived"`). Results SHALL be ordered: ungrouped active entries first, then named groups alphabetically, then archived entries last.

#### Scenario: Specs returned with correct grouping
- **WHEN** `GET /api/repos/{encodedFullName}/specs` is called with a valid authenticated session
- **THEN** the response SHALL be `200` with `{ "specs": [...] }` where each entry has `slug`, `group`, `path`, and `status` fields; ungrouped active entries appear before archived entries

#### Scenario: No openspec directory
- **WHEN** the connected repo has no `openspec/changes/` directory
- **THEN** the response SHALL be `200` with `{ "specs": [] }`

#### Scenario: Unauthenticated request
- **WHEN** the request has no valid session
- **THEN** the response SHALL be `401` with `{ "error": "Not authenticated" }`

#### Scenario: Invalid encoded repo name
- **WHEN** `encodedFullName` decodes to a string without a `/`
- **THEN** the response SHALL be `400` with `{ "error": "Invalid repository name" }`

### [x] Requirement: Spec Content API
A `GET /api/repos/[encodedFullName]/spec-content?path=<encoded-path>` endpoint SHALL return the raw text content of a single spec file identified by its full path within the repo.

#### Scenario: File content returned
- **WHEN** `GET /api/repos/{encodedFullName}/spec-content?path=<valid-path>` is called with a valid authenticated session
- **THEN** the response SHALL be `200` with `{ "content": "<raw text>" }`

#### Scenario: File not found
- **WHEN** the `path` query param points to a file that does not exist
- **THEN** the response SHALL be `404` with `{ "error": "File not found" }`

#### Scenario: Missing path param
- **WHEN** the `path` query param is absent
- **THEN** the response SHALL be `400` with `{ "error": "Missing path parameter" }`

#### Scenario: Unauthenticated request to spec-content
- **WHEN** the request has no valid session
- **THEN** the response SHALL be `401` with `{ "error": "Not authenticated" }`

### [x] Requirement: Spec Detail Page — Slug and Title
When the user navigates to `/repo/[owner]/[name]/specs/[slug]`, the page SHALL display the spec's slug and its title. The title SHALL be extracted from the first `# Heading` line of the spec file content; if no such line exists the slug SHALL be used as the title.

#### Scenario: Selecting a spec from the sidebar
- **WHEN** the user clicks a spec item in the secondary sidebar and the browser navigates to `/repo/[owner]/[name]/specs/[slug]`
- **THEN** the page SHALL display the spec's slug and title prominently in the content area

#### Scenario: Spec file has no title heading
- **WHEN** the spec file contains no `# Heading` line
- **THEN** the page SHALL display the slug as both the slug label and the title

#### Scenario: Spec not found
- **WHEN** the `slug` in the URL does not match any spec in the connected repo
- **THEN** the page SHALL display "Spec not found."
