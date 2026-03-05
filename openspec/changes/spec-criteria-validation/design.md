## Context

The spec detail view (`SpecDetailView`) already renders a `CriteriaProgressBar` and a `CriteriaTab`. The progress bar receives a hardcoded `validated={0}`, and the status badge in `SpecTitleSection` always displays "Draft". The criteria checkboxes in `CriteriaTab` are rendered as inert `<span>` elements — they have no click handler and carry no state.

The change is entirely frontend: no server round-trip, no database writes, and no API surface is affected. Validation state is ephemeral — it lives in React state for the duration of the session and is scoped to a single spec page view.

## Goals / Non-Goals

**Goals:**
- Make criteria checkboxes interactive (toggle validated / unvalidated on click)
- Drive `CriteriaProgressBar` fill and counter from actual validated count
- Compute and display the spec status badge ("Draft" / "In review" / "Reviewed") from validated count relative to total

**Non-Goals:**
- Persisting validation state beyond the current browser session (no localStorage, no database)
- Multi-user synchronisation of validation state
- Server-side storage of which criteria are validated

## Decisions

### Decision: Lift validated state to SpecDetailView
**Choice**: Hold a `Set<number>` of validated criterion indices in `SpecDetailView` via `useState`.  
**Why**: `SpecDetailView` is the common ancestor of all three affected components (`CriteriaProgressBar`, `SpecTitleSection`, and `CriteriaTab`). Lifting state here avoids prop-drilling through an intermediate layer and keeps all derived computations (validated count, status string) in one place.  
**Alternatives**: Context/provider — overkill for a single-page, ephemeral concern. Keeping state in `CriteriaTab` and lifting only a count up — requires an imperative callback from child to parent, which is harder to reason about.

### Decision: Compute status as a pure derivation in SpecDetailView
**Choice**: Derive `"Draft" | "In review" | "Reviewed"` inline in `SpecDetailView` based on `validatedIndices.size` vs `criteriaCount`, then pass the result as a prop to `SpecTitleSection`.  
**Why**: Status has no independent lifecycle — it is 100% a function of two integers. Keeping the derivation colocated with the state that drives it avoids sync bugs.  
**Alternatives**: Compute inside `SpecTitleSection` — would require passing raw counts as additional props instead of the already-available count; no material difference but slightly more coupling.

### Decision: CriteriaTab becomes a controlled component
**Choice**: `CriteriaTab` accepts `validatedIndices: Set<number>` and `onToggle: (index: number) => void` props and renders a real `<button>` (or `<input type="checkbox">`) per criterion row.  
**Why**: Controlled pattern keeps the single source of truth in `SpecDetailView`. `CriteriaTab` becomes a pure rendering component — easy to test and easy to extend.  
**Alternatives**: Uncontrolled local state in `CriteriaTab` with an `onChange` callback bubbling aggregate counts — creates a second source of truth and makes state resets harder.

## Data model changes

None. Validation state is transient React state; no Prisma schema changes required.

## API changes

None.

## Risks / Trade-offs

- [State resets on navigation] If the user navigates away and returns, all checkboxes reset to unchecked. → Accepted for now; persistence is explicitly out of scope.
- [Index-based identity] Criteria are identified by their list index, not by name. If the spec markdown changes between renders (unlikely in a single session) indices could drift. → Acceptable because the page must be navigated away from and back to pick up new markdown, which already resets state.

## Open Questions

- None — scope is narrow and self-contained.
