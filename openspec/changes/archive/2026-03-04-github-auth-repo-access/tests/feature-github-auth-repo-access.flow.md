# Test flows: GitHub Auth & Repository Access

<!-- Generated from specs/feature-github-auth-repo-access.md
     Each flow maps to a spec scenario. Translated to test code during opsx-apply. -->

---

## Flow: Successful login
Type: e2e
Spec: specs/feature-github-auth-repo-access.md > Requirement: GitHub OAuth Login

Setup:
- No active session exists (no valid session cookie)
- GitHub OAuth App is configured with valid GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET
- NEXTAUTH_URL is set to the local Vantage origin

Steps:
1. Navigate to the Vantage login screen (unauthenticated)
2. Click "Sign in with GitHub"
3. NextAuth redirects to GitHub OAuth authorization URL (verify redirect contains correct client_id, scope=repo+read:org, response_type=code)
4. Simulate GitHub returning a valid authorization code to /api/auth/callback/github
5. NextAuth exchanges the code for an access token and creates a JWT session
6. Vantage redirects user to the protected home route

Expected:
- Response to /api/auth/callback/github results in a 302 redirect to the home page
- A next-auth.session-token HTTP-only cookie is set (sameSite=lax, secure in production)
- Session contains github_login, name, and avatarUrl from the GitHub user API response
- User lands on the authenticated Vantage home screen

Edge cases:
- Token exchange fails (GitHub returns 400): user remains on login screen; no partial session cookie is set

---

## Flow: User denies GitHub access
Type: e2e
Spec: specs/feature-github-auth-repo-access.md > Requirement: GitHub OAuth Login

Setup:
- No active session exists

Steps:
1. Initiate GitHub OAuth flow (click "Sign in with GitHub")
2. Simulate GitHub returning error=access_denied to /api/auth/callback/github

Expected:
- User is redirected to the Vantage login screen
- Login screen displays the message "Authorization was cancelled. Please sign in to continue."
- No session cookie is created

Edge cases:
- None additional

---

## Flow: OAuth error returned by GitHub
Type: e2e
Spec: specs/feature-github-auth-repo-access.md > Requirement: GitHub OAuth Login

Setup:
- No active session exists

Steps:
1. Initiate GitHub OAuth flow
2. Simulate GitHub returning error=redirect_uri_mismatch to /api/auth/callback/github

Expected:
- User sees a descriptive error message on the login screen (not a blank page or unhandled exception)
- No session cookie is created
- Error code is logged server-side for diagnostics

Edge cases:
- Unknown error code from GitHub: fallback to generic "Authentication failed. Please try again." message

---

## Flow: Accessing a protected route while unauthenticated
Type: e2e
Spec: specs/feature-github-auth-repo-access.md > Requirement: GitHub OAuth Login

Setup:
- No active session exists

Steps:
1. Navigate directly to /projects (a protected Vantage route) without a session cookie
2. Vantage middleware evaluates session

Expected:
- Response is a 302 redirect to /login?callbackUrl=%2Fprojects
- After successful login the user is redirected to /projects (the original destination)

Edge cases:
- callbackUrl contains an external origin: Vantage ignores it and redirects to the home route to prevent open redirect

---

## Flow: Successful logout
Type: e2e
Spec: specs/feature-github-auth-repo-access.md > Requirement: GitHub OAuth Logout

Setup:
- Authenticated user with active session cookie

Steps:
1. User clicks "Sign out"
2. POST /api/auth/signout (NextAuth signout endpoint) with CSRF token

Expected:
- Server-side session is invalidated (JWT cookie cleared: Max-Age=0)
- next-auth.session-token cookie is removed from the browser
- User is redirected to the Vantage login screen
- Subsequent GET /api/repos with the old cookie returns 401

Edge cases:
- None additional

---

## Flow: Session expired before explicit logout
Type: e2e
Spec: specs/feature-github-auth-repo-access.md > Requirement: GitHub OAuth Logout

