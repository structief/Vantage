## ADDED Requirements

### [x] Requirement: GitHub OAuth Login
A user SHALL be able to initiate a login flow from the Vantage UI using their GitHub account. Vantage SHALL use GitHub OAuth (OAuth 2.0 Authorization Code flow) as the sole identity mechanism. No username/password or separate registration is required. After successful authentication, the user's GitHub identity (login, name, avatar URL) SHALL be stored in the session.

#### Scenario: Successful login
- **WHEN** an unauthenticated user clicks "Sign in with GitHub" on the Vantage login screen
- **THEN** the user is redirected to GitHub's OAuth authorization page, grants access, and is returned to Vantage as an authenticated session with their GitHub identity resolved

#### Scenario: User denies GitHub access
- **WHEN** the user cancels or denies the GitHub OAuth authorization prompt
- **THEN** the user is returned to the Vantage login screen and shown the message "Authorization was cancelled. Please sign in to continue."

#### Scenario: OAuth error returned by GitHub
- **WHEN** GitHub returns an error code during the OAuth callback (e.g., `access_denied`, `redirect_uri_mismatch`)
- **THEN** Vantage displays a descriptive error message and the user remains unauthenticated; no partial session is created

#### Scenario: Accessing a protected route while unauthenticated
- **WHEN** an unauthenticated user navigates directly to any route other than the login page
- **THEN** they are redirected to the login screen; their intended destination SHALL be preserved and restored after successful login

---

### [x] Requirement: GitHub OAuth Logout
A user SHALL be able to sign out of Vantage at any time. On logout, the server-side session MUST be invalidated and all locally cached GitHub tokens MUST be cleared.

#### Scenario: Successful logout
- **WHEN** an authenticated user clicks "Sign out"
- **THEN** their session is destroyed, GitHub token is cleared from local storage, and they are redirected to the login screen

#### Scenario: Session expired before explicit logout
- **WHEN** a user's session expires (e.g., token revoked on GitHub side or session TTL exceeded)
- **THEN** on the next authenticated request, Vantage SHALL redirect the user to the login screen with the message "Your session has expired. Please sign in again."

---

### [x] Requirement: Accessible Repository Listing
After login, Vantage SHALL fetch and display all GitHub repositories accessible to the authenticated user. This includes:
- Repositories owned by the user
- Repositories in organisations the user is a member of
- Repositories to which the user has been granted direct collaborator access

The list SHALL be sourced from the GitHub API using the authenticated user's OAuth token. The list SHALL be refreshable on demand. Each repository entry SHALL display at minimum: full name (`owner/repo`), visibility (public/private), and default branch.

#### Scenario: Repositories loaded after login
- **WHEN** a user successfully logs in
- **THEN** Vantage fetches all accessible repositories via the GitHub API and displays them as the project list; the fetch MUST complete within 5 seconds for up to 300 repositories

#### Scenario: User has no accessible repositories
- **WHEN** the authenticated GitHub account has no accessible repositories
- **THEN** Vantage displays an empty state with the message "No repositories found. Make sure your GitHub account has access to at least one repository."

#### Scenario: GitHub API rate limit exceeded during listing
- **WHEN** the GitHub API returns a 403 or 429 rate-limit response during repository fetch
- **THEN** Vantage displays the message "GitHub rate limit reached. Please try again in a few minutes." and shows the last successfully cached list if available

#### Scenario: User manually refreshes the repository list
- **WHEN** an authenticated user triggers a manual refresh of the repository list
- **THEN** Vantage re-fetches all accessible repositories from the GitHub API and updates the displayed list; stale entries from the previous fetch are replaced

#### Scenario: Repository with insufficient permissions
- **WHEN** the GitHub API returns a repository for which the user's token has read-only or no contents scope
- **THEN** that repository SHALL still appear in the list but SHALL be marked as "read-only" and Vantage SHALL disable any write actions (commit, PR creation) for it

---

### Requirement: User Profile Display
After successful login, Vantage SHALL display the authenticated user's GitHub display name (`name`, not `login`) and avatar in the navigation header on all protected pages. The display name and avatar URL SHALL be persisted in the local store (keyed by `github_login`) so they remain available across server restarts without requiring a re-fetch from GitHub.

#### Scenario: Display name and avatar visible after login
- **WHEN** an authenticated user views any protected page
- **THEN** the navigation header shows their GitHub display name (e.g. "Koen Everaert", not "koeneveraert") and avatar image

#### Scenario: Display name persisted across server restart
- **WHEN** the Vantage server is restarted and the user still has a valid session cookie
- **THEN** their display name and avatar are loaded from the local store without calling the GitHub API again

---

### Requirement: Session Persistence
The authenticated session SHALL persist across page reloads and browser restarts until the user explicitly logs out or the session expires. Session state SHALL be stored server-side; only a session token SHALL be stored client-side (HTTP-only cookie).

#### Scenario: Page reload while authenticated
- **WHEN** an authenticated user reloads the page
- **THEN** Vantage restores the authenticated session without requiring re-login, provided the session has not expired

#### Scenario: Session token absent or invalid on startup
- **WHEN** Vantage loads and no valid session token is present
- **THEN** the user is shown the login screen; no error is displayed for this expected unauthenticated state
