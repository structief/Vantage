## Context

The secondary sidebar (spec: `secondary-sidebar-nav`) lists specs per project group and navigates to `/repo/[owner]/[name]/specs/[spec-slug]` when a spec is clicked. The `specs/page.tsx` stub currently renders a plain heading with no spec content. There is no spec detail view.

Spec files live in the connected repo at `openspec/changes/[change-slug]/specs/[spec-file].md`. The GitHub API is used server-side for all repo content access (`lib/github.ts` + Octokit). `react-markdown` is not yet a dependency.

The shell layout renders `RepoSidebar` and `SecondarySidebar` as persistent navigation. The main content area is rendered by page components. Session and GitHub access token are available server-side via `auth()`.

---

## Goals / Non-Goals

**Goals:**
- Add a `[...specPath]` catch-all route under `/repo/[owner]/[name]/specs/` that renders the spec detail view
- Title section: readable name (from frontmatter `title` or filename), GitHub author + avatar of last committer, last commit date, placeholder status badge
- Criteria progress bar below the title (total count from parsed spec; validated count is placeholder `0`)
- Horizontal tab bar (Overview, Criteria, Contracts, Tests) with numeric badges where applicable
- Overview tab: full markdown body rendered as HTML (frontmatter stripped)
- Criteria tab: list of criteria items parsed from spec markdown
- Contracts tab: list of files from the change's `contracts/` directory
- Tests tab: list of files from the change's `tests/` directory
- "Not found" state when the spec path does not resolve to a file

**Non-Goals:**
- Persisting or editing the status badge (hardcoded `"Draft"` placeholder)
- Making criteria checkboxes interactive (read-only)
- Rendering linked specs or amendment graph navigation
- Comments or review annotation UI

---

## Decisions

### Decision: Catch-all route for spec path
**Choice**: Use `app/(shell)/repo/[owner]/[name]/specs/[...specPath]/page.tsx` where `specPath` encodes the change slug + spec filename (e.g., `secondary-sidebar-nav/feature-secondary-sidebar-nav`).
**Why**: A single-segment `[spec-slug]` cannot distinguish specs with the same filename across different changes. A catch-all preserves the two-level hierarchy (`change-slug/spec-filename`) without encoding tricks, and aligns with the file system structure in the repo.
**Alternatives**: Encode as `change-slug--spec-filename` into a single segment — rejected because double-hyphen encoding is fragile and unreadable in the URL bar.

### Decision: Server component page with client tab component
**Choice**: The page component (`page.tsx`) is an async server component that fetches spec file content and metadata from GitHub, then passes props to a client component `SpecDetailView` for tab state management.
**Why**: Fetching from GitHub (access token, commit history) is cleanest server-side. Tab switching is purely client-side UI state that does not require a network round-trip, so the tab container must be a client component.
**Alternatives**: Full client fetch — rejected because it exposes the GitHub access token to the browser.

### Decision: Fetch spec content + commit info directly in the page server component
**Choice**: The page server component calls two GitHub API endpoints: `repos.getContent` (to retrieve the file blob) and `repos.listCommits` with `path` filter limited to 1 result (to get last committer). Both calls use `lib/github.ts`.
**Why**: These are narrow, targeted queries that fit naturally in a server component. Keeping them out of a dedicated API route avoids an extra HTTP hop.
**Alternatives**: A new `/api/repos/.../spec-content` API route — unnecessary indirection for data only consumed by this one server page.

### Decision: Contracts and tests lists via GitHub API in the page server component
**Choice**: Use `repos.getContent` on `openspec/changes/[change-slug]/contracts` and `openspec/changes/[change-slug]/tests` to list files. If the directory does not exist, return an empty array (GitHub returns a 404).
**Why**: Consistent with how spec content is fetched. No additional API route needed.

### Decision: Markdown rendering with `react-markdown`
**Choice**: Add `react-markdown` as a dependency. Render the spec markdown body in a `ReactMarkdown` client component with Tailwind prose styling (`@tailwindcss/typography`).
**Why**: `react-markdown` is the de-facto standard for safe, React-idiomatic markdown rendering. `@tailwindcss/typography` is already used in many Next.js/Tailwind projects for document-like prose styling and fits the design system.
**Alternatives**: `marked` + `dangerouslySetInnerHTML` — rejected because it requires XSS sanitisation on top.

### Decision: Frontmatter parsed with `gray-matter`
**Choice**: Add `gray-matter` as a dependency to strip and parse YAML frontmatter before rendering markdown and extracting the `title` field.
**Why**: `gray-matter` is the standard frontmatter parser in the JS ecosystem, already referenced in the openspec CLI tooling. Lightweight with zero runtime dependencies.
**Alternatives**: Manual regex split on `---` delimiters — fragile and not worth reinventing.

### Decision: Criteria count parsed from markdown headings
**Choice**: Count `### Requirement:` headers in the spec markdown body to determine total criteria. Validated count is `0` (placeholder) until a persistence layer is added in a future change.
**Why**: The spec format mandates `### Requirement: <name>` for each criterion. Counting these headers is a deterministic, stateless operation that requires no stored state.
**Alternatives**: A dedicated `criteria:` frontmatter array — would require retroactively updating all existing specs; deferred.

### Decision: Status badge hardcoded as "Draft"
**Choice**: Render a static "Draft" status badge in the title section with no interaction.
**Why**: Status lifecycle management (Draft → In Review → Approved) is a separate, larger concern. The spec explicitly calls this a placeholder.

---

## Data model changes

None. No new database tables required. All data is fetched live from the GitHub API.

---

## API changes

No new API routes. Spec content and commit metadata are fetched directly in the server component using `lib/github.ts`.

---

## Risks / Trade-offs

- [GitHub API rate limit] → Two calls per spec page load (content + last commit). Acceptable for small teams (5 000 req/h authenticated). A follow-up can add short-lived SQLite caching.
- [Large spec files] → GitHub's `getContent` API returns base64-encoded blobs up to 1 MB. Specs above this limit will fail gracefully with an error state.
- [react-markdown bundle size] → Adds ~40 KB to the client bundle. Acceptable; the component is only loaded on spec detail pages.
- [Criteria count accuracy] → Counting `### Requirement:` headers works only if spec files follow the mandated format. Malformed specs may yield wrong counts; acceptable for v1 since Vantage enforces the format at authoring time.

---

## Open Questions

- Should `[...specPath]` also handle the case where only a change slug is given (no spec filename), rendering a project/change overview? **Decision**: out of scope for this change; route requires a full `change-slug/spec-filename` path.
- Which GitHub user is shown — the original author (first commit) or the last editor (most recent commit)? **Decision**: last committer, as this reflects who most recently owned the content.
