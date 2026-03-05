## 1. Implementation

- [x] 1.1 Create `components/SpecStatusContext.tsx` — context, `SpecStatusProvider`, and `useSpecStatus` hook; initial state is an empty `Map<string, "Draft" | "In review" | "Reviewed">` with an `updateSpecStatus(slug, status)` setter
- [x] 1.2 Add `SpecStatusProvider` to `app/(shell)/layout.tsx` wrapping `SidebarModeProvider` and its children, so both `SecondarySidebar` and the spec detail pages share the same context instance
- [x] 1.3 Update `SpecDetailView` (`components/SpecDetailView.tsx`) to consume `useSpecStatus` and call `updateSpecStatus(slug, status)` in a `useEffect` whenever `status` (derived from `validatedIndices`) changes; derive `slug` from the `filename` prop
- [x] 1.4 Update `SpecFileList` in `components/SecondarySidebar.tsx` to render a `w-1.5 h-1.5 rounded-full shrink-0` dot before each spec label, coloured using `STATUS_DOT` from `SpecStatusContext` (`bg-gray-400` / `bg-amber-400` / `bg-green-500`); default to `"Draft"` for slugs not yet in the context map
- [x] 1.5 Strip the `feature-` prefix from display labels in `SpecFileList`: replace `{spec.slug}` with `{spec.slug.replace(/^feature-/, "")}` — routing (`href`) and React `key` continue to use the full slug

## 2. Tests

- [x] 2.1 Translate unit flows from `openspec/changes/spec-status-dot-sidebar/tests/secondary-sidebar-nav.flow.md` (flows 1–5) → `tests/unit/spec-status-dot-sidebar.test.ts`; cover: `feature-` prefix stripping logic, `SpecStatusContext` initial state (Draft), context update to In review / Reviewed / back to Draft
- [x] 2.2 Translate the e2e flow (flow 6: "Dot persists across sidebar spec list navigations") → `tests/e2e/spec-status-dot-sidebar.e2e.ts` using Playwright; verify dot colors update live and persist after navigating between specs
