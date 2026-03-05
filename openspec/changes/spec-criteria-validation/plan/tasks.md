## 1. Implementation

- [ ] 1.1 Lift `validatedIndices` state (`Set<number>`) into `SpecDetailView` and wire `validated={validatedIndices.size}` to `CriteriaProgressBar`
- [ ] 1.2 Add `deriveStatus(validated: number, total: number): "Draft" | "In review" | "Reviewed"` pure function (in `lib/spec-utils.ts` or inline in `SpecDetailView`)
- [ ] 1.3 Pass computed `status` prop to `SpecTitleSection` and replace the hardcoded "Draft" badge with a dynamic badge that maps status → label + dot color (gray / amber / green)
- [ ] 1.4 Convert `CriteriaTab` to a controlled component: add `validatedIndices: Set<number>` and `onToggle: (index: number) => void` props; replace the inert `<span>` checkbox with a clickable `<button>` or `<input type="checkbox">`; update the status badge to render "validated" when the index is in the set, "pending" otherwise

## 2. Tests

- [ ] 2.1 Translate `tests/feature-criteria-validation.flow.md` flows 1–2 (Checking / Unchecking a criterion) → `tests/unit/criteria-tab.test.tsx`
- [ ] 2.2 Translate flows 3–5 (Progress bar advances, resets, full) → `tests/unit/criteria-progress-bar.test.tsx`
- [ ] 2.3 Translate flows 6–10 (Status Draft / In review / Reviewed / reverts / no criteria) → `tests/unit/spec-detail-view.test.tsx`
