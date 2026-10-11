# Students

Status: **Implemented**

[Shared conventions](../../../../../../../docs/api/README.md) apply.

## A. Module overview

Owns student profiles, linking of student profiles to portal user accounts, and
the student self-service portal endpoints (`/me`). Financial, academic and
attendance data live in other modules; this module owns identity and profile.

Included in V1: student CRUD (create/read/list/update/deactivate), account ->
student linking, current-student resolution for the portal.

Excluded: admissions (see `admissions`), enrollments (see `academic`), medical
or document storage, bulk import.

Dependencies: `organization` (institution/campus), `identity` (user accounts,
student role, institution scope), `guardian` and `staff` (to reject cross-role
account reuse).

Principal classes: `controller/{StudentController,StudentPortalController}`,
`service/{StudentService,StudentAccountLinkService,StudentPortalService,CurrentStudentResolver,StudentSectionResolver}`,
`entity/{Student,StudentAccountLink}`.

## B. API conventions

- Base path: `/api/v1`; portal endpoints under `/api/v1/student-portal`.
- Authentication: bearer; permissions in the inventory.
- Scope: staff endpoints enforce institution/campus scope via
  `OrganizationScopeAuthorization`. Portal endpoints resolve the acting student
  from the authenticated account (never from a client-supplied id).
- Pagination: list endpoint returns a Spring Data `Page`; max size 100.
- Timestamps: `OffsetDateTime`; dates `LocalDate`.

## C. Endpoint inventory

| Method | Path | Purpose | Permission | Scope | Status |
|---|---|---|---|---|---|
| POST | `/api/v1/students` | Create student | `STUDENT_CREATE` | institution/campus | Implemented |
| GET | `/api/v1/students/{id}` | Read student | `STUDENT_READ` | institution/campus | Implemented |
| GET | `/api/v1/students` | Search students | `STUDENT_READ` | institution/campus | Implemented |
| PUT | `/api/v1/students/{id}` | Update student | `STUDENT_UPDATE` | institution/campus | Implemented |
| PATCH | `/api/v1/students/{id}/deactivate` | Deactivate student | `STUDENT_DEACTIVATE` | institution/campus | Implemented |
| POST | `/api/v1/students/{id}/account-link` | Link portal user account | `STUDENT_ACCOUNT_LINK` | institution | Implemented |
| GET | `/api/v1/student-portal/me` | Current student profile | `STUDENT_PORTAL_READ` | self | Implemented |

## D. Endpoint contracts

### POST /api/v1/students

- Request (`CreateStudentRequest`):

| Field | Type | Required | Constraints |
|---|---|---|---|
| `institutionId` | UUID | yes | - |
| `campusId` | UUID | no | must belong to institution |
| `admissionNumber` | string | yes | not blank, <= 50, unique per institution |
| `firstName` | string | yes | not blank, <= 100 |
| `lastName` | string | no | <= 100 |
| `dateOfBirth` | date | no | ISO-8601 |

```json
{
  "institutionId": "11111111-1111-1111-1111-111111111111",
  "campusId": "22222222-2222-2222-2222-222222222222",
  "admissionNumber": "ADM-2026-0001",
  "firstName": "Aarav",
  "lastName": "Sharma",
  "dateOfBirth": "2014-05-02"
}
```

- Response `201` (`StudentResponse`):

```json
{
  "id": "33333333-3333-3333-3333-333333333333",
  "institutionId": "11111111-1111-1111-1111-111111111111",
  "campusId": "22222222-2222-2222-2222-222222222222",
  "admissionNumber": "ADM-2026-0001",
  "firstName": "Aarav",
  "lastName": "Sharma",
  "dateOfBirth": "2014-05-02",
  "active": true
}
```

- Errors: `400 VALIDATION_ERROR`; `403 ACCESS_DENIED` (no scope);
  `404 RESOURCE_NOT_FOUND` (institution/campus); `409 DUPLICATE_RESOURCE`
  (admission number); `422 BUSINESS_RULE_VIOLATION` (inactive institution/campus,
  campus not in institution).
- Business rules: requires campus scope when `campusId` is supplied, else
  institution scope. Admission number is trimmed and unique per institution.

### GET /api/v1/students/{id}

- Response `200` `StudentResponse`; `404` if absent or inactive; `403` if out of scope.
- Scope: campus scope if the student has a campus, else institution scope.

