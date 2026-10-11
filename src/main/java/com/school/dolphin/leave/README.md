# Staff Leave

Status: **Partially Implemented** (staff leave only; student leave is not implemented)

[Shared conventions](../../../../../../../docs/api/README.md) apply.

## A. Module overview

Owns staff leave requests, their review workflow and audit trail.

Included in V1: create leave request, list by institution/status, approve,
reject, cancel, audit history.

Excluded: student leave, leave-balance/entitlement accounting, leave types
administration (the `leave_type` table is seeded, not exposed via API).

Dependencies: `staff` (`staffMemberId`), `organization`, `identity`, `timetable`
(approved leave suppresses lesson occurrences).

Principal classes: `controller/StaffLeaveController`,
`service/StaffLeaveService`, `entity/{StaffLeaveRequest,StaffLeaveAudit,LeaveType,LeaveRequestStatus}`.

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

## I. Dependencies and integrations

- `timetable`: approved leave suppresses generated lesson occurrences.
- `staff`: the requesting staff member and institution.

## J. Open issues and implementation gaps

- No student leave (V1 "Leave Management" is only partially covered).
- `cancel` permission is separate from `create`; there is no ownership rule
  requiring the canceller to be the requester (any holder of
  `STAFF_LEAVE_CANCEL` in scope can cancel).
- No leave-type administration endpoint; types are DB-seeded.
- No leave-balance accounting or entitlement checks.
