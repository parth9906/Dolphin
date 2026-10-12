# Dolphin Platform — API Contract Index

This directory is the entry point for Dolphin's API contracts. Each feature
module has its own `README.md` colocated with its Java package, documenting the
endpoints that module owns.

The source code is authoritative. Where a module is not yet implemented, its
contract is labelled **Proposed — Not Yet Implemented** and describes the
intended behaviour only.

## Conventions

- **Base path**: every endpoint is served under `/api/v1`.
- **API version**: `v1`, expressed in the URL path (`/api/v1/...`). There is no
  header-based version negotiation.
- **Content type**: `application/json` for requests and responses.
- **Authentication**: stateless JWT bearer tokens.
- **Authorization**: permission-based (`@PreAuthorize` authorities) plus
  organization/institution/campus scope checks performed in the service layer.

## Authentication

Obtain a token with `POST /api/v1/auth/login`. Send it on every other request:

```
Authorization: Bearer <token>
```

Token properties (see `identity/README.md`):

- Signed HS256 (HMAC-SHA-256) with a base64-encoded key of at least 32 bytes.
- The signing key comes from the `JWT_SECRET` environment variable. The
  application fails fast at startup if it is missing, not valid base64, or
  shorter than 256 bits.
- Lifetime: 900 seconds (15 minutes), from `dolphin.security.jwt.expiration-ms`.
- Claims: `sub` (user id), `username`, `roles`, `permissions`, `iss`, `aud`,
  `iat`, `exp`, `jti`.
- `roles` and `permissions` are the caller's effective role and permission
  codes captured at issue/refresh time. Requests are authenticated locally from
  these signed claims: the filter verifies signature, expiration, issuer and
  audience and performs **no** database access. Client-supplied roles or
  permissions are never trusted.

Authorities attached to the authenticated principal are:

- `ROLE_<CODE>` for every active role, for example `ROLE_TEACHER`.
- The raw permission code for every active permission of those roles, for
  example `STUDENT_READ`.

Only *active* users with *active* roles/permissions receive authorities, and
only at token-issue time. Because access tokens are not re-checked against the
database, deactivation or a permission change takes effect on the next refresh
at the latest, within the 15-minute access-token lifetime. This staleness
ceiling is an accepted trade-off; domain checks below are always live.

### Refresh and logout

`POST /api/v1/auth/login` returns a short-lived access token and a long-lived
refresh token.

- `POST /api/v1/auth/refresh` exchanges a refresh token for a new access token
  and a **rotated** refresh token. Reusing an already-rotated token revokes the
  whole session family.
- `POST /api/v1/auth/logout` revokes the session.
- Only the SHA-256 hash of a refresh token is stored. Refresh always reloads
  current account status and effective permissions; deactivated accounts are
  rejected.
- Refresh sessions are revoked on logout, password change and account
  deactivation.

Refresh tokens are currently exchanged in the JSON request/response body,
consistent with the existing bearer-token API. A future browser client should
adopt an `HttpOnly`, `Secure`, `SameSite` cookie with CSRF protection; that
decision is tracked in `identity/README.md`.

### Public endpoints

