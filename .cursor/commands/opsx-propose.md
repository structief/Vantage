---
name: /opsx-propose
id: opsx-propose
category: Workflow
description: Start a new change - create it and generate specs and design
---

Start a new change - create the change directory and generate specs and design.

I'll create a change with:
- specs/ (what the system must do)
- design.md (how to build it)

After this: run `/opsx-generate` to create contracts, data model, and test flows.
Then run `/opsx-plan` to create the implementation task list.

---

**Input**: The argument after `/opsx-propose` is the change name (kebab-case), OR a description of what the user wants to build.

**Steps**

1. **If no input provided, ask what they want to build**

   Use the **AskUserQuestion tool** (open-ended, no preset options) to ask:
   > "What change do you want to work on? Describe what you want to build or fix."

   From their description, derive a kebab-case name (e.g., "add user authentication" → `add-user-auth`).

   **IMPORTANT**: Do NOT proceed without understanding what the user wants to build.

2. **Create the change directory**
   ```bash
   openspec new change "<name>"
   ```
   This creates a scaffolded change at `openspec/changes/<name>/` with `.openspec.yaml`.

3. **Get the artifact build order**
   ```bash
   openspec status --change "<name>" --json
   ```
   Parse the JSON to get:
   - `artifacts`: list of all artifacts with their status and dependencies

4. **Create specs and design only**

   Use the **TodoWrite tool** to track progress.

   Create artifacts in dependency order, stopping after design is complete:

   a. **For each artifact in [`specs`, `design`]**:
      - Get instructions:
        ```bash
        openspec instructions <artifact-id> --change "<name>" --json
        ```
      - The instructions JSON includes:
        - `context`: Project background (constraints for you - do NOT include in output)
        - `rules`: Artifact-specific rules (constraints for you - do NOT include in output)
        - `template`: The structure to use for your output file
        - `instruction`: Schema-specific guidance for this artifact type
        - `outputPath`: Where to write the artifact
        - `dependencies`: Completed artifacts to read for context
      - Also read `constitution.md` from the project root before creating each artifact
      - Read any completed dependency files for context
      - Create the artifact file using `template` as the structure
      - Apply `context` and `rules` as constraints - do NOT copy them into the file
      - Show brief progress: "Created <artifact-id>"

   b. **Stop after design is created** - do NOT continue to contracts, data-model, tests, or tasks

   c. **If an artifact requires user input** (unclear context):
      - Use **AskUserQuestion tool** to clarify
      - Then continue

5. **Show final status**
   ```bash
   openspec status --change "<name>"
   ```

**Output**

After creating specs and design:

```
## Change ready: <change-name>

**Created:**
- specs/<feature>.md
- design.md

**Next steps (in order):**
1. `/opsx-generate` — generate contracts, data model, and test flows
2. `/opsx-plan` — generate the implementation task list
3. `/opsx-apply` — implement tasks
```

**Artifact Creation Guidelines**

- Follow the `instruction` field from `openspec instructions` for each artifact type
- Always read `constitution.md` from the project root before creating any artifact
- Read dependency artifacts for context before creating new ones
- Use `template` as the structure for your output file - fill in its sections
- **IMPORTANT**: `context` and `rules` are constraints for YOU, not content for the file
  - Do NOT copy `<context>`, `<rules>`, `<project_context>` blocks into the artifact

**Guardrails**
- Only create `specs` and `design` - stop there
- Never auto-create contracts, data-model, tests, or tasks — those have dedicated commands
- Always read `constitution.md` for context before writing artifacts
- If a change with that name already exists, ask if user wants to continue it or create a new one
- Verify each artifact file exists after writing before proceeding to next
