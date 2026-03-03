## Context

Vantage is a Next.js application that requires users to authenticate before accessing any content. The app has no proprietary user database — GitHub is the sole identity provider. After login, the authenticated GitHub token is used to read the user's accessible repositories, which are displayed as the project list.

There is currently no authentication layer or user session management in the app. This change introduces the full auth lifecycle: OAuth handshake, server-side session, GitHub token scoping, and repository listing with local caching.

Constraints from the constitution:
- GitHub OAuth is the only permitted external dependency for identity.
- Session tokens MUST be stored as HTTP-only cookies; no sensitive data in client storage.
- All other state uses local NoSQL (no remote database).

---

## Goals / Non-Goals

**Goals:**
- Implement GitHub OAuth 2.0 Authorization Code flow using NextAuth.js
- Establish server-side session management with HTTP-only cookie transport
- Fetch all accessible repositories via GitHub API on login and on manual refresh
- Cache the repository list in local NoSQL to survive page reloads without re-fetching
- Handle GitHub API pagination and rate limiting gracefully
- Protect all routes; redirect unauthenticated users to login with return-URL preservation

**Non-Goals:**
- Supporting identity providers other than GitHub
- Role-based access control or per-repository permission management within Vantage
- Syncing session state across multiple Vantage instances or browsers
- Managing GitHub App installations (OAuth App scopes only)

---

## Decisions

### Decision: Use NextAuth.js for OAuth and session management
**Choice**: NextAuth.js (v5 / Auth.js) with the built-in GitHub provider and JWT-based sessions stored in HTTP-only cookies.
**Why**: NextAuth handles the OAuth callback, CSRF protection, token refresh, and cookie management out of the box. It is the idiomatic solution for Next.js and avoids hand-rolling security-sensitive OAuth logic. JWT sessions keep the runtime stateless — no database adapter is required for the session itself, only for caching derived data (repo list).
**Alternatives**:
- _Hand-rolled OAuth_: More control, but considerable surface area for security bugs in the token exchange and cookie handling.
- _Iron Session_: Lighter, but requires building the GitHub OAuth flow manually. No practical advantage over NextAuth for this use case.

### Decision: Request `repo` scope at login time
**Choice**: Request GitHub OAuth scope `repo` (full repository access for private repos) and `read:org` (to enumerate organisation membership) at login.
**Why**: The repository listing must include private repos and org-owned repos. The `repo` scope is the minimum that covers all three affiliation types (owner, collaborator, organisation member) without a separate org-level OAuth grant.
**Alternatives**:
- _`public_repo` only_: Would exclude private repositories, breaking the "all accessible repos" requirement.
- _Progressive permission escalation_: Request minimal scope at login then upgrade later. Adds UX complexity for no benefit since we know full repo access is needed from day one.

### Decision: SQLite via Prisma for local persistence
**Choice**: Use Prisma with the `better-sqlite3` driver and a local `.vantage/vantage.db` SQLite file. `DATABASE_URL` defaults to `file:.vantage/vantage.db` and is configurable via env var. Prisma Client provides type-safe queries; `prisma migrate dev` manages schema evolution.
**Why**: SQLite is a single embedded file with no service process — fully local-first and aligned with the constitution's "no remote database" constraint. Prisma makes `schema.prisma` the authoritative data model (not just a reference doc), gives us type-safe query helpers, and handles migrations. `better-sqlite3` is synchronous and performs well for a single-user local app.
**Alternatives**:
- _node:fs JSON file_: Zero dependencies but no schema enforcement, no query safety, manual serialisation of every field. Breaks down quickly under any schema change.
- _LowDB_: A thin JSON wrapper — inherits the same structural weakness as raw JSON files.
- _In-memory cache_: Lost on server restart.
- _PostgreSQL / MySQL_: Requires a running service process; violates the constitution's local-first constraint.