Only these endpoints are reachable without a token:

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/auth/login` | Authenticate; obtain access + refresh token |
| POST | `/api/v1/auth/refresh` | Rotate a refresh token and obtain a new access token |
| POST | `/api/v1/auth/logout` | Revoke a refresh session |
| POST | `/api/v1/guardian-invitations/accept` | Accept a guardian invitation and create a portal account |

Everything else requires an authenticated principal (`anyRequest().authenticated()`).

## Authorization model

Authorization has two independent layers:

1. **Permission check** (`@PreAuthorize("hasAuthority('X')")`) on the controller
   method. Failing it yields `403 ACCESS_DENIED`.
2. **Scope check** in the service layer, using
   `OrganizationScopeAuthorization.canAccessInstitution(...)` /
   `canAccessCampus(...)`. A user must hold an active organization scope that
   contains the target institution or campus.

Scope semantics (`OrganizationScopeType`):

- `ENTERPRISE`, `REGION`, `CLUSTER`, `INSTITUTION` scopes grant access to every
  institution inside that node.
- `CAMPUS` scope grants access only to that campus (`canAccessCampus`); it does
  **not** grant institution-wide access (`canAccessInstitution` returns false).
- The whole institution hierarchy (enterprise -> region -> cluster ->
  institution, and the campus) must be active for access to be granted.

Never trust client-supplied user ids as proof of identity. Portal endpoints
resolve the acting student/guardian from the authenticated principal.

Permission checks (`hasAuthority(...)`) use only the authorities embedded in the
access token and therefore do not query PostgreSQL. Everything else in this
section — organization scope, student ownership, guardian relationships,
teaching assignments and other resource checks — remains database-backed and is
unaffected by token issuance.

## Common pagination, filtering and sorting

- Paginated endpoints accept Spring Data `page`, `size` and `sort` query
  parameters and return a Spring Data `Page` serialized as the default
  `PageImpl` JSON envelope:

```json
{
  "content": [],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "sort": { "sorted": true, "unsorted": false, "empty": false },
    "offset": 0,
    "paged": true,
    "unpaged": false
  },
  "totalElements": 0,
  "totalPages": 0,
  "last": true,
  "size": 20,
  "number": 0,
  "sort": { "sorted": true, "unsorted": false, "empty": false },
  "numberOfElements": 0,
  "first": true,
  "empty": true
}
```

- `spring.data.web.pageable.max-page-size=100` caps `size`; requests above the
  cap are clamped. `spring.data.web.pageable.default-page-size=20` is the
  default when `size` is omitted.
- Default sort orders are declared per endpoint with `@PageableDefault`.
- A handful of endpoints take explicit `page`/`size` integers or return
  non-paginated lists; each module README documents its own behaviour.

## Timestamps and time zones

- Instant-style timestamps (created/updated/occurred) use
  `OffsetDateTime`, serialized as ISO-8601 with an offset, for example
  `2026-01-15T09:30:00+05:30`.
- Calendar dates use `LocalDate` (`2026-01-15`).
- Times of day use `LocalTime` (`09:30:00`).
- Values are stored/returned in the JVM default zone offset; there is no
  per-request time-zone negotiation.

## Identifiers

All entity identifiers are UUIDs, serialized as strings.

## Error contract

Application errors raised through the global exception handler use
`common/response/ErrorResponse`:

```json
{
  "timestamp": "2026-01-15T09:30:00+05:30",
  "status": 404,
  "code": "RESOURCE_NOT_FOUND",
  "message": "Student not found",
  "path": "/api/v1/students/2f1c..."
}
```

| Code | HTTP | Raised by |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Bean Validation failures on a request body |
| `MALFORMED_REQUEST` | 400 | Unreadable body or wrong parameter type |
| `INVALID_CREDENTIALS` | 401 | Failed login (generic message) |
| `INVALID_REFRESH_TOKEN` | 401 | Unknown, expired, revoked or reused refresh token |
| `ACCESS_DENIED` | 403 | Missing permission or failed scope check |
| `RESOURCE_NOT_FOUND` | 404 | Missing entity |
| `DUPLICATE_RESOURCE` | 409 | Unique-code/business duplicate |
| `CONSTRAINT_VIOLATION` | 409 | Database constraint violation |
| `CONCURRENT_MODIFICATION` | 409 | Optimistic/pessimistic lock conflict or stale version |
| `BUSINESS_RULE_VIOLATION` | 422 | Rule violation detected in a service |
| `TOO_MANY_LOGIN_ATTEMPTS` | 429 | Login rate limit exceeded |

> **Note.** Unauthenticated requests to protected endpoints are rejected by the
> security filter chain with Spring's servlet error response (`401`), which does
> **not** use the `ErrorResponse` shape above. The `ErrorResponse` body is
> returned for `403` and all handled application exceptions.

No stack traces, SQL internals, credentials or tokens are returned in API
responses.

## Module contracts

| Module | Package | Status | Contract |
|---|---|---|---|
| Identity & authentication | `identity` | Implemented | [identity/README.md](../../src/main/java/com/school/dolphin/identity/README.md) |
| Organization hierarchy | `organization` | Implemented | [organization/README.md](../../src/main/java/com/school/dolphin/organization/README.md) |
| Students | `student` | Implemented | [student/README.md](../../src/main/java/com/school/dolphin/student/README.md) |
| Staff | `staff` | Implemented | [staff/README.md](../../src/main/java/com/school/dolphin/staff/README.md) |
| Academic structure & subjects | `academic` | Implemented | [academic/README.md](../../src/main/java/com/school/dolphin/academic/README.md) |
| Attendance | `attendance` | Implemented | [attendance/README.md](../../src/main/java/com/school/dolphin/attendance/README.md) |
| Assessment & marks | `assessment` | Implemented | [assessment/README.md](../../src/main/java/com/school/dolphin/assessment/README.md) |
| Timetable & scheduling | `timetable` | Implemented | [timetable/README.md](../../src/main/java/com/school/dolphin/timetable/README.md) |
| Staff & student leave | `leave` | Implemented | [leave/README.md](../../src/main/java/com/school/dolphin/leave/README.md) |
| Events & calendar | `calendar` | Implemented | [calendar/README.md](../../src/main/java/com/school/dolphin/calendar/README.md) |
| Guardians | `guardian` | Implemented | [guardian/README.md](../../src/main/java/com/school/dolphin/guardian/README.md) |
| Parent portal | `parent` | Partially Implemented | [parent/README.md](../../src/main/java/com/school/dolphin/parent/README.md) |
| Homework & assignments | `homework` | Implemented | [homework/README.md](../../src/main/java/com/school/dolphin/homework/README.md) |
| Discipline & behaviour | `discipline` | Implemented | [discipline/README.md](../../src/main/java/com/school/dolphin/discipline/README.md) |
| Admissions | `admissions` | Implemented | [admissions/README.md](../../src/main/java/com/school/dolphin/admissions/README.md) |
| Hostel | `hostel` | Implemented | [hostel/README.md](../../src/main/java/com/school/dolphin/hostel/README.md) |
| Inventory | `inventory` | Implemented | [inventory/README.md](../../src/main/java/com/school/dolphin/inventory/README.md) |
| Mess / canteen | `mess` | Implemented | [mess/README.md](../../src/main/java/com/school/dolphin/mess/README.md) |
| Notifications & outbox | `notification` | Implemented | [notification/README.md](../../src/main/java/com/school/dolphin/notification/README.md) |
| Analytics | `analytics` | Partially Implemented | [analytics/README.md](../../src/main/java/com/school/dolphin/analytics/README.md) |
| Certificates & documents | `document` | Partially Implemented | [document/README.md](../../src/main/java/com/school/dolphin/document/README.md) |

Status legend: **Implemented** (endpoints exist), **Partially Implemented**
(ships only part of the frozen V1 scope), **Proposed** (no code yet).

Reserved but empty packages (no code, no contract yet): `audit`,
`authorization`, `examination`. `examination` overlaps the implemented
`assessment` module; `audit` is currently expressed through per-module audit
endpoints (attendance, marks, staff leave, substitute assignment); `authorization`
is currently expressed through `identity` roles/permissions/scopes.
