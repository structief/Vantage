---
name: /opsx-generate
id: opsx-generate
category: Workflow
description: Generate contracts, data model, and test flows for a change (after specs + design)
---

Generate contracts, data model (if applicable), and test flows for a change.

All generated files live inside the change folder (`openspec/changes/<name>/`) alongside
specs and design. They are part of the change and archive with it.

---

**Input**: Optionally specify a change name (e.g., `/opsx-generate add-checkout`). If omitted, infer from context or prompt.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context
   - Auto-select if only one active change exists
   - If ambiguous, run `openspec list --json` and use the **AskUserQuestion tool** to select

   Announce: "Generating for change: <name>"
   Change folder: `openspec/changes/<name>/`

2. **Check prerequisites**

   ```bash
   openspec status --change "<name>" --json
   ```

   - `specs` must have `status: "done"` — if not, stop. Run `/opsx-propose` first.
   - `design` must have `status: "done"` — if not, stop. Run `/opsx-propose` first.

3. **Validate requirement sign-off**

   Read all spec files in `openspec/changes/<name>/specs/**/*.md`.

   For each file, scan for requirement titles matching the pattern:
   `### [ ] Requirement: <title>` (unchecked) vs `### [x] Requirement: <title>` (checked).

   - If **any** requirement has `[ ]` (unchecked), stop immediately and report:

     ```
     Cannot generate: the following requirements have not been validated by a functional owner:

     - specs/<file>.md → "<title>"
     - specs/<file>.md → "<title>"

     Check each requirement with [x] before running /opsx-generate.
     ```

   - Only continue if **every** requirement across all spec files has `[x]`.

4. **Read all context**

   - `constitution.md` (project root)
   - `openspec/changes/<name>/specs/**/*.md`
   - `openspec/changes/<name>/design.md`

5. **Determine what to generate**

   Based on specs and design:
   - **Contracts**: Are there API endpoints, events, or shared data schemas? → Yes/No per type
   - **Data model**: Are there new or changed persisted entities? → Yes/No (optional)
   - **Test flows**: Always generate (every spec scenario needs a flow)

6. **Generate contracts** (if applicable)

   Get instructions:
   ```bash
   openspec instructions contracts --change "<name>" --json
   ```

   Write files inside the change folder:
   - `openspec/changes/<name>/contracts/api/<name>.yaml` — OpenAPI 3.0
   - `openspec/changes/<name>/contracts/events/<name>.json` — JSON Schema for events
   - `openspec/changes/<name>/contracts/data/<name>.json` — shared data schemas

   Field names and endpoint paths MUST match spec scenarios exactly.

7. **Generate data model** (if applicable)

   ```bash
   openspec instructions data-model --change "<name>" --json
   ```

   Write to `openspec/changes/<name>/data-model/schema.prisma`.
   Add a comment above each new model referencing the spec requirement.
   If schema.prisma already exists in the change folder, add new models/fields without removing existing ones.

8. **Generate test flows**

   ```bash
   openspec instructions tests --change "<name>" --json
   ```

   Write `openspec/changes/<name>/tests/<feature-name>.flow.md`.
   One flow file per spec file. Each `#### Scenario:` block becomes a `## Flow:` block.

   Flow format:
   ```
   ## Flow: <scenario name>
   Type: unit | contract | e2e
   Spec: specs/<feature>.md > Requirement: <name>

   Setup:
   - <precondition>

   Steps:
   1. <action>

   Expected:
   - <observable outcome>

   Edge cases:
   - <edge case and expected outcome>
   ```

9. **Show summary**

   ```
   ## Generated for: <change-name>

   All files in openspec/changes/<name>/

   ### Contracts
   - contracts/api/checkout.yaml  (3 endpoints)
   - contracts/events/order-placed.json

   ### Data model
   - data-model/schema.prisma  (added: Order, OrderItem)

   ### Test flows
   - tests/checkout.flow.md  (4 flows)
   - tests/user-auth.flow.md  (2 flows)

   Next: run `/opsx-plan` to generate the implementation task list.
   ```

**Guardrails**
- Write to `openspec/changes/<name>/`, never to the project root
- If a file already exists in the change folder, merge new content rather than overwriting
- Flag ambiguous interfaces in a comment in the generated file
- Test flows must be precise enough to translate directly to code — no vague steps
