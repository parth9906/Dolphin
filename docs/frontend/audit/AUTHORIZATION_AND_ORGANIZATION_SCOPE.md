# Authorization and Organization Scope Audit

## Backend authority

Dolphin's `docs/api/README.md` and `identity/security/OrganizationScopeAuthorization.java` establish two independent authorization layers:

1. Controller permission checks through Spring Security authorities (`@PreAuthorize`).
2. Live service-layer organization/institution/campus checks through `OrganizationScopeAuthorization` and related resource authorization.

Frontend route guards, navigation filtering, selected organization IDs, and hidden actions are UX controls only. They cannot grant access.

## Hierarchy and scope semantics

The actual backend hierarchy is `Enterprise → Region → Cluster → Institution → optional Campus`.

The backend API contract describes:

- `ENTERPRISE`, `REGION`, `CLUSTER`, and `INSTITUTION` scopes as granting access to institutions beneath that node.
- `CAMPUS` scope as campus-only; it does not grant institution-wide access.
- Inactive nodes in the hierarchy block access.
- Platform-admin handling is explicit in the backend authorization helper; do not recreate this policy from frontend assumptions.

`OrganizationScopeAuthorization.java` resolves the authenticated user from the server-side principal and loads that user's scopes. Client-provided organization IDs are target selectors, not proof of authorization.

## Whale implementation

- `lib/auth/auth-provider.tsx` loads the current access context and exposes `hasPermission`, `hasAnyPermission`, and `hasRole`.
- `app/ProtectedRoute.tsx` requires an authenticated session.
- `app/PermissionRoute.tsx` and `app/AnyPermissionRoute.tsx` gate route rendering.
- `app/AppShell.tsx` filters navigation using permission codes.
- `features/organization/pages/OrganizationPage.tsx` stores selected hierarchy records in `sessionStorage` under `dolphin.organization.selection.v1`.
- Feature pages now consume the shared selection hooks rather than parsing `sessionStorage` independently. User Management no longer appends a manually selected institution to its available scope options unless the authenticated access-context/scope response provides it.

The centralized permission context is useful for UX. The working copy now has a typed observable organization-selection store and an application-level query-scope boundary that cancels in-flight queries and clears TanStack Query data when the selected hierarchy changes. Session transitions from authenticated to unauthenticated/loading or a different user also clear the query cache. These behaviors still require runtime regression testing.

## Confirmed risk areas

1. **Duplicated selection parsing:** different feature pages can interpret stored selection differently or drift as the stored shape evolves.
2. **Cached data across organization changes:** TanStack Query is global (`app/providers.tsx`); feature query keys are not uniformly demonstrated to include a scope identifier. Scope changes must invalidate/remove scoped caches and avoid rendering old data while new scope loads.
3. **Stale asynchronous responses:** requests started for one organization must not write their results after context switches. The leave page uses an `active`/`live` guard for some effects but its request-list callback has no request identity/cancellation guard.
4. **Client storage is mutable:** malformed or manually changed `sessionStorage` data must be validated and never used as authorization evidence.
5. **Direct/deep links:** route guards verify permissions, not resource-level scope. Dolphin must reject out-of-scope resource requests; Whale should render 403 safely and clear sensitive stale content.
6. **Logout/user switching:** auth session changes must remove any user- or organization-scoped cached data. Confirm the current logout path and query-cache behavior before modifying it.

## Required behavior for a centralized context

- Keep the existing storage key and selection schema compatible during migration unless the actual source audit proves a safe migration.
- Validate stored shape and hierarchy parent-child relationships.
- Expose selection through one typed hook/provider.
- Make selection changes observable in the same React tree.
- Clear dependent lower-level selections when a parent changes.
- Invalidate/remove organization-specific TanStack Query data when institution/campus context changes.
- Prevent old requests from committing after a context switch; use AbortSignal where supported or a request-generation guard.
- Show a context-loading/invalid-context state instead of stale records.
- Clear sensitive scoped cache on logout and account changes.
- Continue relying on Dolphin for all real authorization decisions.

## Required security tests

- Mutate institution/campus IDs in session storage and open a deep link.
- Navigate to a previously bookmarked record outside the current scope.
- Switch organization while list/detail requests are in flight.
- Return 401 or 403 for a scoped request and ensure old records are not shown as current.
- Logout and sign in as a user with a different scope; verify cached records do not leak.
- Confirm campus-only scope cannot load institution-wide data.

No backend authorization defect is asserted in this audit. The backend checks were inspected as the authority and should remain in place; any suspected defect must be tied to a specific controller/service path and test evidence.