### Decision: GitHub API via `@octokit/rest` with affiliation filter
**Choice**: Use the official `@octokit/rest` client (`Octokit` class from the `octokit` npm package) with `GET /user/repos?affiliation=owner,collaborator,organization_member&per_page=100` and automatic pagination via `octokit.paginate`.
**Why**: `@octokit/rest` is the official GitHub REST client. It handles authentication headers, pagination (`Link` header following), and rate-limit response headers out of the box. `octokit.paginate` collapses multi-page results into a single array with zero boilerplate. No raw `fetch` or custom header parsing needed.
**Alternatives**:
- _Raw `fetch`_: More control, but requires manual pagination, header inspection, and error handling — all already solved by Octokit.
- _GraphQL API (`viewer.repositories`)_: More efficient for large accounts but adds complexity; REST is sufficient for the fields we need.
- _`GET /orgs/{org}/repos` per org_: Requires separate calls per organisation. More complex and slower.

---

## Data model changes

Two tables are added to the SQLite database (`.vantage/vantage.db`). See `data-model/schema.prisma` for the full Prisma schema.

**`UserProfile`** — one row per GitHub user, upserted on every login:

| Column | Type | Notes |
|---|---|---|
| `github_login` | String (PK) | GitHub username |
| `name` | String | Display name — shown in nav header |
| `avatar_url` | String | GitHub avatar URL — shown in nav header |
| `updated_at` | DateTime | Set to `now()` on every login |

**`RepoCache`** — one row per GitHub user, overwritten on each cache refresh:

| Column | Type | Notes |
|---|---|---|
| `github_login` | String (PK) | GitHub username |
| `fetched_at` | DateTime | Timestamp of last successful GitHub API fetch |
| `repositories` | String (JSON) | Serialised `CachedRepository[]`, capped at 1000 |

`CachedRepository` shape (stored as JSON in the `repositories` column):
```
{ id, full_name, name, owner_login, visibility, default_branch, read_only }
```

Session (NextAuth JWT) contains `{ login, name, avatarUrl, accessToken }`.
`name` and `avatarUrl` are upserted to `UserProfile` on every successful login so they survive server restarts independently of the JWT cookie.

---

## API changes

Three Next.js API route handlers are added (all under `/api/auth/` and `/api/`):

| Route | Method | Description |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth catch-all handler (login, callback, logout, session) — provided by NextAuth |
| `/api/repos` | GET | Returns the cached repository list for the authenticated user; triggers a live fetch if cache is stale or missing |
| `/api/repos/refresh` | POST | Forces a live re-fetch from GitHub API, updates cache, returns updated list |

**`GET /api/repos` response shape:**
```json
{
  "fetched_at": "2026-03-03T10:00:00Z",
  "stale": false,
  "repositories": [
    {
      "id": 12345,
      "full_name": "octocat/hello-world",
      "name": "hello-world",
      "visibility": "public",
      "default_branch": "main",
      "read_only": false
    }
  ]
}
```

Error responses follow a consistent shape: `{ "error": "<code>", "message": "<human-readable>" }`.

---

## Risks / Trade-offs

- **[Risk] GitHub OAuth App `repo` scope is broad** → Mitigation: document clearly in the app UI that Vantage requests full repo access and why. Consider requesting `contents:read` via a GitHub App in a future amendment for finer-grained control.
- **[Risk] SQLite `repositories` column stores JSON blob** → Mitigation: store only the fields required by the UI (not the full GitHub API response). Cap at 1000 repos per user. If querying individual repos becomes necessary in a future amendment, normalise into a `Repository` table then.
- **[Risk] NextAuth v5 (Auth.js) is still in release-candidate phase** → Mitigation: pin to a specific RC version; the API is stable for the GitHub provider + JWT session pattern used here.
- **[Risk] HTTP-only cookie session requires same-origin deployment** → Mitigation: acceptable for the local-first / `next start` runtime model. Document that cross-origin deployment requires `NEXTAUTH_URL` to be set correctly.

---

## Open Questions

- What is the session TTL? (Suggested default: 30 days with sliding expiry — needs product confirmation.)
- Should the repository cache TTL be configurable per user, or fixed app-wide? (Current proposal: fixed 5-minute TTL.)
- When a repository is removed from the cache after a refresh (i.e., access was revoked), should open Vantage projects for that repo be locked or silently become read-only?
