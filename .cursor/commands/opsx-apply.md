---
name: /opsx-apply
id: opsx-apply
category: Workflow
description: Implement tasks from an OpenSpec change
---

Implement tasks from an OpenSpec change.

**Input**: Optionally specify a change name (e.g., `/opsx-apply add-checkout`). If omitted, infer from context or prompt.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context if the user mentioned a change
   - Auto-select if only one active change exists
   - If ambiguous, run `openspec list --json` and use the **AskUserQuestion tool** to let the user select

   Always announce: "Using change: <name>" and how to override (e.g., `/opsx-apply <other>`).
   Change folder: `openspec/changes/<name>/`

2. **Check status**
   ```bash
   openspec status --change "<name>" --json
   ```
   Parse the JSON to understand:
   - `schemaName`: Should be "vantage-spec"
   - Artifact completion: specs, design, tasks must be `done`

3. **Get apply instructions**

   ```bash
   openspec instructions apply --change "<name>" --json
   ```

   This returns:
   - `contextFiles`: artifact file paths to read
   - Progress (total, complete, remaining)
   - Task list with status
   - Dynamic instruction based on current state

   **Handle states:**
   - If `state: "blocked"` (missing artifacts): show message, suggest the missing command
   - If `state: "all_done"`: congratulate, suggest `/opsx-archive`
   - Otherwise: proceed to implementation

4. **Read all context**

   Read the files listed in `contextFiles` (specs, design, tasks), plus:
   - `constitution.md` (project root)
   - `openspec/changes/<name>/contracts/**` (if present)
   - `openspec/changes/<name>/data-model/schema.prisma` (if present)
   - `openspec/changes/<name>/tests/**/*.flow.md` (if present)

5. **Show current progress**

   Display:
   - Schema being used
   - Progress: "N/M tasks complete"
   - Remaining tasks overview
   - Dynamic instruction from CLI

6. **Implement tasks (loop until done or blocked)**

   For each pending task:
   - Show which task is being worked on
   - Make the code changes required
   - Keep changes minimal and focused
   - Mark task complete in the tasks file: `- [ ]` → `- [x]`
   - Continue to next task

   **Special handling for test tasks:**
   Find the corresponding `openspec/changes/<name>/tests/<feature>.flow.md`.
   Translate each `## Flow:` block to actual test code in the project's test framework.
   Write translated test code to the **project source tree** (NOT inside openspec/):
   - `tests/contract/` for Type: contract
   - `tests/unit/` for Type: unit
   - `tests/e2e/` for Type: e2e
   Mapping: `Setup:` → fixtures/beforeEach, `Steps:` → test body,
   `Expected:` → assertions, `Edge cases:` → additional test cases.
   Keep the Flow name as the test description string.

   **Pause if:**
   - Task is unclear → ask for clarification
   - Implementation reveals a design issue → suggest updating artifacts
   - Error or blocker encountered → report and wait for guidance
   - User interrupts

7. **On completion or pause, show status**

   Display:
   - Tasks completed this session
   - Overall progress: "N/M tasks complete"
   - If all done: suggest `/opsx-archive`
   - If paused: explain why and wait for guidance

**Output During Implementation**

```
## Implementing: <change-name> (schema: vantage-spec)

Working on task 3/7: <task description>
[...implementation happening...]
✓ Task complete
```

**Output On Completion**

```
## Implementation Complete

**Change:** <change-name>
**Progress:** 7/7 tasks complete ✓

All tasks complete! Run `/opsx-archive` to archive this change.
```

**Guardrails**
- Keep going through tasks until done or blocked
- Always read ALL context files before starting
- If a task is ambiguous, pause and ask before implementing
- Keep code changes minimal and scoped to each task
- Update task checkbox immediately after completing each task
- Pause on errors, blockers, or unclear requirements — don't guess
- Test translation writes to the project source tree, NOT inside openspec/changes/
- Every `.flow.md` file must result in actual test code — never skip test translation tasks
