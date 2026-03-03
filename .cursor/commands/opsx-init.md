---
name: /opsx-init
id: opsx-init
category: Workflow
description: Initialize or update the project constitution (goals, scope, principles)
---

Create or update `constitution.md` at the project root.

The constitution is the project's "grondwet" — it is written deliberately and only updated intentionally.
It provides context to all downstream artifacts: specs, design, contracts, tests, and tasks.

---

**Input**: A description of the project or the change to the constitution. If not provided, ask.

**Steps**

1. **Get or confirm the description**

   If the user provided a description, use it.
   Otherwise, use the **AskUserQuestion tool** (open-ended) to ask:
   > "Describe the project (or what should change in the constitution): what is the goal, what is in scope, what are the key constraints?"

2. **Check if constitution.md already exists**

   Read `constitution.md` from the project root (if it exists).
   - If it exists: this is an UPDATE. Show what will change and ask for confirmation before writing.
   - If it doesn't exist: this is a CREATION. Proceed directly.

3. **Write constitution.md**

   Write the file at the project root: `constitution.md`

   Sections:
   - **Goal**: 1-3 sentences. What does this project achieve and why does it matter?
   - **Scope**: Bulleted list of what is explicitly in scope.
   - **Out of scope**: Bulleted list of what is explicitly excluded.
   - **Non-functional requirements**: Performance, security, reliability constraints. Use SHALL/MUST.
   - **Decision principles**: 3-5 guiding principles for technical and product decisions.

   Rules:
   - Keep it focused (max 1-2 pages)
   - No implementation details — those belong in design.md
   - No tasks — those belong in plan/tasks.md
   - Every principle must be actionable

4. **Confirm output**

   Show:
   - File written: `constitution.md`
   - Key goal (1 sentence)
   - Scope item count
   - Principles listed

   Suggest next step: "Run `/opsx-propose` to start a change."

**Guardrails**
- NEVER update constitution.md automatically during other commands — only opsx-init may write this file
- Ask clarifying questions if the description is vague — a bad constitution misleads everything downstream
- If updating, preserve unchanged sections exactly
