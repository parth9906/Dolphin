# Parent Portal

Status: **Partially Implemented**

[Shared conventions](../../../../../../../docs/api/README.md) apply.

## A. Module overview

Read-only, guardian-scoped views of linked students. The module is a thin,
ownership-enforcing facade over data owned by `student`, `attendance` and
`academic`.

Included in V1: list my linked students, read one linked student, that student's
daily attendance, lesson-attendance history and summary, and attendance alerts.

Excluded: grades/report cards for parents, homework, fees, messaging,
appointments.

Dependencies: `guardian` (relationship), `student`, `attendance`.

Principal classes: `controller/ParentPortalController`,
`service/ParentPortalService`.

## B. API conventions

- Base path: `/api/v1/parent-portal`.
- Authentication: bearer; class-level `@PreAuthorize("hasAuthority('PARENT_PORTAL_READ')")`.
- Scope: **guardian ownership** - every request resolves the authenticated
  guardian and verifies an active, authorized relationship with the requested
  student. The client-supplied `studentId` is never trusted on its own.
- Pagination: none (all reads return full lists).
- Dates: `LocalDate` query params `from`/`to` (some endpoints use
  `startDate`/`endDate`).

## C. Endpoint inventory

| Method | Path | Purpose | Permission | Scope |
|---|---|---|---|---|
| GET | `/api/v1/parent-portal/students` | List linked students | `PARENT_PORTAL_READ` | guardian ownership |
| GET | `/api/v1/parent-portal/students/{studentId}` | Read linked student | `PARENT_PORTAL_READ` | guardian ownership |
| GET | `/api/v1/parent-portal/students/{studentId}/attendance` | Daily attendance | `PARENT_PORTAL_READ` | guardian ownership |
| GET | `/api/v1/parent-portal/students/{studentId}/lesson-attendance` | Lesson history | `PARENT_PORTAL_READ` | guardian ownership |
| GET | `/api/v1/parent-portal/students/{studentId}/lesson-attendance/summary` | Lesson summary | `PARENT_PORTAL_READ` | guardian ownership |
| GET | `/api/v1/parent-portal/students/{studentId}/attendance-alerts` | Attendance alerts | `PARENT_PORTAL_READ` | guardian ownership |

All `Implemented` (within the limited parent scope).

## D. Endpoint contracts

### GET /api/v1/parent-portal/students

No params. Response `200` `List<ParentPortalStudentResponse>`:
`{ studentId, admissionNumber, firstName, lastName, dateOfBirth }`.

### GET /api/v1/parent-portal/students/{studentId}

Response `200` `ParentPortalStudentResponse`. Errors `403` (not linked), `404`.

### GET /api/v1/parent-portal/students/{studentId}/attendance

Query: `from`, `to`. Response `200` `List<ParentAttendanceResponse>`:
`{ studentId, attendanceDate, status, remarks }`.

### GET /api/v1/parent-portal/students/{studentId}/lesson-attendance

Query: `startDate`, `endDate`. Response `200`
`List<ParentLessonAttendanceItemResponse>`.

### GET /api/v1/parent-portal/students/{studentId}/lesson-attendance/summary

Query: `startDate`, `endDate`. Response `200`
`ParentLessonAttendanceSummaryResponse`.

### GET /api/v1/parent-portal/students/{studentId}/attendance-alerts

No params. Response `200` `List<AttendanceAlertResponse>`.

## E. Validation and business rules

- The guardian must have an active authorized relationship with the student;
  otherwise `403 ACCESS_DENIED`.
- Query date validation when `from > to` is enforced by the underlying service.

## F. Authorization matrix

| Endpoint group | Read | Special restriction |
|---|---|---|
| All parent-portal endpoints | yes | `PARENT_PORTAL_READ` + active guardian relationship with the requested student |

## G. Error contract

`400` (bad dates), `403 ACCESS_DENIED` (not a linked guardian), `404`.

## H. State transitions

None (read-only).

## I. Dependencies and integrations

- `guardian`: relationship and authorization source.
- `attendance`: daily/lesson attendance and alerts data.

## J. Open issues and implementation gaps

- No parent access to marks/report cards, homework, timetable, calendar or fees.
- The controller mixes `from/to` and `startDate/endDate` query naming across
  endpoints; documented as-is.
- No pagination on attendance history; a wide date range can be large.