Setup:
- User holds a session token whose expiry is in the past (or whose GitHub token has been revoked)

Steps:
1. User attempts to access any protected Vantage route or call GET /api/repos
2. NextAuth middleware validates the JWT and finds it expired

Expected:
- Response is a 302 redirect to /login
- Login screen displays the message "Your session has expired. Please sign in again."
- No stale user data is shown before the redirect

Edge cases:
- GitHub token revoked mid-session (token still valid locally but rejected by GitHub API on next repo call): treated as session expiry; same redirect and message

---

## Flow: Display name and avatar visible after login
Type: e2e
Spec: specs/feature-github-auth-repo-access.md > Requirement: User Profile Display

Setup:
- Authenticated user; GitHub name="The Octocat", avatarUrl set in session
- user_profiles row upserted in SQLite (.vantage/vantage.db) on login

Steps:
1. Navigate to any protected page (e.g. /projects)
2. Inspect the navigation header

Expected:
- Navigation header shows "The Octocat" (display name, not "octocat" login handle)
- Navigation header shows the user's avatar image sourced from avatar_url
- GET /api/me returns { github_login: "octocat", name: "The Octocat", avatar_url: "..." }

Edge cases:
- user_profiles row missing from SQLite (first boot before login completes): header falls back to login handle from session JWT

---

## Flow: Display name persisted across server restart
Type: unit
Spec: specs/feature-github-auth-repo-access.md > Requirement: User Profile Display

Setup:
- User has previously logged in; user_profiles row exists in SQLite (.vantage/vantage.db)
- Vantage server is restarted (in-memory state cleared)
- User still holds a valid session cookie

Steps:
1. GET /api/me after server restart (no in-memory cache warm)
2. Prisma Client queries UserProfile WHERE github_login = session.login
3. Row is returned

Expected:
- HTTP 200
- Response contains the persisted name and avatar_url without any GitHub API call
- No GITHUB_CLIENT_ID or access token is required for this endpoint

Edge cases:
- .vantage/vantage.db missing or corrupt: GET /api/me returns 404 with { error: "PROFILE_NOT_FOUND" }; user must log in again to repopulate

---

## Flow: Repositories loaded after login
Type: contract
Spec: specs/feature-github-auth-repo-access.md > Requirement: Accessible Repository Listing
See: contracts/api/github-auth-repo-access.yaml > GET /api/repos

Setup:
- Authenticated user; GitHub access token in session has repo and read:org scopes
- local store is empty or stale for this user

Steps:
1. GET /api/repos with valid session cookie
2. Server calls GitHub API: GET https://api.github.com/user/repos?affiliation=owner,collaborator,organization_member&per_page=100 (paginate via Link header until exhausted)
3. Response is transformed into CachedRepository records and written to the RepoCache table in SQLite, keyed by github_login
4. RepoListResponse returned to client

Expected:
- HTTP 200
- Response body matches RepoListResponse schema (contracts/api/github-auth-repo-access.yaml)
- repositories array contains entries from all three affiliations
- Each repository entry contains: id, full_name, name, owner_login, visibility, default_branch, read_only
- fetched_at is set to the current timestamp; stale=false
- Response arrives within 5 seconds for up to 300 repositories

Edge cases:
- User has no repositories: 200 with repositories=[] and empty-state message cue in the response (or handled client-side based on empty array)

---

## Flow: User has no accessible repositories
Type: contract
Spec: specs/feature-github-auth-repo-access.md > Requirement: Accessible Repository Listing
See: contracts/api/github-auth-repo-access.yaml > GET /api/repos

Setup:
- Authenticated user whose GitHub account has zero accessible repositories
- local store is empty

Steps:
1. GET /api/repos
2. GitHub API returns an empty array across all pagination pages
3. Cache is written with repositories=[]

