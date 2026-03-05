# Tasks: contracts-data-models-visualization

Generated from: specs, design, test flows
Contracts: N/A (UI-only, no new Vantage API)
Data model: N/A (no new entities)

## 1. Parsers and data extraction

- [ ] 1.1 Add `lib/contract-parsers.ts` — parse OpenAPI YAML/JSON to extract per-endpoint: method, path, summary, description, request parameters (name, required, type, description), response schema fields, status codes; handle parse errors gracefully
- [ ] 1.2 Extend `lib/contract-parsers.ts` — parse JSON Schema (contracts/data) to extract definitions from `definitions` or `$defs`: name, title, description, properties table (name, type, required, description)
- [ ] 1.3 Extend `lib/contract-parsers.ts` — parse Prisma schema to extract models: model name, fields with type and modifiers (required, unique, relation)
- [ ] 1.4 Add `yaml` dependency (or use existing) for YAML parsing; ensure JSON parse for contracts/data files

## 2. Page and data fetching

- [ ] 2.1 Update spec detail page — change `fetchDirectoryListing` to list both `openspec/changes/[changePath]/contracts/api/` and `contracts/data/`; merge filenames with subdir prefix (e.g. `api/auth.yaml`, `data/github-api.json`)
- [ ] 2.2 Update spec detail page — try fetch `openspec/changes/[changePath]/data-model/schema.prisma` via `fetchSpecFileContent` (or add `fetchFileContent`); pass schema content or null
- [ ] 2.3 Update spec detail page — for each contract file, fetch content via `fetchSpecFileContent`; parse with contract-parsers; build structured arrays (apiEndpoints, jsonSchemaDefinitions, prismaModels)
- [ ] 2.4 Compute contracts badge: `apiFiles.length + dataFiles.length + (schemaExists ? 1 : 0)`; pass to SpecDetailView

## 3. Components

- [ ] 3.1 Create `components/ContractsTab.tsx` — accepts `apiEndpoints`, `jsonSchemaDefinitions`, `prismaModels`; renders empty state "No contracts or data models defined yet." when all empty
- [ ] 3.2 Implement API contract cards in ContractsTab — each endpoint as card: heading `METHOD /path`, description, REQUEST table (field, required, type, description), RESPONSE table, STATUS CODES section
- [ ] 3.3 Implement JSON Schema definition cards in ContractsTab — each definition as card: heading (name/title), description, properties table
- [ ] 3.4 Implement Prisma model cards in ContractsTab — each model as card: heading (model name), fields table (name, type, modifiers)
- [ ] 3.5 Apply constitution styling — typography (11–12px metadata, 13–14px body, 16–20px headings); white cards, ~8–10px border-radius; 16–24px padding; subtle borders
- [ ] 3.6 Update SpecDetailView — replace `FileListTab` for contracts with `ContractsTab`; pass new parsed props; update `contractsCount` prop to use computed badge (contract files + schema)

## 4. SpecTabBar

- [ ] 4.1 SpecTabBar already uses `contractsCount` — ensure page passes the new badge value (api + data file count + 1 if schema); no label change needed ("Contracts" is correct)
- [ ] 4.2 Badge omitted when contractsCount is 0 (already handled by `contractsCount > 0 ? contractsCount : undefined`)

## 5. Tests

- [ ] 5.1 Translate `tests/feature-contracts-data-models-visualization.flow.md` → `tests/e2e/contracts-data-models-visualization.spec.ts` — cover: Rich API contract visualisation, JSON Schema visualisation, Data models visualisation, Tab label and badge, Empty tab content, Partial content (contracts only, schema only), UI alignment
- [ ] 5.2 Update e2e mocks — extend mock for spec-contracts to return both api and data paths; add mock for spec-content for contract files and schema; ensure test change directory structure matches (contracts/api/, contracts/data/, data-model/schema.prisma)
- [ ] 5.3 Run e2e tests and fix any failures
