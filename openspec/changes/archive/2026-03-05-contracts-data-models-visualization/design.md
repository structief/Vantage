## Context

The spec detail view currently has an Overview, Criteria, Contracts, and Tests tab. The Contracts tab shows a simple file list (`FileListTab`) of filenames from the change's `contracts/` directory. Contract files live in `contracts/api/*.yaml` (OpenAPI) and `contracts/data/*.json` (JSON Schema). Data models live in `data-model/schema.prisma`. The user wants the Contracts tab to visualise all of these as structured, readable cards — aligning with the reference UX (method/path, REQUEST/RESPONSE/STATUS CODES sections) and Vantage's constitution design system.

Current data flow: the spec detail page fetches via `fetchDirectoryListing` for `contracts` and `tests`. The GitHub Contents API returns direct children; since `contracts/` typically contains `api/` and `data/` subdirs, listing `contracts` yields no files. We need to list both `contracts/api/` and `contracts/data/` to obtain all contract filenames. File content is fetched via `fetchSpecFileContent` (or the existing `GET /api/repos/.../spec-content?path=` if used client-side).

## Goals / Non-Goals

**Goals:**

- Upgrade the Contracts tab to render structured content instead of a file list
- Render OpenAPI endpoints (from `contracts/api/`) as cards with method, path, description, REQUEST/RESPONSE/STATUS CODES tables
- Render JSON Schema definitions (from `contracts/data/`) as cards with definition name, properties table
- Render Prisma models as cards with model name and field tables
- Align styling with constitution (typography, colors, spacing, card style)

**Non-Goals:**

- Editing contracts or schemas in the UI
- Executing or validating contracts (CI handles that)

## Decisions

### Decision: List contracts/api/ and contracts/data/ for all contract files

**Choice**: Use `fetchDirectoryListing` on both `openspec/changes/[changePath]/contracts/api/` and `openspec/changes/[changePath]/contracts/data/` to obtain all contract filenames (OpenAPI YAML/JSON and JSON Schema).

**Why**: OpenAPI lives in `contracts/api/`; JSON Schema definitions live in `contracts/data/`. Listing `contracts/` returns subdirs (api, data), not files.

**Alternatives**: Recursive directory walk — rejected as more complex; single-level listing per subdir is sufficient.

### Decision: Fetch and parse contract content server-side

**Choice**: In the spec detail page server component, fetch each contract file's content via `fetchSpecFileContent` (or equivalent) for paths in `contracts/api/` and `contracts/data/`. Parse YAML (OpenAPI) or JSON (JSON Schema) and pass structured data to the tab component.

**Why**: Rendering rich cards requires parsed content, not raw filenames.

**Alternatives**: Client-side fetch and parse — possible but adds loading states and extra requests; server-side keeps a single round-trip.

### Decision: Parse OpenAPI with a lightweight YAML + schema library

**Choice**: Use `yaml` (or `js-yaml`) to parse YAML; traverse the OpenAPI object to extract paths, methods, request/response schemas, status codes. No full OpenAPI validation — best-effort extraction for display.

**Why**: Full OpenAPI tooling is heavy; we only need to surface paths, operations, parameters, and responses for UI.

**Alternatives**: Use `openapi-typescript` or Swagger parser — overkill for read-only visualisation.

### Decision: Parse JSON Schema (contracts/data) for definition cards

**Choice**: Parse JSON files from `contracts/data/`; extract `definitions` or `$defs`; render each definition as a card with title, description, and a properties table (name, type, required, description).

**Why**: `contracts/data/` holds JSON Schema files (e.g. `github-api.json`) with shared data shapes; surfacing these alongside API contracts gives a complete picture.

**Alternatives**: Show raw JSON — less readable; full JSON Schema validator — overkill for display.

### Decision: Parse Prisma schema with a simple parser

**Choice**: Fetch `data-model/schema.prisma` if it exists; parse it with a simple regex/line-based approach or a small Prisma schema parser (e.g. `prisma-ast` or similar) to extract model names and fields.

**Why**: Prisma schema is a constrained DSL; we need model and field names, types, and modifiers only.

**Alternatives**: Full Prisma parser — heavier; regex for `model X { ... }` blocks may suffice for MVP.

### Decision: Contracts tab with multiple sections

**Choice**: The "Contracts" tab shows three visual sections: API contracts (from `contracts/api/`), JSON Schema definitions (from `contracts/data/`), and Prisma data models (from `data-model/schema.prisma`), each in card format.

**Why**: Keeps all contract and model content in one tab; matches existing tab naming.

### Decision: Tab badge = contract file count + (1 if schema exists)

**Choice**: Badge shows total number of contract files plus 1 when `schema.prisma` exists; otherwise contract count only.

**Why**: Mirrors the spec; gives a quick sense of "how much" contract/model content exists.

## Data model changes

None. This is a UI-only change.

## API changes

- **Possibly**: Extend or add an endpoint to return parsed contract/schema data if we decide to keep parsing on the server and expose it via API (e.g. for client-side loading). Current plan: pass parsed data as props from the server component.

- **If client-side fetch**: Reuse `GET /api/repos/[encodedFullName]/spec-content?path=` for raw file content; add logic to fetch `contracts/api/*`, `contracts/data/*`, and `data-model/schema.prisma` paths. Client would parse and render.

## Risks / Trade-offs

- [Parse failures] → Graceful degradation: show filename and "Could not parse" or raw preview; do not crash the tab.
- [Large schemas] → Render all models; consider pagination or collapse if performance demands it later.
- [OpenAPI complexity] → Support common patterns (paths, parameters, responses, status codes); nested `$ref` resolution deferred.

## Open Questions

- Confirm whether `fetchDirectoryListing` is currently used for `contracts` or `contracts/api` in production — adjust page if needed.
- Decide parser library: `yaml` for YAML, and for Prisma either `prisma-ast` or a minimal custom parser.
