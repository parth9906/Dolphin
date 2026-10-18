# Whale Frontend Architecture

## Scope and source of truth

Whale is the React + TypeScript frontend. Dolphin is the Spring Boot backend and remains read-only during frontend work. Dolphin owns API contracts, business rules, authentication, permissions, and organization-scope enforcement. The frontend may improve navigation and feedback, but it cannot grant access by selecting or hiding an organization.

## Runtime structure

- `frontend/src/main.tsx` mounts the React application.
- `frontend/src/app/App.tsx` composes the router and application providers.
- `frontend/src/app/router.tsx` defines routes.
- `frontend/src/app/ProtectedRoute.tsx`, `PermissionRoute.tsx`, and `AnyPermissionRoute.tsx` guard route rendering.
- `frontend/src/app/AppShell.tsx` owns the authenticated application shell and permission-filtered navigation.
- `frontend/src/app/providers.tsx` creates the TanStack Query client and wraps the authentication provider.
- `frontend/src/lib/api/` contains shared HTTP transport and API error handling.
- `frontend/src/lib/auth/` contains session/token handling, access-context loading, and the auth context.
- `frontend/src/features/<feature>/api/` owns feature-specific services and DTO types.
- `frontend/src/features/<feature>/pages/` owns route-level screens; feature-specific UI should be extracted into nearby `components/`, `hooks/`, and `schemas/` only when doing so improves clarity or reuse.

## Data flow

1. A page calls a feature hook or service.
2. Feature services use the shared API client; they do not create independent HTTP transports.
3. The API client attaches the authenticated access token and normalizes API failures.
4. Dolphin validates authentication, permissions, target resource, and organization scope.
5. The UI renders loading, success, empty, validation, forbidden, and recoverable error states.

## Organization context

The current hierarchy is Enterprise → Region → Cluster → Institution → optional Campus. The existing storage key remains `dolphin.organization.selection.v1`. `features/organization/hooks/organization-selection.ts` is the typed observable store; use its hooks and setter instead of parsing `sessionStorage` inside feature pages. On a context change, dependent selections and drafts must be reset, and requests must not display results from the previous context. The selected ID is a target selector, not an authorization claim.

## Styling

The existing styling approach is plain CSS per feature plus `src/index.css` design tokens. Keep that strategy consistent rather than introducing a second styling framework without a demonstrated need. Global tokens currently include text/surface/border/primary/background colors, three radius sizes, and two shadow levels. Feature styles should use consistent focus rings, spacing, responsive behavior, and semantic states.

## State ownership

- TanStack Query: server state and request lifecycle.
- React component state: temporary form inputs, open dialogs, selection within the current screen, and unsaved drafts.
- Auth context: current session, user, access context, permissions, and roles.
- Organization-selection store: selected organization hierarchy.

Avoid duplicating server data in component state unless required by an explicit editing workflow. Query keys for scoped data must include the applicable organization/resource identifiers.

## Boundaries

Shared UI components must not import feature APIs or DTOs. Feature services own API communication for their domain. Cross-feature behavior belongs in `lib/` or an explicit shared feature contract, not in a giant page component. Do not introduce mock API data or invented endpoints.
