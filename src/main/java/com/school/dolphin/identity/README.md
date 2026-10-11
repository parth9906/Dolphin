# Identity, Authentication & Authorization

Status: **Implemented**

[Shared conventions](../../../../../../../docs/api/README.md) apply. This document
adds module-specific detail.

## A. Module overview

Owns user accounts, roles, permissions, JWT authentication and organization
scopes. Provides the machine that every other module's `@PreAuthorize` checks
and scope checks rely on.

Included in V1:

- Username/password login issuing a JWT.
- User, role and permission administration.
- Role -> permission grants and user -> role grants.
- Organization scope grants (enterprise/region/cluster/institution/campus).
- JWT authentication filter that restores authorities per request.

Excluded:

- Password reset, refresh tokens, MFA, SSO, account lockout administration.
- Token revocation/blacklist (tokens are valid until expiry).

Dependencies: `organization` (scope targets are organization nodes).

Principal classes: `config/SecurityConfig`, `config/JwtProperties`,
`security/JwtAuthenticationFilter`, `security/AuthenticatedUser`,
`security/AuthenticatedUserResolver`, `security/OrganizationScopeAuthorization`,
`service/AuthenticationService`, `service/JwtService`,
`service/LoginAttemptService`, `service/UserService`, `service/RoleService`,
`service/PermissionService`, `service/RolePermissionService`,
`service/UserRoleService`, `service/UserOrganizationScopeService`.

## B. API conventions

- Base path: `/api/v1`.
- Authentication: `POST /api/v1/auth/login` is public; every other endpoint
  requires a bearer token.
- Identity administration endpoints are permission-gated (see matrix).
- Serialization/timestamps/errors: see shared conventions.
- Pagination: none of the identity endpoints paginate in V1.

## C. Endpoint inventory

| Method | Path | Purpose | Permission | Scope | Status |
|---|---|---|---|---|---|
| POST | `/api/v1/auth/login` | Authenticate, obtain JWT | none (public) | none | Implemented |
| POST | `/api/v1/users` | Create user account | `USER_CREATE` | none | Implemented |
| GET | `/api/v1/users/{id}` | Read user account | `USER_READ` | none | Implemented |
| POST | `/api/v1/users/{userId}/roles/{roleId}` | Grant role to user | `USER_ROLE_ASSIGN` | none | Implemented |
| POST | `/api/v1/users/{userId}/scopes` | Grant organization scope | `USER_SCOPE_ASSIGN` | none | Implemented |
| POST | `/api/v1/roles` | Create role | `ROLE_CREATE` | none | Implemented |
| GET | `/api/v1/roles/{id}` | Read role | `ROLE_READ` | none | Implemented |
| POST | `/api/v1/roles/{roleId}/permissions/{permissionId}` | Grant permission to role | `ROLE_PERMISSION_ASSIGN` | none | Implemented |
| POST | `/api/v1/permissions` | Create permission | `PERMISSION_CREATE` | none | Implemented |
| GET | `/api/v1/permissions/{id}` | Read permission | `PERMISSION_READ` | none | Implemented |

## D. Endpoint contracts

### POST /api/v1/auth/login

Authenticates a username/password pair and returns a JWT.

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
- Side effects: none persisted.

Token details: HS256, 15-minute lifetime, claims `sub`/`username`/`iat`/`exp`.

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

## G. Authorization matrix

| Permission | Read | Create | Assign |
|---|---|---|---|
| `USER_READ` / `USER_CREATE` / `USER_ROLE_ASSIGN` / `USER_SCOPE_ASSIGN` | yes | yes | yes |
| `ROLE_READ` / `ROLE_CREATE` / `ROLE_PERMISSION_ASSIGN` | yes | yes | yes |
| `PERMISSION_READ` / `PERMISSION_CREATE` | yes | yes | - |

All are administrative and carry no organization-scope restriction.

## H. Error contract

Notable codes: `INVALID_CREDENTIALS` (401), `TOO_MANY_LOGIN_ATTEMPTS` (429),
`DUPLICATE_RESOURCE` (409) for duplicate username/email/role/permission codes and
duplicate grants.

## I. State transitions

`UserAccount.active`: created `true`. A deactivated account cannot authenticate
and any existing token stops granting authorities. No V1 API deactivates users.

## J. Dependencies and integrations

- `organization`: scope targets are organization nodes.
- Every module consumes `AuthenticatedUser` and granted authorities.

## K. Open issues and implementation gaps

- No endpoint to list users/roles/permissions (only read-by-id).
- No password reset/change, refresh token, logout or token revocation.
- No API to deactivate users/roles/permissions or revoke grants.
- Login rate limiting is per-instance in memory; multi-instance needs a shared store.
- Unauthenticated requests return the servlet default 401 body, not `ErrorResponse`.
- Administrative endpoints perform no organization-scope enforcement; the
  permission is the only gate. Confirm platform-admin-only access is intended.
