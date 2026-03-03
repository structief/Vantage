---
name: /opsx-plan
id: opsx-plan
category: Workflow
description: Generate the implementation task list for a change (after opsx-generate)
---

Generate `plan/tasks.md` — the actionable implementation checklist.

Run this after `/opsx-generate` has created contracts, data model, and test flows.
Tasks are the last artifact before implementation begins.

---

**Input**: Optionally specify a change name (e.g., `/opsx-plan add-checkout`). If omitted, infer from context or prompt.

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
     Run `/opsx-generate` first for complete tasks. Continuing with available context."

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

5. **Generate plan/tasks.md**

   Write to `openspec/changes/<name>/plan/tasks.md`.
   Every task MUST use checkbox format: `- [ ] X.Y Task description`
   Every test flow file MUST have a corresponding translation task.

6. **Show summary**

   ```
   ## Tasks ready: <change-name>

   openspec/changes/<name>/plan/tasks.md — N tasks across M groups

   Context used:
   ✓ specs   ✓ design   [✓/–] contracts   [✓/–] data-model   [✓/–] test flows

   Run `/opsx-apply` to start implementing.
   ```

**Guardrails**
- Warn if contracts/data-model/tests are missing — don't silently generate incomplete tasks
- Never remove `- [x]` completed tasks if regenerating
- If plan/tasks.md already exists, ask for confirmation before overwriting
- Each test flow file MUST result in at least one implementation task
- Test tasks describe translating flows to code in the PROJECT source tree — not inside openspec/
