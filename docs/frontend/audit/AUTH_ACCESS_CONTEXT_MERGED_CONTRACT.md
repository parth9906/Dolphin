# Authentication response contract: embedded access context

Status: **frontend migrated to the merged login/refresh response contract**. Successful login and refresh responses are required to include `accessContext`. The frontend no longer calls `GET /api/v1/me/access-context`.

## Goal

Return the authenticated user's access context in both successful login and refresh responses. The frontend consumes this embedded context for login, session restoration, and refresh; it does not fall back to a separate access-context endpoint. Missing or identity-mismatched context makes the authentication response invalid.

## Endpoints

### `POST /api/v1/auth/login`

Request (unchanged):

```json
{
  "username": "string",
  "password": "string"
}
```

Successful response (add `accessContext`; retain existing token and identity fields):

```json
{
  "accessToken": "string",
  "tokenType": "Bearer",
  "expiresInSeconds": 900,
  "refreshToken": "string",
  "refreshExpiresInSeconds": 2592000,
  "userId": "uuid",
  "username": "string",
  "accessContext": {
    "userId": "uuid",
    "username": "string",
    "roles": ["PLATFORM_ADMIN"],
    "permissions": ["ENTERPRISE_READ"],
    "scopes": [
      { "scopeType": "ENTERPRISE", "scopeId": "uuid" }
    ]
  }
}
```

### `POST /api/v1/auth/refresh`

Request (unchanged):

```json
{ "refreshToken": "string" }
```

Successful response: same response schema as login, including a newly rotated access token, refresh token, expiry fields, identity, and freshly resolved `accessContext`. Do not return a stale context captured when the refresh token was first issued. Preserve existing refresh-token rotation and replay/family-revocation behavior.

## Access-context schema

- `userId`: UUID string for the authenticated principal.
- `username`: authenticated username.
- `roles`: array of role-code strings.
- `permissions`: array of permission-code strings.
- `scopes`: array of `{ "scopeType": string, "scopeId": UUID string }`.

The backend must derive all fields from the authenticated principal and current persisted role/permission/scope assignments. Never accept roles, permissions, or scopes from the login request or refresh request. Apply the same access-control and account-state checks used by the existing access-context endpoint.

## Status and error behavior

- Login keeps existing invalid-credentials, locked/disabled-account, and rate-limit behavior. Do not return access context on a failed authentication response.
- Refresh keeps existing invalid/expired/replayed-refresh-token behavior and token-family revocation. Do not return a successful context if refresh fails.
- A successful response must contain a context consistent with the returned `userId` and `username`; frontend should treat mismatches as an invalid session and clear it.
- Existing error envelope and HTTP status behavior should remain unchanged.

## Security and compatibility requirements

1. `accessContext` is authorization metadata, not a replacement for backend authorization. Every protected endpoint must continue checking permissions and organization scope server-side.
2. Refresh must resolve current permissions and scopes, so role/scope revocations become effective on the next refresh. For immediate revocation, retain the backend's existing token/session invalidation strategy.
3. Preserve refresh-token rotation, replay detection, and session-family revocation.
4. All deployed clients must be upgraded before removing the old GET endpoint from the backend. This frontend intentionally fails closed if login or refresh omits `accessContext`; it does not call the old endpoint as a fallback.
5. Add backend controller/service tests for login and refresh responses, scope changes between refreshes, disabled users, invalid refresh tokens, replay, and token/context identity consistency.

## Organization management authorization

The Organization navigation and route should only be available when the access context includes an applicable organization permission. Creation actions must be gated by their specific permissions (`ENTERPRISE_CREATE`, `REGION_CREATE`, and the backend-defined create permissions for clusters and institutions). These frontend checks only control visibility; backend checks remain authoritative.

## Organization tree creation scope note

The current verified frontend/backend inventory supports enterprise creation (`POST /api/v1/enterprises`) and region creation (`POST /api/v1/regions`). It does not establish verified cluster-create or institution-create request/response DTOs. The frontend must not invent those payloads or show creation actions that cannot be submitted to a real backend operation. To complete creation at every tree level, backend owners should provide the existing controller mappings, DTOs, permission codes, and validation/error behavior for cluster and institution creation (or explicitly authorize new contracts).
