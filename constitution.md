# Constitution — Vantage

## Goal

Vantage is a lightweight React + Next.js application that gives teams a structured vantage point over their project specs: visualise openspec-formatted specifications stored in a git repository, author and edit specs collaboratively, and drive each spec through a tracked review-and-approval lifecycle that culminates in a pull request — making every merged spec the verified source of truth.

---

## Scope

- **Spec visualisation**: render openspec markdown specs from a connected git repository, with dependency and amendment graph navigation.
- **Spec authoring**: create, edit, and version specs inside Vantage; every save commits to the spec branch with an auto-generated commit message.
- **Amendment lifecycle**: support the `base / -a1 / -a2` naming convention; auto-link amendments to their parent spec; surface lifecycle state (in-progress, approved, merged, deferred).
- **Deferred sections**: extract a spec section into a new amendment file; initialise it with a structured frontmatter block (parent, deferred-from-section, deferred-by, deferred-date, reason); insert a `see-also` reference in the originating spec.
- **Review and approval**: per-section commenting and flagging via git notes (keeping file diffs clean); track required-reviewer sign-off per section.
- **PR automation**: when all required sections are approved, open a PR (spec branch → main) with an auto-generated description derived from the discussion log.
- **CI integration**: PR triggers contract-test validation, schema validation, and test-scaffold regeneration.
- **Local SQLite persistence**: all application state (review status, comments, user preferences) stored in a local embedded SQLite database (Prisma + `better-sqlite3`) — no external database or service required.
- **Machine-readable naming**: spec filenames follow `<slug>.md` / `<slug>-a<n>.md` convention, enforced by Vantage, to support graph construction and PR-description generation.
- **Authentication**: lightweight GitHub OAuth login; identity is resolved from the GitHub account that owns or has access to the connected repository — no user registration or separate identity store required. GitHub is the identity provider.

## Out of scope

- Initial spec creation (specs are authored externally and committed to the repository before Vantage picks them up — Vantage owns the editing and approval lifecycle, not the bootstrap).
- Hosting or managing the git remote (Vantage connects to an existing remote; it does not provision repos).
- Custom user registration or a proprietary identity store (GitHub OAuth covers all identity needs).
- Real-time collaborative editing (concurrent multi-user editing is deferred; git commit history is the conflict-resolution mechanism for now).
- Contract test execution inside Vantage (CI runs tests; Vantage only surfaces results).
- External issue tracker or project management integrations.

---

## Non-functional requirements

- **Performance**: the UI MUST render a spec list of up to 500 files and open a single spec in under 300 ms on a mid-range laptop.
- **Lightweight runtime**: the application SHALL run without a remote database or proprietary cloud services; GitHub OAuth is the only external dependency permitted for identity. A `next dev` or `next start` command is the only runtime requirement beyond that.
- **Git fidelity**: every user action that changes spec content MUST result in a traceable git commit; Vantage SHALL never modify spec files without producing a commit.
- **Naming enforcement**: Vantage MUST reject (with a clear error) any spec filename that does not conform to the `<slug>.md` / `<slug>-a<n>.md` convention.
- **Frontmatter integrity**: deferred-section specs MUST be initialised with all required frontmatter fields (parent, deferred-from-section, deferred-by, deferred-date, reason) before the file is committed.
- **Resilience**: loss of the local SQLite database MUST NOT corrupt the git repository; the git repo is the authoritative source and state can be rebuilt from it.

---

## User interface
Style Category: Modern SaaS / Productivity UI — Clean Utilitarian with Premium Restraint. Use ShadCN or Tailwind.

### Typography

