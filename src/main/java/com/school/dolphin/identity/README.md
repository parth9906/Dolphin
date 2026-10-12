# Identity, Authentication & Authorization

Status: **Implemented**

[Shared conventions](../../../../../../../docs/api/README.md) apply. This document
adds module-specific detail.

## A. Module overview

Owns user accounts, roles, permissions, JWT authentication and organization
scopes. Provides the machine that every other module's `@PreAuthorize` checks
and scope checks rely on.

Included in V1:

- Username/password login issuing a 15-minute access JWT and a persistent,
  revocable refresh session.
- Local (database-free) request authentication: the filter verifies the access
  token and builds authorities from its signed claims.
- User, role and permission administration.
- Role -> permission grants and user -> role grants.
- Organization scope grants (enterprise/region/cluster/institution/campus).
- Refresh-token rotation with reuse detection and session-family revocation.

Excluded:

- Password reset, MFA, SSO, account lockout administration.
- Access-token revocation/blacklist: an access token stays valid until it
  expires (<= 15 minutes). Only refresh sessions are revocable.

Dependencies: `organization` (scope targets are organization nodes).

Principal classes: `config/SecurityConfig`, `config/JwtProperties`,
`security/JwtAuthenticationFilter`, `security/AuthenticatedUser`,
`security/AuthenticatedUserResolver`, `security/OrganizationScopeAuthorization`,
`service/AuthenticationService`, `service/JwtService`,
`service/AuthorizationSnapshotService`, `service/RefreshTokenService`,
`service/LoginAttemptService`, `service/UserService`, `service/RoleService`,
`service/PermissionService`, `service/RolePermissionService`,
`service/UserRoleService`, `service/UserOrganizationScopeService`,
`entity/UserRefreshToken`, `repository/UserRefreshTokenRepository`.

## B. API conventions

- Base path: `/api/v1`.
- Authentication: `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh` and
  `POST /api/v1/auth/logout` are public; every other endpoint requires a bearer
  token. Access tokens are validated locally (signature, expiry, issuer,
  audience) with no database access.
- Identity administration endpoints are permission-gated (see matrix).
- Serialization/timestamps/errors: see shared conventions.
- Pagination: none of the identity endpoints paginate in V1.

## C. Endpoint inventory

| Method | Path | Purpose | Permission | Scope | Status |
|---|---|---|---|---|---|
| POST | `/api/v1/auth/login` | Authenticate, obtain access + refresh token | none (public) | none | Implemented |
| POST | `/api/v1/auth/refresh` | Rotate refresh token, obtain new access + refresh token | none (public) | none | Implemented |
| POST | `/api/v1/auth/logout` | Revoke the refresh session/family | none (public) | none | Implemented |
| POST | `/api/v1/users` | Create user account | `USER_CREATE` | none | Implemented |
| GET | `/api/v1/users/{id}` | Read user account | `USER_READ` | none | Implemented |
| PUT | `/api/v1/users/{id}` | Update user profile | `USER_UPDATE` | none | Implemented |
| PATCH | `/api/v1/users/{id}/deactivate` | Deactivate user account | `USER_DEACTIVATE` | none | Implemented |
| POST | `/api/v1/auth/change-password` | Change own password | authenticated user | self | Implemented |
| POST | `/api/v1/users/{userId}/roles/{roleId}` | Grant role to user | `USER_ROLE_ASSIGN` | none | Implemented |
| POST | `/api/v1/users/{userId}/scopes` | Grant organization scope | `USER_SCOPE_ASSIGN` | none | Implemented |
| POST | `/api/v1/roles` | Create role | `ROLE_CREATE` | none | Implemented |
| GET | `/api/v1/roles/{id}` | Read role | `ROLE_READ` | none | Implemented |
| POST | `/api/v1/roles/{roleId}/permissions/{permissionId}` | Grant permission to role | `ROLE_PERMISSION_ASSIGN` | none | Implemented |
| POST | `/api/v1/permissions` | Create permission | `PERMISSION_CREATE` | none | Implemented |
| GET | `/api/v1/permissions/{id}` | Read permission | `PERMISSION_READ` | none | Implemented |

## D. Endpoint contracts

### POST /api/v1/auth/login

Authenticates a username/password pair and returns a short-lived access token
plus a long-lived refresh token.