Expected:
- HTTP 200
- Response: { fetched_at: <timestamp>, stale: false, repositories: [] }
- UI layer (not this contract) shows "No repositories found. Make sure your GitHub account has access to at least one repository."

Edge cases:
- None additional

---

## Flow: GitHub API rate limit exceeded during listing
Type: contract
Spec: specs/feature-github-auth-repo-access.md > Requirement: Accessible Repository Listing
See: contracts/api/github-auth-repo-access.yaml > GET /api/repos

Setup:
- Authenticated user; local store contains a previously fetched repo list
- GitHub API returns 429 (or 403 with X-RateLimit-Remaining: 0) on the repo listing call

Steps:
1. GET /api/repos triggers a live fetch (cache TTL expired)
2. GitHub API returns 429
3. Server detects rate-limit response
4. Server serves the stale cached list

Expected:
- HTTP 200 (not 429 — rate limit is handled server-side)
- Response: { fetched_at: <original cache timestamp>, stale: true, rate_limit_hit: true, repositories: [...cached...] }
- Error is logged server-side

Edge cases:
- No cached data AND rate limited: HTTP 503 with { error: "GITHUB_UNAVAILABLE", message: "GitHub rate limit reached. Please try again in a few minutes." }

---

## Flow: User manually refreshes the repository list
Type: contract
Spec: specs/feature-github-auth-repo-access.md > Requirement: Accessible Repository Listing
See: contracts/api/github-auth-repo-access.yaml > POST /api/repos/refresh

Setup:
- Authenticated user; local store contains a stale or current repo list

Steps:
1. POST /api/repos/refresh with valid session cookie
2. Server bypasses TTL check and calls GitHub API immediately
3. Full paginated fetch completes
4. local store is overwritten with fresh results

Expected:
- HTTP 200
- Response body matches RepoListResponse schema; stale=false; fetched_at updated to now
- Any repositories removed since the last fetch are absent from the new list

Edge cases:
- A previously listed repository now returns 403 (access revoked): that repository is absent from the refreshed list and marked read_only=true is NOT applicable (it simply no longer appears)

---

## Flow: Repository with insufficient permissions
Type: contract
Spec: specs/feature-github-auth-repo-access.md > Requirement: Accessible Repository Listing
See: contracts/api/github-auth-repo-access.yaml > GET /api/repos

Setup:
- Authenticated user; GitHub API includes a repository where permissions.push=false

Steps:
1. GET /api/repos
2. GitHub API response for a repo includes "permissions": { "push": false }
3. Vantage maps this to read_only=true in the CachedRepository record

Expected:
- That repository appears in the list with read_only=true
- The Vantage UI disables commit and PR-creation actions for that repository (UI concern, not asserted in this contract test)

Edge cases:
- permissions field absent from GitHub API response: treat as read_only=true (safe default)

---

## Flow: Page reload while authenticated
Type: e2e
Spec: specs/feature-github-auth-repo-access.md > Requirement: Session Persistence

Setup:
- Authenticated user with a valid (non-expired) session cookie

Steps:
1. Reload the browser (full page refresh)
2. Next.js middleware reads the next-auth.session-token cookie
3. JWT is validated; session identity is resolved

Expected:
- User remains on the protected page without being redirected to login
- Session identity (github_login, name, avatarUrl) is available in the request context

Edge cases:
- Cookie is present but JWT signature is invalid (tampered): treated as expired → redirect to login

---

## Flow: Session token absent or invalid on startup
Type: unit
Spec: specs/feature-github-auth-repo-access.md > Requirement: Session Persistence

Setup:
- No next-auth.session-token cookie in the request

Steps:
1. User opens Vantage in a fresh browser tab (no cookie)
2. Next.js middleware evaluates the request

Expected:
- User sees the login screen
- No error message is shown (unauthenticated is the expected initial state)
- No console errors or unhandled exceptions

Edge cases:
- Cookie present but malformed (not a valid JWT): same outcome as absent cookie — redirect to login silently