### GET /api/v1/students

- Query parameters:

| Name | Type | Required | Default | Notes |
|---|---|---|---|---|
| `institutionId` | UUID | yes | - | must be active |
| `campusId` | UUID | no | - | must belong to institution |
| `search` | string | no | - | case-insensitive substring of admission number or first/last name |
| `page`,`size`,`sort` | - | no | `size=20`, `sort=firstName,asc` | size capped at 100 |

- Response `200` `Page<StudentResponse>` (see shared envelope).
- Errors: `400`, `403`, `404`, `422` (inactive institution/campus).

### PUT /api/v1/students/{id}

- Request (`UpdateStudentRequest`): `admissionNumber` (required, <= 50),
  `firstName` (required, <= 100), `lastName` (<= 100), `dateOfBirth` (optional).
- Response `200` `StudentResponse`.
- Errors: `400`, `403`, `404`, `409 DUPLICATE_RESOURCE`, `409 CONCURRENT_MODIFICATION`.
- Business rules: only active students can be updated; admission number unique
  per institution (excluding self). Optimistic locking on `version`.

### PATCH /api/v1/students/{id}/deactivate

- No body. Response `200` `StudentResponse` with `active=false`.
- Errors: `403`, `404`.
- Side effects: the student disappears from default searches/reads.

### POST /api/v1/students/{id}/account-link

- Request (`LinkStudentAccountRequest`): `userAccountId` (UUID, required).
- Response `201` (`StudentAccountLinkResponse`):
  `{ id, studentId, userAccountId, createdAt }`.
- Errors: `400`, `403 ACCESS_DENIED` (no institution scope), `404`, `409
  DUPLICATE_RESOURCE` (student or account already linked), `422
  BUSINESS_RULE_VIOLATION` (inactive student/account, account already used by
  staff/guardian, student role missing/inactive).
- Side effects: grants the `STUDENT` role and an `INSTITUTION` scope to the
  linked account (idempotent if already present).

### GET /api/v1/student-portal/me

- Permission `STUDENT_PORTAL_READ`; resolves the student from the authenticated
  account's link.
- Response `200` `StudentResponse`.
- Errors: `403 ACCESS_DENIED` (no link, or inactive student).

## E. Validation and business rules

- Required fields and length caps as above (Bean Validation).
- Unique admission number per institution (DB constraint
  `uk_student_institution_admission`).
- A user account may be linked to at most one student, and a student to at most
  one account. Staff/guardian accounts cannot be linked as students.
- Optimistic locking on `student.version`.

## F. Authorization matrix

| Actor / permission | Read | Create | Update | Deactivate | Link | Notes |
|---|---|---|---|---|---|---|
| `STUDENT_READ` | yes | - | - | - | - | institution/campus scope |
| `STUDENT_CREATE` | - | yes | - | - | - | institution/campus scope |
| `STUDENT_UPDATE` | - | - | yes | - | - | institution/campus scope |
| `STUDENT_DEACTIVATE` | - | - | - | yes | - | institution/campus scope |
| `STUDENT_ACCOUNT_LINK` | - | - | - | - | yes | institution scope |
| `STUDENT_PORTAL_READ` | self | - | - | - | - | own profile only |

## G. Error contract

`400 VALIDATION_ERROR`, `403 ACCESS_DENIED`, `404 RESOURCE_NOT_FOUND`,
`409 DUPLICATE_RESOURCE`, `409 CONCURRENT_MODIFICATION`, `422 BUSINESS_RULE_VIOLATION`.

## H. State transitions

```
active --PATCH /{id}/deactivate--> inactive
```

- Reversible? No V1 endpoint reactivates a student.
- Reads/searches return active students only.

## I. Dependencies and integrations

- `identity`: roles/scopes assigned on account link.
- `organization`: institution/campus validation and scope.
- `guardian`/`staff`: consulted to prevent cross-role account reuse.
- `academic`, `attendance`, `assessment`, `homework`: key off `student_id`.

## J. Open issues and implementation gaps

- Fetch-before-authorize ordering means an out-of-scope id returns `403` only
  after the entity is loaded; a missing id returns `404`. This can leak
  existence. Accepted for V1.
- `lastName` is optional and searches use `COALESCE(last_name,'')`.
- No bulk import, document upload or medical data.
- No reactivation endpoint.
- `StudentPortalService` requires an active link; accounts without a link get `403`.
