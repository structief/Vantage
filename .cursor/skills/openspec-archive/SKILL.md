---
name: openspec-archive
description: Archive a completed change after implementation is complete. Use when the user wants to finalize and archive a change.
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: vantage
  version: "1.0"
---

Archive a completed change.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **If no change name provided, prompt for selection**

   Run `openspec list --json` to get available changes. Use the **AskUserQuestion tool** to let the user select.

   Show only active changes (not already archived).

   **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

2. **Check artifact completion status**

   Run `openspec status --change "<name>" --json` to check artifact completion.

   Parse the JSON to understand:
   - `schemaName`: Should be "vantage-spec"
   - `artifacts`: List with their status (`done` or other)

   **If any artifacts are not `done`:**
   - Display warning listing incomplete artifacts
   - Use **AskUserQuestion tool** to confirm user wants to proceed
   - Proceed if user confirms

3. **Check task completion status**

   Read `openspec/changes/<name>/plan/tasks.md` to check for incomplete tasks.

   Count tasks marked with `- [ ]` (incomplete) vs `- [x]` (complete).

   **If incomplete tasks found:**
   - Display warning showing count of incomplete tasks
   - Use **AskUserQuestion tool** to confirm user wants to proceed
   - Proceed if user confirms

   **If no tasks file exists:** Proceed without task-related warning.

4. **Note project root files**

   The following files were written to the project root by `opsx-generate` and are NOT inside
   the change directory — they do NOT move during archive:
   - `contracts/**`
   - `data-model/schema.prisma`
   - `tests/**/*.flow.md` and translated test files in `tests/contract/`, `tests/unit/`, `tests/e2e/`

   Inform the user that these project root files are permanent and remain in place.

5. **Assess delta spec sync state**

   Check for delta specs at `openspec/changes/<name>/specs/`. If none exist, proceed without sync prompt.

   **If delta specs exist:**
   - Compare each delta spec with its corresponding main spec at `openspec/specs/<capability>/spec.md`
   - Determine what changes would be applied (adds, modifications, removals, renames)
   - Show a combined summary before prompting

   **Prompt options:**
   - If changes needed: "Sync now (recommended)", "Archive without syncing"
   - If already synced: "Archive now", "Sync anyway", "Cancel"

   If user chooses sync, use Task tool (subagent_type: "general-purpose", prompt: "Use Skill tool to invoke openspec-sync-specs for change '<name>'. Delta spec analysis: <include the analyzed delta spec summary>"). Proceed to archive regardless of choice.

6. **Perform the archive**

   Create the archive directory if it doesn't exist:
   ```bash
   mkdir -p openspec/changes/archive
   ```

   Generate target name using current date: `YYYY-MM-DD-<change-name>`

   **Check if target already exists:**
   - If yes: Fail with error, suggest renaming existing archive or using different date
   - If no: Move the change directory to archive

   ```bash
   mv openspec/changes/<name> openspec/changes/archive/YYYY-MM-DD-<name>
   ```

7. **Display summary**

   Show archive completion summary including:
   - Change name and schema
   - Archive location
   - Spec sync status (synced / skipped / no delta specs)
   - Note about project root files (contracts, data-model, tests) that remain in place
   - Note about any warnings (incomplete artifacts/tasks)

**Output On Success**

```
## Archive Complete

**Change:** <change-name>
**Schema:** vantage-spec
**Archived to:** openspec/changes/archive/YYYY-MM-DD-<name>/
**Specs:** ✓ Synced to main specs

**Project root files (not archived, remain in place):**
- contracts/
- data-model/schema.prisma
- tests/

All artifacts complete. All tasks complete.
```

**Guardrails**
- Always prompt for change selection if not provided
- Use artifact graph (`openspec status --json`) for completion checking
- Don't block archive on warnings - just inform and confirm
- Preserve `.openspec.yaml` when moving to archive (it moves with the directory)
- Project root files (contracts, data-model, tests) are NOT part of the change folder — never attempt to move them
- If delta specs exist, always run the sync assessment and show the combined summary before prompting
