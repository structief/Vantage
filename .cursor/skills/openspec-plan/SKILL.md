---
name: openspec-plan
description: Generate the implementation task list for a change. Use when the user wants to create or regenerate plan/tasks.md. Should be run after opsx-generate (contracts, data-model, and test flows) is complete. Invoked as opsx-plan.
license: MIT
compatibility: Requires openspec CLI. Specs and design must exist for the change.
metadata:
  author: vantage
  version: "1.0"
---

Generate `plan/tasks.md` for a change — the actionable implementation checklist.

Tasks are the LAST artifact before apply. They are generated after specs, design, contracts,
data-model, and test flows are all in place. Running opsx-plan with partial context produces
incomplete tasks; running it after opsx-generate produces complete tasks.

**Input**: Optionally specify a change name. If omitted, infer from context or prompt.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context
   - Auto-select if only one active change exists
   - If ambiguous, run `openspec list --json` and use the **AskUserQuestion tool** to select

   Announce: "Planning change: <name>"
   Change folder: `openspec/changes/<name>/`

2. **Check prerequisites**

   ```bash
   openspec status --change "<name>" --json
   ```

   - `specs` must have `status: "done"` — if not, stop and tell the user.
   - `design` must have `status: "done"` — if not, stop and tell the user.
   - Check for contracts, data-model, and test flows inside the change folder:
     - `openspec/changes/<name>/contracts/`
     - `openspec/changes/<name>/data-model/schema.prisma`
     - `openspec/changes/<name>/tests/*.flow.md`
   - If any are missing, warn: "Contracts / data-model / test flows not found in change folder.
     Run opsx-generate first for complete tasks. Continuing with available context."

3. **Read all available context**

   Read in this order (skip files that don't exist):
   - `constitution.md` (project root)
   - `openspec/changes/<name>/specs/**/*.md`
   - `openspec/changes/<name>/design.md`
   - `openspec/changes/<name>/contracts/**`
   - `openspec/changes/<name>/data-model/schema.prisma`
   - `openspec/changes/<name>/tests/**/*.flow.md`

4. **Get task instructions**

   ```bash
   openspec instructions tasks --change "<name>" --json
   ```

   Note the `outputPath` from the response — write tasks there.

5. **Generate plan/tasks.md**

   Write to `openspec/changes/<name>/plan/tasks.md`.
   Group tasks in this order:
   - **Data model**: schema.prisma updates and migrations (if data-model exists)
   - **Contracts**: API YAML, event/data JSON files (if contracts exist)
   - **Implementation**: core logic, services, endpoints
   - **Tests**: translating each `.flow.md` to test code (one task per flow file, broken into unit/contract/e2e groups)
   - **Integration**: wiring, configuration, deployment concerns

   Rules:
   - Every task MUST use checkbox format: `- [ ] X.Y Task description`
   - Every test flow file MUST have a corresponding translation task
   - Tasks should be small enough to complete in one session
   - Order by dependency (what must be done first?)

   Example:
   ```
   ## 1. Data model

   - [ ] 1.1 Add Order and OrderItem models to data-model/schema.prisma
   - [ ] 1.2 Write migration 002_add_orders.sql

   ## 2. Contracts

   - [ ] 2.1 Finalize contracts/api/checkout.yaml
   - [ ] 2.2 Finalize contracts/events/order-placed.json

   ## 3. Implementation

   - [ ] 3.1 Implement CheckoutService.process()
   - [ ] 3.2 Wire POST /checkout route

   ## 4. Tests

   - [ ] 4.1 Translate tests/checkout.flow.md → project tests/contract/checkout.contract.test
   - [ ] 4.2 Translate tests/checkout.flow.md → project tests/unit/checkout.test
   ```

6. **Show summary**

   ```
   ## Tasks ready: <change-name>

   openspec/changes/<name>/plan/tasks.md — N tasks across M groups

   Context used:
   ✓ specs   ✓ design   [✓/–] contracts   [✓/–] data-model   [✓/–] test flows

   Run `/opsx-apply` to start implementing.
   ```

**Guardrails**
- Always warn if contracts/data-model/tests are missing — don't silently generate incomplete tasks
- Never remove existing task checkboxes that are already `- [x]` (complete) if regenerating
- If regenerating (plan/tasks.md already exists), ask for confirmation before overwriting
- Each test flow file MUST result in at least one implementation task
- The test tasks describe translating flows to code in the PROJECT source tree — not inside openspec/
