# Staff

Status: **Implemented**

[Shared conventions](../../../../../../../docs/api/README.md) apply.

## A. Module overview

Owns staff members and their institutional assignments. A `StaffAssignment`
links a `StaffMember` to an institution (and optional campus) with an employee
number, staff type, job title, start/end dates and a lifecycle status.

Included in V1: create staff (member + initial assignment), list assignments for
an institution filtered by status, change assignment status.

Excluded: updating staff profile fields, deleting staff, compensation/HR data,
linking a staff member to login roles (done via `identity`).

Dependencies: `organization`, `identity` (optional user account link).

Principal classes: `controller/StaffController`, `service/StaffManagementService`,
`entity/{StaffMember,StaffAssignment,StaffType,StaffAssignmentStatus}`.

## B. API conventions

- Base path: `/api/v1/staff`.
- Authentication: bearer; `STAFF_CREATE` / `STAFF_READ` / `STAFF_UPDATE`.
- Scope: institution scope enforced on every endpoint
  (`OrganizationScopeAuthorization.canAccessInstitution`).
- Pagination: list endpoint returns `Page<StaffAssignmentResponse>`; max size 100.
- Dates: `LocalDate`.

## C. Endpoint inventory

| Method | Path | Purpose | Permission | Scope | Status |
|---|---|---|---|---|---|
| POST | `/api/v1/staff` | Create staff + assignment | `STAFF_CREATE` | institution | Implemented |
| GET | `/api/v1/staff` | List assignments by institution/status | `STAFF_READ` | institution | Implemented |
| PATCH | `/api/v1/staff/assignments/{assignmentId}/status` | Change assignment status | `STAFF_UPDATE` | institution | Implemented |

## D. Endpoint contracts

### POST /api/v1/staff

- Request (`CreateStaffRequest`):

| Field | Type | Required | Constraints |
|---|---|---|---|
| `institutionId` | UUID | yes | must be active |
| `campusId` | UUID | no | active and in institution |
| `userAccountId` | UUID | no | must exist and be active |
| `firstName` | string | yes | not blank, <= 100 |
| `lastName` | string | yes | not blank, <= 100 |
| `email` | string | no | valid email, <= 255 |
| `phone` | string | no | <= 30 |
| `employeeNumber` | string | yes | not blank, <= 50, unique per institution |
| `staffType` | enum | yes | `TEACHER|PRINCIPAL|ADMINISTRATOR|LIBRARIAN|COUNSELOR|SUPPORT` |
| `jobTitle` | string | yes | not blank, <= 120 |
| `startDate` | date | yes | not in the future |

```json
{
  "institutionId": "11111111-1111-1111-1111-111111111111",
  "campusId": null,
  "userAccountId": null,
  "firstName": "Meera",
  "lastName": "Nair",
  "email": "meera.nair@example.org",
  "phone": "+91-9000000000",
  "employeeNumber": "EMP-0007",
  "staffType": "TEACHER",
  "jobTitle": "Mathematics Teacher",
  "startDate": "2026-06-01"
}
```

- Response `201` (`StaffAssignmentResponse`, all fields):

```json
{
  "staffMemberId": "aaaa...",
  "assignmentId": "bbbb...",
  "institutionId": "1111...",
  "campusId": null,
  "userAccountId": null,
  "firstName": "Meera",
  "lastName": "Nair",
  "email": "meera.nair@example.org",
  "phone": "+91-9000000000",
  "employeeNumber": "EMP-0007",
  "staffType": "TEACHER",
  "jobTitle": "Mathematics Teacher",
  "startDate": "2026-06-01",
  "endDate": null,
  "status": "ACTIVE"
}
```

- Errors: `400`, `403`, `404`, `409 DUPLICATE_RESOURCE` (employee number),
  `422 BUSINESS_RULE_VIOLATION` (inactive institution, campus mismatch, inactive
  account, future start date).
- Side effects: creates one `StaffMember` and one `StaffAssignment` (status
  `ACTIVE`).

### GET /api/v1/staff

- Query parameters:

| Name | Type | Required | Default | Notes |
|---|---|---|---|---|
| `institutionId` | UUID | yes | - | institution scope required |
| `status` | enum | no | `ACTIVE` | `ACTIVE|ON_LEAVE|INACTIVE|TERMINATED` |
| `page`,`size`,`sort` | - | no | `size=20`, `sort=employeeNumber,asc` | size capped at 100 |

- Response `200` `Page<StaffAssignmentResponse>`.
- Errors: `400`, `403`.

### PATCH /api/v1/staff/assignments/{assignmentId}/status

- Request (`UpdateStaffAssignmentStatusRequest`): `status` (required).
- Response `200` `StaffAssignmentResponse`.
- Errors: `400`, `403`, `404`, `422 BUSINESS_RULE_VIOLATION`
  (assignment already `INACTIVE`/`TERMINATED`; reactivating an assignment that
  has an `endDate`).
- Business rules / state transitions:

```
ACTIVE   -> ON_LEAVE | INACTIVE | TERMINATED
ON_LEAVE -> ACTIVE | INACTIVE | TERMINATED
INACTIVE -> (terminal; not reactivatable here)
TERMINATED -> (terminal; not reactivatable here)
```

- Side effect: transitioning to `TERMINATED` sets `endDate` to today when unset.

## E. Validation and business rules

- Employee number unique per institution
  (`staff_assignment(institution_id, employee_number)`).
- `startDate` cannot be in the future.
- Campus, when supplied, must be active and belong to the institution.
- A supplied `userAccountId` must exist and be active.

## F. Authorization matrix

| Permission | Read | Create | Update status | Notes |
|---|---|---|---|---|
| `STAFF_READ` | yes | - | - | institution scope |
| `STAFF_CREATE` | - | yes | - | institution scope |
| `STAFF_UPDATE` | - | - | yes | institution scope |

## G. Error contract

`400 VALIDATION_ERROR`, `403 ACCESS_DENIED`, `404 RESOURCE_NOT_FOUND`,
`409 DUPLICATE_RESOURCE`, `409 CONCURRENT_MODIFICATION`,
`422 BUSINESS_RULE_VIOLATION`.

## H. State transitions

See the diagram in D. Assignment lifecycle is one-way into `INACTIVE`/`TERMINATED`
through this endpoint; there is no delete.

## I. Dependencies and integrations

- `identity`: an assignment can reference a login account; staff accounts cannot
  be linked as students (enforced in the student module).
- `academic`/`timetable`: use `StaffAssignment` ids for teacher assignments
  (`TeacherSubjectAssignment`, `ScheduledLesson`).

## J. Open issues and implementation gaps

- No endpoint to update staff profile fields or assignment details (job title,
  campus, dates).
- No delete; only status changes.
- `getStaffByInstitution` does not verify the institution is active.
- `ON_LEAVE` transitions are unrestricted by leave data (no cross-check with the
  `leave` module).