- Auth: none. Permission: none. Scope: none.
- Request body (`LoginRequest`):

| Field | Type | Required | Constraints |
|---|---|---|---|
| `username` | string | yes | not blank |
| `password` | string | yes | not blank |

```json
{ "username": "admin", "password": "<password>" }
```

- Response `200` (`LoginResponse`):

```json
{
  "accessToken": "<jwt>",
  "tokenType": "Bearer",
  "expiresInSeconds": 900,
  "refreshToken": "<opaque-random-token>",
  "refreshExpiresInSeconds": 2592000,
  "userId": "8f2c1e6a-1a2b-4c3d-9e4f-0123456789ab",
  "username": "admin"
}
```

- Errors: `400 VALIDATION_ERROR` (missing fields); `401 INVALID_CREDENTIALS`
  (unknown/inactive user or wrong password - single generic message);
  `429 TOO_MANY_LOGIN_ATTEMPTS`.
- Business rules:
  - Failed attempts are rate-limited per normalized username: 5 failures within
    15 minutes lock the username for 15 minutes (in-memory, per instance).
  - The counter resets on a successful login.
  - Unknown usernames still perform a password-hash comparison (timing guard).
- Side effects: persists one `user_refresh_token` row (SHA-256 hash only).

Access-token details: HS256; 15-minute lifetime
(`dolphin.security.jwt.expiration-ms`); claims:

| Claim | Meaning |
|---|---|
| `sub` | user id (UUID) |
| `username` | login name |
| `roles` | active role codes at issue time (e.g. `TEACHER`) |
| `permissions` | effective permission codes across active roles only |
| `iss` / `aud` | `dolphin` / `dolphin-api` (both required on parse) |
| `iat` / `exp` | issued-at / expiry |
| `jti` | unique token id |

The filter trusts only these signed claims; client-supplied roles or
permissions are ignored.

### POST /api/v1/auth/refresh

Exchanges a refresh token for a new access token and a **rotated** refresh
token.

- Auth: none. Permission: none. Scope: none.
- Request body (`RefreshTokenRequest`): `refreshToken` (required, not blank).
- Response `200`: same shape as login (`LoginResponse`).
- Errors: `400 VALIDATION_ERROR`; `401 INVALID_REFRESH_TOKEN` for unknown,
  expired, revoked or replayed tokens (deliberately indistinguishable).
- Business rules:
  - Current account status and effective permissions are reloaded before any
    new token is minted; deactivated accounts are rejected and their sessions
    revoked.
  - The presented row is locked (`PESSIMISTIC_WRITE`) and rotated atomically,
    so two concurrent refreshes cannot both rotate the same token.
  - Replaying an already-rotated token is treated as theft and revokes the
    entire session family (`family_id`).

### POST /api/v1/auth/logout

Revokes the session family that owns the supplied refresh token.

- Auth: none. Permission: none. Scope: none.
- Request body (`RefreshTokenRequest`): `refreshToken` (required, not blank).
- Response `204` no content.
- Business rules: unknown tokens succeed silently (logout cannot be used to
  probe session validity). Revocation is idempotent.

### POST /api/v1/users

- Auth: bearer. Permission: `USER_CREATE`. Scope: none.
- Request body (`CreateUserRequest`):

| Field | Type | Required | Constraints |
|---|---|---|---|
| `username` | string | yes | not blank, <= 100 |
| `email` | string | yes | valid email, <= 255 |
| `password` | string | yes | 8..100 |
| `firstName` | string | yes | not blank, <= 100 |
| `lastName` | string | no | <= 100 |

```json
{
  "username": "j.doe",
  "email": "j.doe@example.org",
  "password": "<password>",
  "firstName": "Jane",
  "lastName": "Doe"
}
```

- Response `201` (`UserResponse`): `{ id, username, email, firstName, lastName, active }`.
- Errors: `400 VALIDATION_ERROR`; `409 DUPLICATE_RESOURCE` when username or
  email already exists; `403 ACCESS_DENIED`.
- Business rules: password is stored hashed; new users are `active=true`.

### GET /api/v1/users/{id}

- Auth: bearer. Permission: `USER_READ`. Scope: none.
- Path: `id` (UUID, required) - user id.
- Response `200` `UserResponse`.

