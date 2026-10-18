# Authentication and Authorization

## Existing implementation

- `src/lib/auth/auth-provider.tsx` owns login, logout, session restoration, access-context loading, and the authenticated/unauthenticated/loading state.
- `src/lib/auth/auth-session.ts` coordinates refresh and session-version behavior.
- `src/lib/auth/token-storage.ts` stores the existing access and refresh tokens in `sessionStorage`.
- Login and refresh responses must include `accessContext`; the frontend consumes it directly and does not call `GET /api/v1/me/access-context`. See `audit/AUTH_ACCESS_CONTEXT_MERGED_CONTRACT.md`.
- `src/app/ProtectedRoute.tsx`, `PermissionRoute.tsx`, and `AnyPermissionRoute.tsx` control route rendering.
- `src/app/AppShell.tsx` filters navigation based on the current permission context.

Preserve the backend's existing login, logout, refresh, and access-context contracts. Do not create a refresh endpoint or change token protocol without explicit backend authorization.

## Security model

Frontend permissions are a usability layer, not a security boundary. Dolphin independently checks permissions and live organization/resource scope. A client-supplied institution or campus ID identifies the target of an operation; it does not prove access to that target.

The backend organization hierarchy is Enterprise → Region → Cluster → Institution → optional Campus. A campus-only scope must not be treated as institution-wide authority. Inactive hierarchy nodes and role-specific exceptions must follow the backend implementation.

## Frontend requirements

- Do not render protected data while the session/access context is unresolved.
- Keep tokens out of URLs and application logs.
- Handle 401 by following the existing session-expiration flow; handle 403 as forbidden without pretending the request succeeded.
- Clear organization/user-scoped UI state when the session or selected organization changes.
- Do not append a manually selected institution to the user's available scope list unless Dolphin's access context or scope endpoint confirms it is authorized.
- Deep links must still rely on Dolphin to reject unauthorized resource requests.

## Verification cases

Test malformed or altered organization storage, a bookmarked route for another institution, a 403 during a scoped request, logout after viewing scoped records, and a subsequent login under a user with different scopes. Confirm that cached records from the previous user/scope are not rendered as current.
