## Context

The app currently has a stub `SpecsPage` at `/repo/[owner]/[name]/specs` that renders only a heading and the repo name. The secondary sidebar already navigates users to this route via the "All Specs" link, and the PROJECTS section in the sidebar links individual specs to `/repo/[owner]/[name]/specs/[spec-slug]`. Both destinations are stubs today.

The existing `GET /api/repos/[encodedFullName]/projects` endpoint scans `openspec/changes/` for top-level change directories and returns their spec counts. It does not recurse into subdirectories and does not return individual spec file entries.

`lib/github.ts` provides an Octokit-based pattern; the projects route demonstrates how to use `octokit.rest.repos.getContent` with the user's session access token.

---

## Goals / Non-Goals

**Goals:**
- Build out the All Specs page (`/repo/[owner]/[name]/specs`) to show a full spec listing grouped by project group where applicable
- Show both active specs (changes directly under `openspec/changes/`) and archived specs (changes under `openspec/changes/archive/`) with visual distinction
- Render each spec item with a document icon and its slug
- Create a new spec detail page (`/repo/[owner]/[name]/specs/[slug]`) that shows the spec's slug and its title (extracted from the first `# Heading` in the file, with fallback to slug)
- Add a new API endpoint that returns the full grouped spec listing

**Non-Goals:**
- Full spec content rendering (markdown viewer) — deferred
- Editable spec content
- Real-time updates; a page load is sufficient
- Caching the spec listing beyond a single request

---

## Decisions

### Decision: New `/specs` API endpoint, separate from `/projects`
**Choice**: Create `GET /api/repos/[encodedFullName]/specs` that returns a flat list of spec entries with `{ slug, group, path, status }` fields.
**Why**: The existing `/projects` endpoint returns change-level data (slug + specCount) for the sidebar's PROJECTS section. The All Specs page needs file-level data (one entry per spec `.md` file). Mixing concerns in the same endpoint would complicate both consumers.
**Alternatives**: Extend `/projects` to include spec file lists — rejected because the response shape diverges significantly from the sidebar's needs.

### Decision: Grouping logic driven by subdirectory depth
**Choice**: A spec is "ungrouped" (active) when its parent change directory is a direct child of `openspec/changes/`. A spec is "archived" when its parent change directory is nested under `openspec/changes/archive/`. A spec is assigned a named group when its parent change directory is nested under any other subdirectory of `openspec/changes/` (e.g. `openspec/changes/auth/login-flow/` → group `auth`).
**Why**: This mirrors the directory convention already established in the codebase and avoids requiring any metadata file to describe grouping.
**Alternatives**: Read a metadata/config file from the repo — rejected because it adds a dependency on a file that may not exist.

### Decision: Title fetched on spec selection, not at list time
**Choice**: The `/specs` listing endpoint does NOT read spec file contents. When a spec is selected and the detail page (`/repo/[owner]/[name]/specs/[slug]`) renders, a separate request fetches the file content and extracts the title.
**Why**: Fetching every spec file's content at list time would require N+1 GitHub API calls (one per spec), hitting rate limits quickly for repos with many specs. Lazy-loading title on selection keeps the listing fast.
**Alternatives**: Store titles in the listing via parallel file fetches — rejected due to API cost. Read only the first line via the raw GitHub content URL — viable but adds per-file API calls at list time, rejected for same reason.

### Decision: Spec detail page at `/specs/[slug]`
**Choice**: Create `app/(shell)/repo/[owner]/[name]/specs/[slug]/page.tsx`. It receives the slug from the URL, calls `GET /api/repos/[encodedFullName]/spec-content?path=<path>` to fetch the raw file, extracts the first `# Heading` as the title, and renders slug + title.
**Why**: A URL-based detail page is linkable and consistent with the secondary sidebar's navigation target (`/repo/[owner]/[name]/specs/[spec-slug]`). It also means the selected-item highlight in the spec list is driven by `usePathname()`, consistent with how active navigation links are detected elsewhere.
**Alternatives**: In-page master-detail panel using React state — rejected because it produces a non-linkable selected state and diverges from the sidebar's navigation contract.

### Decision: New `/spec-content` API endpoint for single file content
**Choice**: Create `GET /api/repos/[encodedFullName]/spec-content?path=<encoded-path>` that fetches a single file by its full path in the repo and returns its raw text content.
**Why**: Keeps the GitHub access token server-side. The detail page is a server component that can call this endpoint during render, or a client component using SWR.
**Alternatives**: Client-side direct GitHub raw URL — requires exposing the access token to the browser; rejected. GitHub raw.githubusercontent.com for public repos only — does not work for private repos; rejected.

### Decision: `SpecsPage` as a server component with a client list child
**Choice**: Keep `SpecsPage` as a Next.js server component. Extract the interactive spec list into a `SpecsListClient.tsx` client component that fetches `/api/repos/.../specs` with SWR, renders the grouped list, and links each item to the detail page.
**Why**: Follows the existing pattern in `SecondarySidebar` (client component, SWR for data). The server component handles the repo params; the client component handles interactivity, loading states, and navigation highlighting.

---

## Data model changes

None. All data is sourced live from the GitHub API.

---

## API changes

### `GET /api/repos/[encodedFullName]/specs`

Scans `openspec/changes/` recursively (one level of grouping supported) and returns all spec `.md` files.

**Response `200 OK`**:
```json
{
  "specs": [
    {
      "slug": "feature-secondary-sidebar-nav",
      "group": null,
      "path": "openspec/changes/secondary-sidebar-nav/specs/feature-secondary-sidebar-nav.md",
      "status": "active"
    },
    {
      "slug": "feature-repo-sidebar-navigation",
      "group": "archive",
      "path": "openspec/changes/archive/2026-03-04-repo-sidebar-navigation/specs/feature-repo-sidebar-navigation.md",
      "status": "archived"
    }
  ]
}
```

**Response `200 OK`** (no openspec directory):
```json
{ "specs": [] }
```

**Auth**: Session required. Uses the user's GitHub access token.

---

### `GET /api/repos/[encodedFullName]/spec-content?path=<encoded-path>`

Fetches the raw text content of a single spec file by path.

**Query param**: `path` — URL-encoded path to the file within the repo (e.g. `openspec/changes/secondary-sidebar-nav/specs/feature-secondary-sidebar-nav.md`).

**Response `200 OK`**:
```json
{ "content": "## ADDED Requirements\n\n### Requirement: ..." }
```

**Response `404 Not Found`** (file not found):
```json
{ "error": "File not found" }
```

**Auth**: Session required.

---

## Risks / Trade-offs

- [GitHub API calls per listing load] → The `/specs` endpoint makes 2–3 API calls (list `openspec/changes/`, list each subdirectory, list `specs/` in each change). Acceptable for small-to-medium repos. Add a short-lived in-memory cache in a follow-up if needed.
- [Spec files with no `# Heading`] → The detail page falls back to displaying the slug as the title; no error state required.
- [Many archive entries] → If `openspec/changes/archive/` contains dozens of entries, listing them all is slow. This is acceptable for v1; pagination or virtual scroll can be added later.

---

## Open Questions

- Should ungrouped active specs and the "Archived" group always appear in a fixed order (active first, archived last), or alphabetical? **Decision**: active (ungrouped) first, then named groups alphabetically, then archived last.
- Should the spec list page show a count or other metadata alongside each spec item, or just the doc icon and slug? **Decision**: doc icon and slug only in the list; title is shown only on the detail page.
