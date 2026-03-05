## 1. Data model

- [ ] 1.1 Merge data-model/schema.prisma TestRun model into prisma/schema.prisma
- [ ] 1.2 Run `npx prisma migrate dev` to create migration for test_runs table

## 2. Flow parser

- [ ] 2.1 Create lib/parse-flow-md.ts: parse .flow.md content into Flow blocks (Type, name, Spec, Setup, Steps, Expected)
- [ ] 2.2 Add extractTestGroups(flows): group flows by Type, return sections with TC-IDs and descriptions

## 3. Spec detail page data loading

- [ ] 3.1 Update spec detail page to fetch each test flow file content via fetchSpecFileContent (path: openspec/changes/[changePath]/tests/[filename])
- [ ] 3.2 Parse fetched flow files and build structured data (sections, test cases)
- [ ] 3.3 Query TestRun by repoFullName + changePath + specSlug, order by runAt desc, limit 5
- [ ] 3.4 Pass parsed flows and deployment runs to SpecDetailView; compute test group count for badge

## 4. TestsTab component

- [ ] 4.1 Create components/TestsTab.tsx with props: sections (grouped flows), deploymentRuns (optional)
- [ ] 4.2 Render DEPLOYMENT RUNS section first (when runs exist): version, env, date, pass/fail with green/red styling, optional details link
- [ ] 4.3 Render test suite sections: heading per type, TC-1/TC-2 rows with title and description
- [ ] 4.4 Handle empty state: "No test flows defined yet."
- [ ] 4.5 Apply constitution styling (typography, spacing, colors)

## 5. SpecDetailView integration

- [ ] 5.1 Replace FileListTab with TestsTab for activeTab === "tests"
- [ ] 5.2 Update SpecTabBar testsCount prop: pass test group count (not file count) when flows exist

## 6. Test runs API

- [ ] 6.1 Create POST /api/repos/[encodedFullName]/test-runs route per contracts/api/test-runs.yaml
- [ ] 6.2 Validate request body; create TestRun record; return { id }
- [ ] 6.3 Return 401 when not authenticated; 400 when required fields missing

## 7. Tests

- [ ] 7.1 Translate Flow "Test suites grouped by type" to tests/e2e/tests-visualisation.spec.ts
- [ ] 7.2 Translate Flow "Individual test cases listed" to tests/e2e/tests-visualisation.spec.ts
- [ ] 7.3 Translate Flow "Deployment runs section with last results" to tests/e2e/tests-visualisation.spec.ts
- [ ] 7.4 Translate Flow "Empty tests tab" to tests/e2e/tests-visualisation.spec.ts
- [ ] 7.5 Translate Flow "Tab badge reflects test group count" to tests/e2e/tests-visualisation.spec.ts
- [ ] 7.6 Translate Flow "UI alignment with Vantage design system" to tests/e2e/tests-visualisation.spec.ts
- [ ] 7.7 Translate Flow "Deployment runs absent" to tests/e2e/tests-visualisation.spec.ts
- [ ] 7.8 Translate Flow "Record test run API" to tests/contract/test-runs.contract.test.ts