Primary typeface: Geometric sans-serif — likely Inter or a close variant, though used with enough restraint that it reads as refined rather than generic
Weight hierarchy: Medium/semibold for titles, regular for body, light for metadata/timestamps
Size scale: Tight and dense — this is information-dense UI, not a marketing site. Metadata is ~11–12px, body ~13–14px, headings ~16–20px
Color usage in type: Near-black (#1a1a1a or similar) for primary text; mid-gray (#6b7280 range) for secondary/metadata; accent colors used sparingly for tags and highlights


### Color System

Background: Near-white (#f4f4f5 or #f9f9f9) outer canvas; pure white (#ffffff) for card/panel surfaces
Borders: Very subtle — 1px at ~10–15% opacity, not harsh lines
Accent palette: Multicolor gradient avatars/icons (pink-orange-yellow mesh gradients) used consistently as brand identifiers for workspaces, users, and apps — this is a deliberate motif, not decoration
Status colors: Green dot for active, orange for in-progress, standard semantic use
Interactive elements: Dark filled buttons (near-black) for primary CTAs; ghost/outlined for secondary


### Spatial & Layout

Density: Medium-high — content is packed but breathing room is allocated carefully through consistent 16–24px padding units
Panel structure: Left sidebar navigation + center content + optional right panel (three-column on complex views)
Card style: Flat, white, subtle border-radius (~8–10px), no drop shadows or very faint ones — elevation is implied, not stated
Grid: Structured columns with clear alignment; no decorative asymmetry


### Component Patterns

Navigation: Icon-based vertical sidebar (left) + horizontal tab bar (top of content area) — dual-layer navigation
Tags/labels: Small pill badges, low-contrast fill, used for categorization
Keyboard shortcuts: Exposed inline (⌘K, TAB, ESC) — signals power-user orientation
Dropdown menus: Clean, borderless float with numbered keyboard shortcuts visible — very Linear/Notion-adjacent
Toggles: Standard iOS-style toggles in settings
Command palette: Spotlight-style overlay — categorized, numbered results, action hints at bottom


### Overall Aesthetic DNA
The system reads as a Linear/Notion/Clay hybrid — power-user productivity software that communicates competence through restraint.
The pink-purple gradient mesh avatars are the only expressive element; everything else is disciplined and functional. 
No decorative flourishes, no hero imagery except in the landing page, which breaks slightly into marketing territory with an animated gradient word.
The design avoids both enterprise ugliness and consumer playfulness — it occupies the "professional tool for thoughtful teams" space deliberately.

---

## Testing

Three test layers, one framework where possible:

- **Unit tests** — [Vitest](https://vitest.dev). ESM-native, no transform config, Jest-compatible API. Covers all pure logic: lib utilities, NextAuth callbacks, data helpers.
- **Contract tests** — Vitest + [Supertest](https://github.com/ladjs/supertest). Asserts that Next.js API route responses match the OpenAPI contracts defined in `contracts/api/`. No browser required.
- **E2E tests** — [Playwright](https://playwright.dev). Covers full browser flows: OAuth login/logout, route protection, session persistence, UI rendering. Run against `next start` in CI.

Test files live in the project `tests/` directory:
```
tests/
  unit/
  contract/
  e2e/
```

Test flows (`.flow.md` in `openspec/changes/<name>/tests/`) are the human-readable specification; they are translated to executable code during `opsx-apply`.

---

## Decision principles

1. **Git is the single source of truth.** UI state is derived from the repo; the repo is never derived from UI state. When in doubt, read git.

2. **Keep the runtime slim.** Prefer embedded, local-first solutions over networked services. Every new dependency must justify its weight against the goal of `next start` being the full deployment story.

3. **Machine-readability is a first-class concern.** Naming conventions, frontmatter schemas, and branch patterns are enforced by Vantage — not left to human discipline — because the dependency graph, PR descriptions, and CI hooks all depend on them being consistent.

4. **Deferral is explicit, not silent.** Deferred sections carry a structured reason; incomplete specs are surfaced as a project-health signal, not hidden. A spec should never be merged with unresolved ambiguity.

5. **The PR is the contract gate.** A spec becomes authoritative only after its PR is merged into main. Vantage automates the PR lifecycle but never bypasses the review step.
