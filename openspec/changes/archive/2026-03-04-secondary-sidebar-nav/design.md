## Context

The app currently has a primary sidebar (`RepoSidebar.tsx`) — a narrow column of repo gradient icons. Clicking a repo icon navigates to `/repo/[owner]/[name]`. There is no secondary navigation for a specific repo's content.

The shell layout (`app/(shell)/layout.tsx`) renders `<RepoSidebar>` server-side and passes pinned repos as props. The session and GitHub token are available server-side via `auth()`.

`lib/github.ts` already provides an Octokit-based helper for GitHub API calls.

---

## Goals / Non-Goals

**Goals:**
- Add a secondary sidebar that is always visible whenever a repo is active, to the right of the primary repo icon column
- Toggle button at the top of the primary sidebar switches between **expanded mode** (icons + text) and **collapsed mode** (icons/initials only) — the sidebar is never fully hidden
- Display three fixed nav links per repo (All Specs, Activity, Settings) with icons and active highlighting
- Show a PROJECTS section listing openspec change directories as project groups, with collapsable spec lists (expanded) or initial squares (collapsed)
- Persist toggle mode in `localStorage`
- Show a skeleton loading state while projects are being fetched

**Non-Goals:**
- Rendering actual spec content (that is a future change)
- Building the All Specs, Activity, or Settings page content (stub/placeholder pages are acceptable)
- Real-time updates to the projects list (a page reload is sufficient)
- Showing the secondary sidebar on the home `/` route (no active repo)

---

## Decisions

### Decision: Secondary sidebar as a separate client component
**Choice**: Create a new `SecondarySidebar.tsx` client component, rendered alongside `RepoSidebar` in the shell layout.
**Why**: Keeping it separate from `RepoSidebar` avoids growing that component further. The secondary sidebar has its own toggle state, data fetching lifecycle, and project collapse state that are cleanly encapsulated.
**Alternatives**: Embedding it inside `RepoSidebar` — rejected because it conflates two distinct concerns (repo switching vs. per-repo navigation).

### Decision: Toggle controls display mode, not visibility
**Choice**: The toggle switches between `expanded` (220px, icons + labels) and `collapsed` (52px, icons/initials only). The secondary sidebar is always mounted in the DOM when a repo is active.
**Why**: Always-visible navigation gives users a stable spatial anchor. Hiding it entirely would disrupt layout and require re-fetching projects on every reopen. The collapsed mode still exposes all destinations via icons/tooltips.
**Alternatives**: Hide/show the panel entirely — rejected by user requirement. Animate width — acceptable, but a discrete two-state model is simpler and performs better.

### Decision: Toggle mode in localStorage
**Choice**: Store the `"expanded" | "collapsed"` string in `localStorage` under the key `vantage:secondary-sidebar:mode`.
**Why**: `localStorage` is the simplest persistence mechanism for a purely UI preference. No server round-trip needed; state survives page navigations and browser refreshes.
**Alternatives**: URL query param — rejected because it pollutes every URL; React context only — rejected because it resets on full page reload.

### Decision: Projects data from a new API route
**Choice**: Create `GET /api/repos/[encodedFullName]/projects` that reads the `openspec/changes/` directory tree from the GitHub API using Octokit, counts spec files in each change's `specs/` subdirectory, and returns the list.
**Why**: Keeps GitHub token server-side (never exposed to the client). Consistent with the existing pattern of server-side GitHub API calls in `lib/github.ts`. The client component can fetch this endpoint with SWR or a simple `fetch`.
**Alternatives**: Client-side direct GitHub API call — rejected because it would require exposing the access token to the browser. Parsing the repo at build/layout time — rejected because it adds latency to every page render.

### Decision: Active link detection via pathname
**Choice**: Derive the active nav link from `usePathname()` in the `SecondarySidebar` client component. A link is active when the pathname starts with its corresponding route prefix.
**Why**: Consistent with how `RepoSidebar` detects the active repo from the URL. No global state needed.

### Decision: Project collapse state in React state (in-memory)
**Choice**: Track which project groups are expanded/collapsed in `useState` within `SecondarySidebar`. This state lives only for the lifetime of the component (session-level).
**Why**: The spec says "persists in session" — React component state fulfils this since the secondary sidebar is mounted at the shell layout level and does not unmount on navigation.
**Alternatives**: `localStorage` per-project — over-engineered for the initial version.

### Decision: Stub pages for All Specs, Activity, Settings routes
**Choice**: Create minimal placeholder pages at `/repo/[owner]/[name]/specs/page.tsx`, `/repo/[owner]/[name]/activity/page.tsx`, and `/repo/[owner]/[name]/settings/page.tsx` that render a heading with the route name.
**Why**: The nav links must resolve to valid routes. Full page content is out of scope for this change.

---

## Data model changes

None. No new database tables required. The projects list is fetched live from the GitHub API on demand.

---

## API changes

### `GET /api/repos/[encodedFullName]/projects`

Reads the `openspec/changes/` directory of the connected repo from the GitHub API.

**Request**: `encodedFullName` is `encodeURIComponent("owner/name")`.

**Response** `200 OK`:
```json
{
  "projects": [
    {
      "slug": "repo-sidebar-navigation",
      "name": "repo-sidebar-navigation",
      "specCount": 2
    }
  ]
}
```

**Response** `404 Not Found` (if `openspec/changes/` does not exist in the repo):
```json
{ "projects": [] }
```

**Auth**: Session required. Uses the user's GitHub access token from the session.

---

## Risks / Trade-offs

- [GitHub API rate limit] → The projects endpoint makes 1–2 GitHub API calls per page load when the secondary sidebar is open. At 60 req/h unauthenticated / 5000 req/h authenticated, this is acceptable for small teams. If needed, add a short-lived in-memory or SQLite cache in a follow-up.
- [openspec/changes/ not present] → API returns `{ projects: [] }`; sidebar shows "No projects yet." gracefully.
- [Skeleton flicker on fast connections] → The skeleton state appears briefly; acceptable UX trade-off. A minimum display time is not added in v1.

---

## Open Questions

- Should the "name" shown in the projects list be the raw directory slug (e.g., `repo-sidebar-navigation`) or a formatted title (e.g., `Repo Sidebar Navigation`)? **Decision**: auto-format by replacing hyphens/underscores with spaces and title-casing — no additional metadata file needed.
- Should clicking "All Specs" navigate to a flat list of all spec `.md` files, or the openspec changes tree? **Decision**: show the openspec changes tree view (same data as the PROJECTS section, but as the main content area). Defer the flat spec list.
