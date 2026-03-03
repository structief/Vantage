---
name: openspec-init
description: Initialize or update the project constitution. Use when the user wants to define or revise the project's constitution (goals, scope, non-functional requirements, decision principles). Invoked as opsx-init.
license: MIT
compatibility: Requires openspec project (openspec/config.yaml must exist).
metadata:
  author: vantage
  version: "1.0"
---

Create or update `constitution.md` at the project root.

The constitution is the project's "grondwet" - it is written once and only intentionally updated.
It is NOT a per-change artifact. It provides context to all downstream artifacts (specs, design, contracts, tests, tasks).

**Input**: The user's description of what the project/change is about. If no description is given, ask.

**Steps**

1. **Get or confirm the description**

   If the user provided a description, use it.
   Otherwise, use the **AskUserQuestion tool** (open-ended) to ask:
   > "Describe the project (or change to the constitution): what is the goal, what is in scope, what are the key constraints?"

2. **Check if constitution.md already exists**

   Read `constitution.md` from the project root (if it exists).
   - If it exists: this is an UPDATE. Present a diff of what will change. Ask for confirmation before writing.
   - If it doesn't exist: this is a CREATION. Proceed directly.

3. **Write constitution.md**

   Write the file at the project root: `constitution.md`

   Sections:
   - **Goal**: 1-3 sentences. What does this project/change achieve and why does it matter?
   - **Scope**: Bulleted list of what is explicitly in scope. Be concrete about features, capabilities, or boundaries.
   - **Out of scope**: Bulleted list of what is explicitly excluded. Prevents scope creep.
   - **Non-functional requirements**: Performance, security, reliability, scalability constraints.
     Use SHALL/MUST for normative requirements.
   - **Decision principles**: 3-5 guiding principles that steer technical and product decisions.
     Examples: "Prefer explicit contracts over implicit conventions", "No breaking changes to existing consumers".

   Rules:
   - Keep it focused and decisive (max 1-2 pages)
   - Do NOT describe implementation details - those belong in design.md
   - Do NOT list tasks - those belong in plan/tasks.md
   - Every principle must be actionable: someone reading it should know how it guides a decision

4. **Confirm output**

   Show a summary:
   - File written: `constitution.md`
   - Key goal (1 sentence)
   - Scope items count
   - Principles listed

   Suggest next step: "Run opsx:propose to start a change, or describe a feature to create specs."

**Guardrails**
- NEVER update constitution.md automatically during other commands - only opsx-init may write this file
- If the user is vague, ask clarifying questions before writing - a bad constitution misleads everything downstream
- If updating, preserve unchanged sections exactly - only modify what the user explicitly asked to change
