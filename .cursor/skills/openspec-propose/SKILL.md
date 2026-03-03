---
name: openspec-propose
description: Start a new change - create it and generate specs and design. Use when the user wants to begin working on a feature or fix. Stops after design; use opsx-generate then opsx-plan before implementing.
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: vantage
  version: "1.0"
---

Start a new change - create the change directory and generate specs and design.

Artifacts created: `specs/` (what the system must do) and `design.md` (how to build it).

After this: run opsx-generate to create contracts, data model, and test flows.
Then run opsx-plan to create the implementation task list.

---

**Input**: The user's request should include a change name (kebab-case) OR a description of what they want to build.

**Steps**

1. **If no clear input provided, ask what they want to build**

   Use the **AskUserQuestion tool** (open-ended, no preset options) to ask:
   > "What change do you want to work on? Describe what you want to build or fix."

   From their description, derive a kebab-case name (e.g., "add user authentication" → `add-user-auth`).

   **IMPORTANT**: Do NOT proceed without understanding what the user wants to build.

2. **Create the change directory**
   ```bash
   openspec new change "<name>"
   ```
   This creates a scaffolded change at `openspec/changes/<name>/` with `.openspec.yaml`.

3. **Get the artifact list**
   ```bash
   openspec status --change "<name>" --json
   ```
   Parse the JSON to get:
   - `artifacts`: list of all artifacts with their status and dependencies

4. **Create specs and design only**

   Use the **TodoWrite tool** to track progress.

   Create artifacts in dependency order, stopping after design:

   a. **For each artifact in [`specs`, `design`]**:
      - Get instructions:
        ```bash
        openspec instructions <artifact-id> --change "<name>" --json
        ```
      - The instructions JSON includes:
        - `context`: Project background (constraints - do NOT include in output)
        - `rules`: Artifact-specific rules (constraints - do NOT include in output)
        - `template`: The structure to use for the output file
        - `instruction`: Schema-specific guidance for this artifact type
        - `outputPath`: Where to write the artifact
        - `dependencies`: Completed artifacts to read for context
      - Read `constitution.md` from the project root for context
      - Read any completed dependency files for context
      - Create the artifact file using `template` as the structure
      - Apply `context` and `rules` as constraints - do NOT copy them into the file
      - Show brief progress: "Created <artifact-id>"

   b. **Stop after design** - do NOT continue to contracts, data-model, tests, or tasks

   c. **If an artifact requires user input** (unclear context):
      - Use **AskUserQuestion tool** to clarify
      - Then continue

5. **Show final status**
   ```bash
   openspec status --change "<name>"
   ```

**Output**

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
- Always read `constitution.md` from the project root before writing any artifact
- Read dependency artifacts for context before creating new ones
- Use `template` as the structure for your output file - fill in its sections
- **IMPORTANT**: `context` and `rules` are constraints for YOU, not content for the file

**Guardrails**
- Only create `specs` and `design` — stop there
- Never auto-create contracts, data-model, tests, or tasks — those have dedicated commands
- Always read `constitution.md` for context before writing artifacts
- If a change with that name already exists, ask if user wants to continue it or create a new one
- Verify each artifact file exists after writing before proceeding to next
