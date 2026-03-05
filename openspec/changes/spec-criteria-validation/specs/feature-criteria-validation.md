## ADDED Requirements

### Requirement: Criteria Checkbox Toggle
Each criterion row in the Criteria tab SHALL render an interactive checkbox. Clicking an unchecked checkbox SHALL mark that criterion as validated; clicking a checked checkbox SHALL mark it as unvalidated. The validated state for each criterion SHALL be stored locally in the browser (client-side state) for the duration of the session.

#### Scenario: Checking a criterion
- **WHEN** the user clicks an unchecked checkbox on a criterion row
- **THEN** the checkbox SHALL appear checked/filled, and the criterion status badge SHALL change from "pending" to "validated"

#### Scenario: Unchecking a criterion
- **WHEN** the user clicks a checked checkbox on a criterion row
- **THEN** the checkbox SHALL appear unchecked/empty, and the criterion status badge SHALL change from "validated" back to "pending"

### Requirement: Criteria Validation Progress Bar
The `CriteriaProgressBar` component SHALL reflect the number of validated criteria in real time. As users check or uncheck criteria, the progress bar fill and the "X of Y criteria validated" counter SHALL update immediately.

#### Scenario: Progress bar advances on validation
- **WHEN** the user checks one or more criteria checkboxes
- **THEN** the progress bar fill SHALL increase proportionally and the validated count in the label SHALL increment accordingly

#### Scenario: Progress bar resets on uncheck
- **WHEN** the user unchecks a previously checked criterion
- **THEN** the progress bar fill SHALL decrease proportionally and the validated count SHALL decrement accordingly

#### Scenario: Progress bar full when all validated
- **WHEN** all criteria are marked as validated
- **THEN** the progress bar SHALL be 100% filled and SHALL render in green

### Requirement: Spec Status Derived from Validation State
The spec status badge displayed in `SpecTitleSection` SHALL be computed from the ratio of validated criteria to total criteria. The status SHALL follow these rules:
- **Draft**: zero criteria validated (or no criteria defined)
- **In review**: at least one but not all criteria validated
- **Reviewed**: all criteria validated

The status badge SHALL update in real time as criteria are checked or unchecked. The visual indicator dot SHALL change color to reflect the status: gray for Draft, amber/orange for In review, green for Reviewed.

#### Scenario: Status is Draft with no validated criteria
- **WHEN** no criteria have been checked
- **THEN** the status badge SHALL display "Draft" with a gray dot

#### Scenario: Status transitions to In review
- **WHEN** at least one criterion is checked but at least one remains unchecked
- **THEN** the status badge SHALL display "In review" with an amber/orange dot

#### Scenario: Status transitions to Reviewed
- **WHEN** all criteria are checked
- **THEN** the status badge SHALL display "Reviewed" with a green dot

#### Scenario: Status reverts when a criterion is unchecked
- **WHEN** the user unchecks a criterion while status is "Reviewed"
- **THEN** the status badge SHALL revert to "In review" with an amber/orange dot

#### Scenario: Status with no criteria defined
- **WHEN** the spec has no parseable criteria/requirements
- **THEN** the status badge SHALL display "Draft" and the progress bar SHALL not be rendered
