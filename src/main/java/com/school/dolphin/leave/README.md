# Staff Leave

Status: **Implemented** (staff leave and student leave)

[Shared conventions](../../../../../../../docs/api/README.md) apply.

## A. Module overview

Owns staff and student leave requests, their review workflow and audit trail.

Included in V1: create leave request, list by institution/status, approve,
reject, cancel, audit history - for both staff and students.

Excluded: leave-balance/entitlement accounting, leave types administration
(the `leave_type` table is seeded, not exposed via API), student self-service
leave (students are currently managed on their behalf by institution-scoped
staff).

Dependencies: `staff` (`staffMemberId`), `student` (`studentId` and active
enrollment), `academic`, `organization`, `identity`, `timetable` (approved
staff leave suppresses lesson occurrences).

Principal classes: `controller/{StaffLeaveController,StudentLeaveController}`,
`service/{StaffLeaveService,StudentLeaveService}`,
`entity/{StaffLeaveRequest,StudentLeaveRequest,StaffLeaveAudit,StudentLeaveAudit,LeaveType,LeaveRequestStatus}`.

## B. API conventions

- Base path: `/api/v1/staff-leave`.
- Authentication: bearer; permissions in the inventory.
- Scope: institution scope enforced.
- Pagination: list returns `Page<StaffLeaveResponse>`.
- Dates: `LocalDate`; `LeaveRequestStatus` = `PENDING | APPROVED | REJECTED | CANCELLED`.

## C. Endpoint inventory

| Method | Path | Purpose | Permission | Scope |
|---|---|---|---|---|
| POST | `/api/v1/staff-leave` | Create leave request | `STAFF_LEAVE_CREATE` | institution |
| GET | `/api/v1/staff-leave` | List by institution/status | `STAFF_LEAVE_READ` | institution |
| POST | `/api/v1/staff-leave/{leaveId}/approve` | Approve | `STAFF_LEAVE_REVIEW` | institution |
| POST | `/api/v1/staff-leave/{leaveId}/reject` | Reject | `STAFF_LEAVE_REVIEW` | institution |
| POST | `/api/v1/staff-leave/{leaveRequestId}/cancel` | Cancel | `STAFF_LEAVE_CANCEL` | institution |
| GET | `/api/v1/staff-leave/{leaveId}/audit` | Audit trail | `STAFF_LEAVE_AUDIT_READ` | institution |

All `Implemented` (within the staff-only scope).

## D. Endpoint contracts

### POST /api/v1/staff-leave

`CreateStaffLeaveRequest`: `staffMemberId` (required), `institutionId`
(required), `leaveTypeId` (required), `startDate`, `endDate` (required),
`reason` (<= 1000). Response `201` `StaffLeaveResponse`. New status `PENDING`.
Errors: `400`, `403`, `404`, `409 DUPLICATE_RESOURCE` (overlapping
`PENDING`/`APPROVED` leave for the same staff member), `422`.

### GET /api/v1/staff-leave

Query: `institutionId` (required), `status` (required), `page`,`size`,`sort`
(default `size=20`, `sort=startDate`). Response `200` `Page<StaffLeaveResponse>`.

### POST /api/v1/staff-leave/{leaveId}/approve | /reject

Body (`ReviewStaffLeaveRequest`): `comment` (required, <= 1000). Response `200`
`StaffLeaveResponse`. Rules: only `PENDING` requests can be reviewed;
`APPROVED`/`REJECTED` set `reviewedByUserId`/`reviewedAt`/`decisionComment`.
Errors: `400`, `403`, `404`, `422` (not pending).

### POST /api/v1/staff-leave/{leaveRequestId}/cancel

No body. Response `200` `StaffLeaveResponse`. Rules: only `PENDING` requests can
be cancelled. Transition `PENDING -> CANCELLED`.

### GET /api/v1/staff-leave/{leaveId}/audit

Response `200` `List<StaffLeaveAuditResponse>` (status transitions with actor
and timestamp).

## E. Validation and business rules

- Overlapping `PENDING`/`APPROVED` leave for the same staff member is rejected
  (`409`).
- Only `PENDING` requests transition (review or cancel).
- Review requires a comment.

## F. Authorization matrix

| Permission | Read | Create | Review | Cancel |
|---|---|---|---|---|
| `STAFF_LEAVE_READ` | yes | - | - | - |
| `STAFF_LEAVE_CREATE` | - | yes | - | - |
| `STAFF_LEAVE_REVIEW` | - | - | yes | - |
| `STAFF_LEAVE_CANCEL` | - | - | - | yes |
| `STAFF_LEAVE_AUDIT_READ` | yes (audit) | - | - | - |

## G. Error contract

`400`, `403`, `404`, `409 DUPLICATE_RESOURCE`, `422 BUSINESS_RULE_VIOLATION`.

## H. State transitions

```
PENDING --approve--> APPROVED
PENDING --reject--> REJECTED
PENDING --cancel--> CANCELLED
```

`APPROVED`, `REJECTED` and `CANCELLED` are terminal in V1.

## S. Student leave

Base path: `/api/v1/student-leave`. The workflow, state machine, error contract
and audit behaviour mirror the staff module above; permissions are
`STUDENT_LEAVE_CREATE`, `STUDENT_LEAVE_READ`, `STUDENT_LEAVE_REVIEW`,
`STUDENT_LEAVE_CANCEL`, `STUDENT_LEAVE_AUDIT_READ` (all institution-scoped).

| Method | Path | Purpose | Permission |
|---|---|---|---|
| POST | `/api/v1/student-leave` | Create leave for a student | `STUDENT_LEAVE_CREATE` |
| GET | `/api/v1/student-leave?institutionId&status` | List by institution/status | `STUDENT_LEAVE_READ` |
| POST | `/api/v1/student-leave/{leaveId}/approve` | Approve | `STUDENT_LEAVE_REVIEW` |
| POST | `/api/v1/student-leave/{leaveId}/reject` | Reject | `STUDENT_LEAVE_REVIEW` |
| POST | `/api/v1/student-leave/{leaveRequestId}/cancel` | Cancel | `STUDENT_LEAVE_CANCEL` |
| GET | `/api/v1/student-leave/{leaveId}/audit` | Audit trail | `STUDENT_LEAVE_AUDIT_READ` |

`CreateStudentLeaveRequest`: `studentId`, `institutionId`, `leaveTypeId`,
`startDate`, `endDate`, `reason` (<= 1000). Rules: the student must be active,
belong to the requested institution, and hold an active enrollment; overlapping
`PENDING`/`APPROVED` leave for the same student is rejected with
`409 DUPLICATE_RESOURCE`. `ReviewStudentLeaveRequest`: `comment` (required,
<= 1000). Responses reuse the staff shapes with `studentId` in place of
`staffMemberId`.

## I. Dependencies and integrations

- `timetable`: approved leave suppresses generated lesson occurrences.
- `staff`: the requesting staff member and institution.
- `student`/`academic`: the requesting student and their active enrollment.

## J. Open issues and implementation gaps

- No student self-service portal endpoints (leave is created and reviewed on
  the student's behalf by institution-scoped staff).
- `cancel` permission is separate from `create`; there is no ownership rule
  requiring the canceller to be the requester (any holder of the cancel
  permission in scope can cancel).
- No leave-type administration endpoint; types are DB-seeded.
- No leave-balance accounting or entitlement checks.
