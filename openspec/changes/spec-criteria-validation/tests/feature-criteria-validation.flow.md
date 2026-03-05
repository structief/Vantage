# Test flows: criteria validation

<!-- Generated from specs/feature-criteria-validation.md. Each flow maps to a spec scenario.
     Translated to actual test code during opsx-apply. -->

## Flow: Checking a criterion
Type: unit
Spec: specs/feature-criteria-validation.md > Requirement: Criteria Checkbox Toggle

Setup:
- CriteriaTab rendered with a list of 3 requirements extracted from spec markdown
- All checkboxes start in unchecked state (validatedIndices is an empty Set)

Steps:
1. Simulate a click on the checkbox of the first criterion row (index 0)

Expected:
- The checkbox for index 0 appears checked/filled
- The criterion status badge for index 0 displays "validated"
- The onToggle callback is called with argument 0

Edge cases:
- Clicking a checkbox for a requirement at the last index (index 2) → same result for that index, others unchanged

---

## Flow: Unchecking a criterion
Type: unit
Spec: specs/feature-criteria-validation.md > Requirement: Criteria Checkbox Toggle

Setup:
- CriteriaTab rendered with validatedIndices = Set([0]) (first criterion already validated)

Steps:
1. Simulate a click on the checkbox of the first criterion row (index 0)

Expected:
- The checkbox for index 0 appears unchecked/empty
- The criterion status badge for index 0 displays "pending"
- The onToggle callback is called with argument 0

Edge cases:
- Clicking an already-unchecked checkbox → onToggle fires, state transitions from unvalidated to validated (idempotent toggle)

---

## Flow: Progress bar advances on validation
Type: unit
Spec: specs/feature-criteria-validation.md > Requirement: Criteria Validation Progress Bar

Setup:
- SpecDetailView rendered with spec markdown containing 3 requirements
- All criteria unchecked (validatedIndices = empty Set)
- CriteriaProgressBar shows "0 of 3 criteria validated"

Steps:
1. Check criterion at index 0
2. Check criterion at index 1

Expected:
- After step 1: progress bar width is ~33%, label reads "1 of 3 criteria validated"
- After step 2: progress bar width is ~67%, label reads "2 of 3 criteria validated"

Edge cases:
- Checking the same criterion twice has no net effect (Set deduplication)

---

## Flow: Progress bar resets on uncheck
Type: unit
Spec: specs/feature-criteria-validation.md > Requirement: Criteria Validation Progress Bar

Setup:
- SpecDetailView with 3 requirements; criteria at index 0 and 1 validated (validatedIndices = Set([0, 1]))
- Progress bar shows "2 of 3 criteria validated"

Steps:
1. Uncheck criterion at index 1

Expected:
- Progress bar width decreases to ~33%
- Label reads "1 of 3 criteria validated"

Edge cases:
- Unchecking the only validated criterion → progress bar returns to 0%, label reads "0 of 3 criteria validated"

---

## Flow: Progress bar full when all validated
Type: unit
Spec: specs/feature-criteria-validation.md > Requirement: Criteria Validation Progress Bar

Setup:
- SpecDetailView with 2 requirements; validatedIndices = Set([0]) (1 of 2 validated)

Steps:
1. Check criterion at index 1

Expected:
- Progress bar width is 100%
- Progress bar fill color is green (bg-green-500 class applied)
- Label reads "2 of 2 criteria validated"

Edge cases:
- A spec with 1 requirement: checking the single criterion → 100% immediately

---

## Flow: Status is Draft with no validated criteria
Type: unit
Spec: specs/feature-criteria-validation.md > Requirement: Spec Status Derived from Validation State

Setup:
- SpecDetailView with 3 requirements; validatedIndices = empty Set

Steps:
1. Render SpecDetailView and observe the status badge in SpecTitleSection

Expected:
- Status badge text is "Draft"
- Indicator dot color is gray

Edge cases:
- Spec with no parseable requirements at all → status badge still displays "Draft", progress bar not rendered

---

## Flow: Status transitions to In review
Type: unit
Spec: specs/feature-criteria-validation.md > Requirement: Spec Status Derived from Validation State

Setup:
- SpecDetailView with 3 requirements; validatedIndices = empty Set (status starts as "Draft")

Steps:
1. Check criterion at index 0

Expected:
- Status badge text changes to "In review"
- Indicator dot color is amber/orange

Edge cases:
- Checking a second criterion while already "In review" → status remains "In review" (not all validated yet)

---

## Flow: Status transitions to Reviewed
Type: unit
Spec: specs/feature-criteria-validation.md > Requirement: Spec Status Derived from Validation State

Setup:
- SpecDetailView with 2 requirements; validatedIndices = Set([0]) (status is "In review")

Steps:
1. Check criterion at index 1

Expected:
- Status badge text changes to "Reviewed"
- Indicator dot color is green

Edge cases:
- Single-requirement spec: checking that one criterion immediately yields "Reviewed" status

---

## Flow: Status reverts when a criterion is unchecked
Type: unit
Spec: specs/feature-criteria-validation.md > Requirement: Spec Status Derived from Validation State

Setup:
- SpecDetailView with 2 requirements; validatedIndices = Set([0, 1]) (status is "Reviewed")

Steps:
1. Uncheck criterion at index 1

Expected:
- Status badge text reverts to "In review"
- Indicator dot color changes back to amber/orange

Edge cases:
- Unchecking all criteria one by one eventually reverts to "Draft" with a gray dot

---

## Flow: Status with no criteria defined
Type: unit
Spec: specs/feature-criteria-validation.md > Requirement: Spec Status Derived from Validation State

Setup:
- SpecDetailView rendered with spec markdown that has no `### Requirement:` headers (criteriaCount = 0)

Steps:
1. Render SpecDetailView

Expected:
- Status badge displays "Draft"
- CriteriaProgressBar is not rendered (returns null when total = 0)

Edge cases:
- Markdown with only plain text and no requirement headers → same outcome
