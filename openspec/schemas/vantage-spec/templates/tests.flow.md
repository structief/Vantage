# Test flows: <!-- feature name -->

<!-- Generated from specs/feature-<name>.md. Each flow maps to a spec scenario.
     Translated to actual test code during opsx-apply. -->

## Flow: <!-- scenario name from spec -->
Type: unit | contract | e2e
Spec: specs/<!-- feature -->.md > Requirement: <!-- requirement name -->

Setup:
- <!-- precondition, e.g. "user exists with id=123" -->
- <!-- precondition, e.g. "cart contains 2 items" -->

Steps:
1. <!-- action, e.g. "call POST /checkout with valid payload" -->
2. <!-- action, e.g. "receive 200 response" -->

Expected:
- <!-- observable outcome, e.g. "response body contains orderId" -->
- <!-- observable outcome, e.g. "order record created in database" -->

Edge cases:
- <!-- edge case + expected outcome, e.g. "empty cart → 400 with message 'Cart is empty'" -->