### PUT /api/v1/users/{id}

- Auth: bearer. Permission: `USER_UPDATE`. Scope: none.
- Request body (`UpdateUserRequest`): `email` (required, valid, <= 255),
  `firstName` (required, <= 100), `lastName` (optional, <= 100).
- Response `200` `UserResponse`. Errors: `400`, `403`, `404`,
  `409 DUPLICATE_RESOURCE` (email in use by another account).

### PATCH /api/v1/users/{id}/deactivate

- Auth: bearer. Permission: `USER_DEACTIVATE`. Scope: none.
- No body. Response `200` `UserResponse` with `active=false`. Idempotent:
  deactivating an already inactive account succeeds.
- Effect: the account can no longer authenticate or refresh. Every refresh
  session for the account is revoked immediately; an already-issued access
  token keeps working until it expires (<= 15 minutes) because request
  authentication does not re-check `active` against the database.

### POST /api/v1/auth/change-password

- Auth: bearer (any authenticated user, including students, guardians and
  staff). Scope: self.
- Request body (`ChangePasswordRequest`): `currentPassword` (required),
  `newPassword` (required, 8..100).
- Response `200` `{ status: "CHANGED", message }`.
- Errors: `400 VALIDATION_ERROR`; `422 BUSINESS_RULE_VIOLATION` when the
  current password is incorrect.
- Errors: `404 RESOURCE_NOT_FOUND`.

### POST /api/v1/users/{userId}/roles/{roleId}

- Auth: bearer. Permission: `USER_ROLE_ASSIGN`. Scope: none.
- Path: `userId`, `roleId` (UUID, required).
- Response `204` no content.
- Errors: `404 RESOURCE_NOT_FOUND` (user or role missing); `409 DUPLICATE_RESOURCE`
  if already granted; `403 ACCESS_DENIED`.

### POST /api/v1/users/{userId}/scopes

- Auth: bearer. Permission: `USER_SCOPE_ASSIGN`. Scope: none.
- Path: `userId` (UUID, required).
- Request body (`CreateOrganizationScopeRequest`): `scopeType`
  (`ENTERPRISE|REGION|CLUSTER|INSTITUTION|CAMPUS`, required), `scopeId` (UUID,
  required).
- Response `201` (`OrganizationScopeResponse`):
  `{ id, userId, scopeType, scopeId }`.
- Errors: `400 VALIDATION_ERROR`; `404 RESOURCE_NOT_FOUND`; `403 ACCESS_DENIED`.
- Business rules: the `scopeId` must reference a node of the declared type.

### POST /api/v1/roles

- Auth: bearer. Permission: `ROLE_CREATE`. Scope: none.
- Request body (`CreateRoleRequest`): `code` (required, <= 100), `name`
  (required, <= 150), `description` (optional).
- Response `201` (`RoleResponse`): `{ id, code, name, description, active }`.
- Errors: `400 VALIDATION_ERROR`; `409 DUPLICATE_RESOURCE` (code exists).

### GET /api/v1/roles/{id}

- Permission `ROLE_READ`. Response `200` `RoleResponse`. Errors `404`.

### POST /api/v1/roles/{roleId}/permissions/{permissionId}

- Permission `ROLE_PERMISSION_ASSIGN`. Response `204`. Errors `404`, `409`, `403`.

### POST /api/v1/permissions

- Permission `PERMISSION_CREATE`.
- Request body (`CreatePermissionRequest`): `code` (required, <= 150), `name`
  (required, <= 200), `description` (optional).
- Response `201` (`PermissionResponse`): `{ id, code, name, description, active }`.
- Errors: `400`, `409 DUPLICATE_RESOURCE`.

### GET /api/v1/permissions/{id}

- Permission `PERMISSION_READ`. Response `200` `PermissionResponse`. Errors `404`.

## E. Seeded roles and permissions

Migrations seed `PLATFORM_ADMIN`, `GUARDIAN`, `TEACHER`, `STUDENT`.
`PLATFORM_ADMIN` receives every administrative permission; `GUARDIAN` receives
`PARENT_PORTAL_READ`; `TEACHER` receives assignment permissions plus (V53/V54)
lesson-attendance and marks permissions; `STUDENT` receives `STUDENT_PORTAL_READ`
and `ASSIGNMENT_SUBMISSION_CREATE`.

