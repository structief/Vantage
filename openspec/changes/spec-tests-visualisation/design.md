## Context

The spec detail view has a Tests tab that currently renders a simple file list (`FileListTab`) of filenames from the change's `tests/` directory. Test flow files (`.flow.md`) live in `openspec/changes/[changePath]/tests/` and follow a structured format: each `## Flow:` block has `Type`, `Spec`, `Setup`, `Steps`, and `Expected`. The constitution states that "CI runs tests; Vantage only surfaces results" — Vantage does not execute tests but must display their results. The user wants a Tests spec view that: (1) groups flows by type into test suites with descriptions, (2) lists individual test cases (TC-1, TC-2, …) with titles and assertions, and (3) shows a DEPLOYMENT RUNS section with version, environment, date, and pass/fail from CI or local runs.

Current data flow: `fetchDirectoryListing` returns test filenames; file content is fetched via `fetchSpecFileContent`. There is no existing pipeline for deployment run results. The `test-results/.last-run.json` file contains minimal data (`status`, `failedTests`) for local runs.

## Goals / Non-Goals

**Goals:**

- Parse `.flow.md` files to extract Flow blocks and render grouped test suites
- Display test cases with TC-ID, title (flow name), and description (Expected/Steps summary)
- Add a DEPLOYMENT RUNS section that shows last results (version, env, date, pass/fail)
- Align layout and styling with the Tests spec view reference and constitution

**Non-Goals:**

- Executing tests inside Vantage (CI handles execution)
- Full GitHub Checks API integration in initial scope (design for extension)
- Editing or reordering test flows in the UI

## Decisions

### Decision: Parse flow files server-side

**Choice**: In the spec detail page server component, fetch each `.flow.md` file content via `fetchSpecFileContent`, parse Flow blocks with a lightweight parser (regex or markdown section split), and pass structured data (groups, test cases) to a new `TestsTab` component.

**Why**: Rich visualisation requires parsed flow metadata (Type, name, Expected). Server-side keeps a single round-trip and avoids client loading states.

**Alternatives**: Client-side fetch and parse — adds latency and extra requests; deferred.

### Decision: Group flows by Type into sections

**Choice**: Group flows by `Type` (unit, contract, e2e). Each unique type becomes a section (e.g. "Unit Tests", "Contract Tests", "E2E Tests"). Optionally derive a more descriptive section title from the first flow's Spec reference or a naming convention (e.g. `feature-user-registration.flow.md` → "User Registration Unit Tests").

**Why**: The reference UX shows categories like "Registration Unit Tests" and "OAuth Integration Tests". Type is the primary discriminator in flow files.

**Alternatives**: One section per file — less cohesive; group by file — acceptable fallback if Type-based grouping is too coarse.

### Decision: TC-ID as sequential index within section

**Choice**: Assign TC-1, TC-2, … per section based on flow order within that section. No persistence of TC-IDs across runs.

**Why**: Simple, deterministic, no schema change. Matches reference UX (TC-1, TC-2, …).

**Alternatives**: Global ID across all flows — unnecessary for display; stable IDs from flow name hash — overkill for MVP.

### Decision: Deployment run data from local SQLite initially

**Choice**: Store deployment run summaries in the existing local SQLite (Prisma). Schema: a `DeploymentRun` (or `TestRun`) table with fields: `id`, `repoFullName`, `changePath`, `specSlug`, `version`, `environment`, `date`, `passedCount`, `failedCount`, `source` (e.g. "ci-pipeline"), optional `detailsUrl`. Populate from: (a) local test runner writing results after `vitest`/`playwright` runs, or (b) a placeholder/mock for MVP. Document extension point for GitHub Checks API or CI artifact ingest later.

**Why**: Constitution permits local SQLite for application state. Surfaces results without requiring external CI integration in v1.

**Alternatives**: Read from committed `test-results/*.json` in repo — requires CI to commit; adds git noise. GitHub Checks API — external dependency; defer to follow-up. In-memory only — no persistence; not suitable for "last results".

### Decision: Tests tab badge = distinct test group count

**Choice**: Badge shows the number of distinct test sections (groups by Type), not the count of flow files.

**Why**: Spec requires badge to reflect "test groups"; aligns with the reference "(2)" for two suites.

**Alternatives**: Total flow count — less aligned with UX; file count — current behaviour; rejected.

### Decision: New TestsTab component replacing FileListTab for tests

**Choice**: Create a dedicated `TestsTab` component that receives parsed flows and optional deployment runs as props. Replace the `activeTab === "tests"` branch in `SpecDetailView` to render `TestsTab` instead of `FileListTab`.

**Why**: Tests tab has distinct structure (suites, TC rows, deployment runs); separate component keeps concerns clean.

**Alternatives**: Extend `FileListTab` with mode — would blur responsibilities; rejected.

### Decision: Section ordering

**Choice**: DEPLOYMENT RUNS first (when present), then test suite sections. Within suites: Unit, then Contract, then E2E (or order of first occurrence). Runs ordered by date descending.

**Why**: Reference UX shows Deployment Runs prominently; "last results" are primary. Test cases provide context below.

**Alternatives**: Deployment Runs at bottom — less prominent; Runs interspersed per suite — complex; rejected.

## Data model changes

Add a `TestRun` (or `DeploymentRun`) model to Prisma schema:

```
model TestRun {
  id            String   @id @default(cuid())
  repoFullName  String
  changePath    String
  specSlug      String
  version       String?
  environment  String?
  runAt        DateTime
  passedCount  Int      @default(0)
  failedCount  Int      @default(0)
  source       String?  // e.g. "ci-pipeline", "local"
  detailsUrl   String?
  createdAt    DateTime @default(now())
  @@index([repoFullName, changePath, specSlug])
}
```

Migration required. Optional: add an API route or server action to record runs from local test runner.

## API changes

- **New or extended**: API to record test run results (e.g. `POST /api/repos/[fullName]/test-runs`) for local runner integration. Request body: `{ changePath, specSlug, version?, environment?, passedCount, failedCount, source? }`.
- **Read path**: Spec detail page queries `TestRun` for `repoFullName` + `changePath` + `specSlug`, orders by `runAt` desc, limits to last N (e.g. 5), passes to `TestsTab`.

## Risks / Trade-offs

- [Parse failures] → Graceful degradation: show raw filename and "Could not parse flow file"; do not crash the tab.
- [No deployment data] → Omit DEPLOYMENT RUNS section; tab still useful with test cases only.
- [Large flow files] → Render all flows; consider collapse/expand per section if performance demands it later.
- [CI integration deferred] → MVP uses local-only or mock data; document extension for GitHub Checks in Open Questions.

## Open Questions

- Implement local test runner hook (e.g. Vitest/Playwright reporter) to write to `TestRun` on completion?
- Confirm `fetchDirectoryListing` path for `tests/` — is it `openspec/changes/[changePath]/tests`?
- Future: GitHub Checks API — map check runs to `TestRun` for repos with Actions?
