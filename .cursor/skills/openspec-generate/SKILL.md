---
name: openspec-generate
description: Generate contracts, data model, and test flows for a change. Use when the user wants to generate or regenerate contracts (API/event/data), data model (Prisma schema), and test flows from the specs and design. Invoked as opsx-generate.
license: MIT
compatibility: Requires openspec CLI. Specs and design must exist for the change.
metadata:
  author: vantage
  version: "1.0"
---

Generate contracts, data model (if applicable), and test flows for a change.

All generated files live inside the change folder: `openspec/changes/<name>/`.
They are part of the change and move with it when archived.

**Input**: Optionally specify a change name. If omitted, infer from context or prompt.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context
   - Auto-select if only one active change exists
   - If ambiguous, run `openspec list --json` and use the **AskUserQuestion tool** to let the user select

   Announce: "Generating for change: <name>"
   Change folder: `openspec/changes/<name>/`

2. **Check prerequisites**

   ```bash
   openspec status --change "<name>" --json
   ```

   - Check that `specs` artifact has `status: "done"`. If not: stop and tell the user to create specs first.
   - Check that `design` artifact has `status: "done"`. If not: stop and tell the user to create design first.

3. **Read all context**

   Read in this order:
   - `constitution.md` (project root)
   - `openspec/changes/<name>/specs/**/*.md`
   - `openspec/changes/<name>/design.md`

4. **Determine what to generate**

   Based on the specs and design, decide:
   - **Contracts**: Are there API endpoints, events, or shared data schemas? → Yes/No per type (api, events, data)
   - **Data model**: Are there new or changed persisted entities? → Yes/No (optional)
   - **Test flows**: Always yes (every spec scenario needs a flow)

   If unclear whether a data model is needed, check the "Data model changes" section in design.md.

5. **Generate contracts** (if applicable)

   Get instructions:
   ```bash
   openspec instructions contracts --change "<name>" --json
   ```

   Write contract files inside the change folder:
   - `openspec/changes/<name>/contracts/api/<name>.yaml` — OpenAPI 3.0
   - `openspec/changes/<name>/contracts/events/<name>.json` — JSON Schema for events
   - `openspec/changes/<name>/contracts/data/<name>.json` — JSON Schema for shared data structures

   Rules:
   - Field names and endpoint paths MUST match the spec scenarios exactly
   - Every endpoint/event in the specs needs a corresponding contract entry
   - Be precise about required fields, types, and error responses

6. **Generate data model** (if applicable)

   If data model changes are needed:
   ```bash
   openspec instructions data-model --change "<name>" --json
   ```

   Write to `openspec/changes/<name>/data-model/schema.prisma`.

   Rules:
   - Add a comment above each new model referencing the spec requirement
   - Derive model/field names from the spec requirements
   - Include a migration note at the top of the file
   - If schema.prisma already exists in the change folder, add new models/fields without removing existing ones

7. **Generate test flows**

   ```bash
   openspec instructions tests --change "<name>" --json
   ```

   Write flow files to `openspec/changes/<name>/tests/<feature-name>.flow.md`.
   One flow file per spec file. Each `#### Scenario:` block in the spec becomes a `## Flow:` block.

   Rules:
   - Type assignment: "contract" if the scenario tests an API/event contract, "e2e" if cross-system, "unit" otherwise
   - Steps must be precise enough that a developer can write the test without reading the spec
   - Expected outcomes must include exact field names, status codes, and error messages from the spec
   - Reference the contract file where applicable (e.g., "See contracts/api/checkout.yaml")

8. **Show summary**

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

   Next: run opsx-plan to generate the implementation task list.
   ```

**Guardrails**
- Always read specs AND design before generating — contracts must be consistent with both
- Write to `openspec/changes/<name>/`, never to the project root
- If a file already exists in the change folder, merge new content rather than overwriting
- If specs are ambiguous about an interface, note it in a comment in the generated file and flag it in the summary
- Contracts are the implementation target — be precise, not aspirational
- Test flows translate directly to code in apply — every step must be concrete and unambiguous
