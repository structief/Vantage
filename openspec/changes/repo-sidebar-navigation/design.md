## Context

The current homepage renders a flat `RepoList` component that fetches and displays all GitHub-accessible repositories in a table. There is no concept of a "current repo" or a way to narrow scope to a single repository.

The target experience is a Slack-style icon sidebar on the far left of the shell: users pin specific repos from their list, each repo gets a gradient avatar square with its initials, and clicking one switches the active repo context. The main content area then shows per-repo content (initially just a repo title page).

The app currently has no persistent shell layout — each page is self-contained. This change introduces an application shell with a persistent sidebar and refactors the routing structure to support per-repo pages.

Existing data: `RepoCache` (SQLite) stores the full accessible repo list per user. `UserProfile` stores display identity. No pinned-repo concept exists yet.

## Goals / Non-Goals

**Goals:**
- Persistent sidebar component with pinned repo icon buttons
- Deterministic gradient per repo derived from the repo name
- Repo picker overlay sourced from the existing `RepoCache`
- Per-repo route at `/repo/[owner]/[name]` showing a placeholder with the repo title
- SQLite persistence of pinned repos and their order
- Remove the current full-repo-list homepage (replace with sidebar + empty state or first pinned repo)

**Non-Goals:**
- Reordering pinned repos (drag-and-drop deferred)
- Spec content within repo pages (deferred to future changes)
- Syncing pinned repos across devices or users

## Decisions

### Decision: URL-based active repo routing
**Choice**: Active repo is encoded in the URL as `/repo/[owner]/[name]`
**Why**: SSR-friendly, shareable, survives page refresh without client state. The sidebar simply highlights the button whose `full_name` matches the current route segments.
**Alternatives**: React context / zustand for active-repo state — rejected because it requires hydration and loses state on hard refresh without an additional persistence layer.

### Decision: Deterministic gradient via hash of repo full_name
**Choice**: Hash the `full_name` string (owner/repo) with a simple djb2-style hash and use the result to index into a fixed palette of ~12 gradient CSS string pairs.
**Why**: Same gradient for the same repo on any client without storing the gradient. Avoids per-user drift if the palette is stable.
**Alternatives**: Random gradient on first add then stored in DB — adds a column, more state to sync, no meaningful UX benefit.

### Decision: Pinned repos stored in a new `PinnedRepo` SQLite table
**Choice**: New `PinnedRepo` model with `(github_login, full_name)` composite primary key and a `pinned_order` integer for display order.
**Why**: Keeps pinned state local and persistent across restarts, consistent with the constitution's local-first approach.
**Alternatives**: localStorage — not SSR-accessible and violates local-first/SQLite pattern already established.

### Decision: Application shell with persistent sidebar via Next.js layout
**Choice**: Introduce `app/(shell)/layout.tsx` — a route group layout wrapping all authenticated pages — that renders the sidebar alongside `{children}`. The login page and API routes remain outside this group.
**Why**: Next.js route group layouts apply to all routes within the group without affecting the URL. This avoids duplicating the sidebar in each page component.
**Alternatives**: Render the sidebar inside each page — repetitive; sidebar state re-mounts on every navigation.

### Decision: Repo picker is a client-side overlay backed by the existing /api/repos endpoint
**Choice**: The "+" button opens a modal/popover that fetches from `/api/repos` (already cached in SQLite) and filters out already-pinned repos.
**Why**: Re-uses existing data fetching; no new API endpoint needed for the picker itself.
**Alternatives**: New `/api/pinned-repos` endpoint for the picker — over-engineering for a read that can be derived client-side.

## Data model changes

New model added to `prisma/schema.prisma`:

```
model PinnedRepo {
  github_login String
  full_name    String
  pinned_order Int
  pinned_at    DateTime @default(now())

  @@id([github_login, full_name])
  @@map("pinned_repos")
}
```

New API endpoints needed:
- `GET /api/pinned-repos` — returns the authenticated user's pinned repos ordered by `pinned_order`
- `POST /api/pinned-repos` — body `{ full_name: string }` — appends a repo to the end of the list
- `DELETE /api/pinned-repos/[full_name]` — removes a pinned repo; `full_name` is double-URL-encoded (`owner%2Frepo`)

## API changes

`GET /api/pinned-repos`
- Auth required (401 if unauthenticated)
- Response: `{ pinned_repos: Array<{ full_name: string; pinned_order: number }> }`

`POST /api/pinned-repos`
- Body: `{ full_name: string }`
- Validates `full_name` is in the user's `RepoCache`; 400 if not found or already pinned
- Response: `201 { full_name, pinned_order }`

`DELETE /api/pinned-repos/[encodedFullName]`
- Removes the row; recalculates `pinned_order` for remaining rows (compact sequence)
- Response: `204`

## Risks / Trade-offs

- [Gradient palette stability] If the palette array order changes in a future refactor, all existing gradients will shift. → Keep the palette in a single constant file (`lib/gradients.ts`) and treat it as append-only.
- [Sidebar flicker on SSR] The sidebar must know the pinned repos on first render. Fetch them server-side in the shell layout to avoid a loading flash. → Shell layout is a server component; it fetches pinned repos and passes them as props to the client sidebar.
- [No empty state for the main content area] When no repo is active (user navigated to `/`), the main panel has nothing to show. → Render a neutral empty state: "Select a repository from the sidebar or add one to get started."

## Open Questions

- Should the sidebar support more than ~15 pinned repos, or should we cap it (with a scroll)? Assume uncapped with overflow scroll for now.
- Should removing the last pinned repo redirect to `/` automatically, or leave the user on the now-removed repo route? Spec says redirect to neutral state; implement as `router.push('/')`.
