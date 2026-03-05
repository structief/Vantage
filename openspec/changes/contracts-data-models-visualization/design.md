## Context

The spec detail view currently has an Overview, Criteria, Contracts, and Tests tab. The Contracts tab shows a simple file list (`FileListTab`) of filenames from the change's `contracts/` directory. Contract files live in `contracts/api/*.yaml` (OpenAPI) and optionally `contracts/data/*.json` (JSON schemas). Data models live in `data-model/schema.prisma`. The user wants a single "Contracts & Data Models" tab that visualises both as structured, readable cards — aligning with the reference UX (method/path, REQUEST/RESPONSE/STATUS CODES sections) and Vantage's constitution design system.

Current data flow: the spec detail page fetches via `fetchDirectoryListing` for `contracts` and `tests`. The GitHub Contents API returns direct children; since `contracts/` typically contains `api/` and `data/` subdirs, listing `contracts` yields no files. We need to list `contracts/api/` for OpenAPI files. File content is fetched via `fetchSpecFileContent` (or the existing `GET /api/repos/.../spec-content?path=` if used client-side).

## Goals / Non-Goals

**Goals:**

- Replace the Contracts tab with a unified "Contracts & Data Models" tab
- Render OpenAPI endpoints as cards with method, path, description, REQUEST/RESPONSE/STATUS CODES tables
- Render Prisma models as cards with model name and field tables
- Align styling with constitution (typography, colors, spacing, card style)

**Non-Goals:**

- Editing contracts or schemas in the UI
- Executing or validating contracts (CI handles that)
- Supporting non-OpenAPI contract formats in the initial scope

## Decisions

### Decision: List contracts/api/ for OpenAPI files

**Choice**: Use `fetchDirectoryListing` on `openspec/changes/[changePath]/contracts/api/` to obtain contract filenames; list `contracts/data/` only if we later support JSON Schema visualisation.

**Why**: OpenAPI contracts live in `contracts/api/`. Listing `contracts/` returns subdirs (api, data), not files.

**Alternatives**: Recursive directory walk — rejected as more complex; single-level listing is sufficient.

### Decision: Fetch and parse contract content server-side

**Choice**: In the spec detail page server component, fetch each contract file's content via `fetchSpecFileContent` (or equivalent) for paths like `openspec/changes/[changePath]/contracts/api/[filename]`. Parse YAML client-side or server-side and pass structured data to the tab component.

**Why**: Rendering rich cards requires parsed OpenAPI, not raw filenames.

**Alternatives**: Client-side fetch and parse — possible but adds loading states and extra requests; server-side keeps a single round-trip.

### Decision: Parse OpenAPI with a lightweight YAML + schema library

**Choice**: Use `yaml` (or `js-yaml`) to parse YAML; traverse the OpenAPI object to extract paths, methods, request/response schemas, status codes. No full OpenAPI validation — best-effort extraction for display.

**Why**: Full OpenAPI tooling is heavy; we only need to surface paths, operations, parameters, and responses for UI.

**Alternatives**: Use `openapi-typescript` or Swagger parser — overkill for read-only visualisation.

### Decision: Parse Prisma schema with a simple parser

**Choice**: Fetch `data-model/schema.prisma` if it exists; parse it with a simple regex/line-based approach or a small Prisma schema parser (e.g. `prisma-ast` or similar) to extract model names and fields.

**Why**: Prisma schema is a constrained DSL; we need model and field names, types, and modifiers only.

**Alternatives**: Full Prisma parser — heavier; regex for `model X { ... }` blocks may suffice for MVP.

### Decision: Single combined tab with sections

**Choice**: One tab "Contracts & Data Models" with two visual sections: API contracts first, then data models (or vice versa per spec).

**Why**: User requested "one tab"; keeps navigation simple.

**Alternatives**: Separate tabs — rejected per user request.

### Decision: Tab badge = contract file count + (1 if schema exists)

**Choice**: Badge shows total number of contract files plus 1 when `schema.prisma` exists; otherwise contract count only.

**Why**: Mirrors the spec; gives a quick sense of "how much" contract/model content exists.

## Data model changes

None. This is a UI-only change.

## API changes

- **Possibly**: Extend or add an endpoint to return parsed contract/schema data if we decide to keep parsing on the server and expose it via API (e.g. for client-side loading). Current plan: pass parsed data as props from the server component.

- **If client-side fetch**: Reuse `GET /api/repos/[encodedFullName]/spec-content?path=` for raw file content; add logic to fetch `contracts/api/*` and `data-model/schema.prisma` paths. Client would parse and render.

## Risks / Trade-offs

- [Parse failures] → Graceful degradation: show filename and "Could not parse" or raw preview; do not crash the tab.
- [Large schemas] → Render all models; consider pagination or collapse if performance demands it later.
- [OpenAPI complexity] → Support common patterns (paths, parameters, responses, status codes); nested `$ref` resolution deferred.

## Open Questions

- Confirm whether `fetchDirectoryListing` is currently used for `contracts` or `contracts/api` in production — adjust page if needed.
- Decide parser library: `yaml` for YAML, and for Prisma either `prisma-ast` or a minimal custom parser.