## F. Validation and business rules

- Username and email are unique (`user_account`). Role code and permission code
  are unique.
- Passwords: 8-100 characters at creation; hashed before storage.
- Login rate limiting as described above.
- Only active users, roles and permissions contribute authorities.
- Refresh tokens are opaque 256-bit random values; only their SHA-256 hash is
  stored (`user_refresh_token.token_hash`, unique). The raw token is returned
  to the client once and never persisted.

## G. Authorization matrix

| Permission | Read | Create | Assign |
|---|---|---|---|
| `USER_READ` / `USER_CREATE` / `USER_ROLE_ASSIGN` / `USER_SCOPE_ASSIGN` | yes | yes | yes |
| `ROLE_READ` / `ROLE_CREATE` / `ROLE_PERMISSION_ASSIGN` | yes | yes | yes |
| `PERMISSION_READ` / `PERMISSION_CREATE` | yes | yes | - |

All are administrative and carry no organization-scope restriction.

## H. Error contract

Notable codes: `INVALID_CREDENTIALS` (401), `INVALID_REFRESH_TOKEN` (401, for
unknown/expired/revoked/reused refresh tokens), `TOO_MANY_LOGIN_ATTEMPTS` (429),
`DUPLICATE_RESOURCE` (409) for duplicate username/email/role/permission codes and
duplicate grants.

## I. State transitions

`UserAccount.active`: created `true`. A deactivated account cannot authenticate
or refresh; all of its refresh sessions are revoked (`PATCH
/api/v1/users/{id}/deactivate` sets `active=false`; idempotent). An access token
issued before deactivation remains usable until it expires (<= 15 minutes).

`UserRefreshToken`: created on login. Rotation sets `revoked_at` and
`rotated_at` on the presented row and links `replaced_by_token_id` to its
successor in the same `family_id`. Reuse of a revoked row revokes the whole
family. Logout and password change revoke every active row for the user.

## J. Dependencies and integrations

- `organization`: scope targets are organization nodes.
- Every module consumes `AuthenticatedUser` and granted authorities.

## K. Open issues and implementation gaps

- No endpoint to list users/roles/permissions (only read-by-id).
- No self-service password reset (change-password requires the current
  password).
- No API to deactivate roles/permissions or revoke role/scope grants
  (user account deactivation exists).
- Login rate limiting is per-instance in memory; multi-instance needs a shared store.
- Unauthenticated requests return the servlet default 401 body, not `ErrorResponse`.
- Administrative endpoints perform no organization-scope enforcement; the
  permission is the only gate. Confirm platform-admin-only access is intended.

## L. Token size, staleness and refresh transport

- **Authorization staleness.** Access tokens are not re-checked against the
  database, so a deactivation or permission removal is honoured at the next
  refresh at the latest, i.e. within the 15-minute access-token lifetime. This
  is the explicit, accepted trade-off for removing per-request database
  authentication. Organization scope, student ownership, guardian
  relationships, teacher assignment and every other resource check remain
  database-backed and unaffected.
- **Token size.** Access tokens embed every effective permission code. A
  `PLATFORM_ADMIN` currently holds ~132 distinct permission codes, giving a
  token of roughly 4 KB (well under common 8 KB request-header limits, but not
  negligible). Permissions are deliberately not trimmed to shrink the token;
  if the header budget becomes a concern, the fix is a more compact claim
  encoding or a server header-size review, not silent permission omission.
- **Refresh transport (open decision).** Refresh and logout currently exchange
  the refresh token in the JSON body, matching the existing bearer-token API.
  For a browser client the preferred transport is an `HttpOnly`, `Secure`,
  `SameSite` cookie plus CSRF protection. There is no CORS or CSRF
  configuration in the repository yet and no frontend client, so the correct
  cookie `SameSite`/domain policy and CSRF scheme cannot be fixed from the
  existing deployment model. **Decision needed before a browser client ships:**
  confirm the API and SPA origins (same-site vs cross-site) so the cookie
  `SameSite`/`Domain` attributes and a CSRF token (or double-submit) policy can
  be chosen. The current body-based transport is safe for first-party
  server-to-server/mobile clients only.
