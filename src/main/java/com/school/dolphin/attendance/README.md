# Attendance

Status: **Implemented**

[Shared conventions](../../../../../../../docs/api/README.md) apply.

## A. Module overview

Owns daily attendance records, per-lesson (period) attendance, attendance alerts
and attendance analytics, plus the student-portal attendance views.

Included in V1: daily attendance mark/update/read with audit, daily summary and
trend, lesson attendance roster/mark/correct/audit, lesson analytics
(student/section/subject/low-attendance), attendance alert generation,
acknowledge/resolve/audit and listing, student-portal attendance, lesson
attendance and alerts.

Excluded: parental absence notifications (handled indirectly via the
notification outbox), biometric/RFID capture, leave-integrated attendance
decisions.

Dependencies: `academic` (sections/enrollments), `student`, `timetable`
(lesson occurrences), `notification` (alert notifications via outbox).

Principal classes:
`controller/{AttendanceController,LessonAttendanceController,AttendanceAlertController,AttendanceAlertResolutionController,StudentPortalAttendanceController}`,
`service/{AttendanceService,LessonAttendanceService,AttendanceAlertService,AttendanceAlertResolutionService,StudentPortalAttendanceService}`.

## B. API conventions

- Base paths: `/api/v1/attendance`, `/api/v1/lesson-attendance`,
  `/api/v1/attendance-alerts`, `/api/v1/student-portal`.
- Authentication: bearer; permissions in the inventory.
- Scope: institution scope (and campus where supplied) for staff endpoints;
  portal endpoints resolve the acting student from the account link.
- Enums: `AttendanceStatus` and `LessonAttendanceStatus` =
  `PRESENT | ABSENT | LATE | EXCUSED`.
- Alert `status` values: `OPEN`, `ACKNOWLEDGED`, `RESOLVED`.
- Pagination: `GET /attendance` and `GET /attendance-alerts` are paginated;
  most other reads return full lists.

## C. Endpoint inventory

| Method | Path | Purpose | Permission | Scope |
|---|---|---|---|---|
| POST | `/api/v1/attendance` | Mark daily attendance (bulk) | `ATTENDANCE_MARK` | institution |
| PUT | `/api/v1/attendance/{attendanceId}` | Correct a daily record | `ATTENDANCE_UPDATE` | institution |
| GET | `/api/v1/attendance` | Search daily attendance | `ATTENDANCE_READ` | institution |
| GET | `/api/v1/attendance/{attendanceId}/audit` | Daily record audit | `ATTENDANCE_AUDIT_READ` | institution |
| GET | `/api/v1/attendance/summary` | Daily summary | `ATTENDANCE_READ` | institution/campus |
| GET | `/api/v1/attendance/summary/trend` | Daily trend | `ATTENDANCE_READ` | institution/campus |
| POST | `/api/v1/attendance-alerts/generate` | Generate alerts | `ATTENDANCE_ALERT_GENERATE` | institution |
| GET | `/api/v1/attendance-alerts` | Search alerts | `ATTENDANCE_ALERT_READ` | institution |
| GET | `/api/v1/attendance-alerts/{alertId}/audit` | Alert audit | `ATTENDANCE_ALERT_READ` | institution |
| POST | `/api/v1/attendance-alerts/{alertId}/acknowledge` | Acknowledge alert | `ATTENDANCE_ALERT_RESOLVE` | institution |
| POST | `/api/v1/attendance-alerts/{alertId}/resolve` | Resolve alert | `ATTENDANCE_ALERT_RESOLVE` | institution |
| GET | `/api/v1/lesson-attendance/occurrences/{occurrenceId}/roster` | Lesson roster | `ATTENDANCE_LESSON_READ` | institution |
| GET | `/api/v1/lesson-attendance/occurrences/{occurrenceId}` | Lesson attendance | `ATTENDANCE_LESSON_READ` | institution |
| POST | `/api/v1/lesson-attendance/occurrences/{occurrenceId}` | Mark lesson attendance | `ATTENDANCE_LESSON_MARK` | institution |
| PUT | `/api/v1/lesson-attendance/records/{attendanceRecordId}` | Correct lesson attendance | `ATTENDANCE_LESSON_UPDATE` | institution |
| GET | `/api/v1/lesson-attendance/records/{attendanceRecordId}/audit` | Lesson record audit | `ATTENDANCE_LESSON_READ` | institution |
| GET | `/api/v1/lesson-attendance/analytics/students` | Per-student analytics | `ATTENDANCE_LESSON_READ` | institution |
| GET | `/api/v1/lesson-attendance/analytics/sections` | Per-section analytics | `ATTENDANCE_LESSON_READ` | institution |
| GET | `/api/v1/lesson-attendance/analytics/subjects` | Per-subject analytics | `ATTENDANCE_LESSON_READ` | institution |
| GET | `/api/v1/lesson-attendance/analytics/low-attendance` | Low-attendance students | `ATTENDANCE_LESSON_READ` | institution |
| GET | `/api/v1/student-portal/attendance` | My daily attendance | `STUDENT_PORTAL_READ` | self |
| GET | `/api/v1/student-portal/lesson-attendance` | My lesson attendance | `STUDENT_PORTAL_READ` | self |
| GET | `/api/v1/student-portal/lesson-attendance/summary` | My lesson summary | `STUDENT_PORTAL_READ` | self |
| GET | `/api/v1/student-portal/attendance-alerts` | My alerts | `STUDENT_PORTAL_READ` | self |

All `Implemented`.

## D. Endpoint contracts (selected)

### POST /api/v1/attendance

- Request (`MarkAttendanceRequest`): `institutionId` (required),
  `attendanceDate` (required), `records` (non-empty, <= 500 entries). Each entry:
  `studentId` (required), `status` (`PRESENT|ABSENT|LATE|EXCUSED`, required),
  `remarks` (<= 500).
- Response `200` `List<AttendanceResponse>` (one per entry).
- Errors: `400`, `403`, `404`, `409` (duplicate record for student/date),
  `422` (student not active / not in institution / invalid date).
- Side effects: audit rows (`AttendanceAudit`, action `CREATED`).

### PUT /api/v1/attendance/{attendanceId}

- Request (`UpdateAttendanceRequest`): `status` (required), `remarks` (<= 500).
- Response `200` `AttendanceResponse`. Audit action `UPDATED`.
- Errors: `400`, `403`, `404`, `409 CONCURRENT_MODIFICATION`.

### GET /api/v1/attendance

- Query: `institutionId` (uuid), `attendanceDate` (date), `studentId`
  (optional), `page`,`size`,`sort` (default `size=20`, `sort=attendanceDate,desc`).
- Response `200` `Page<AttendanceResponse>`.

### GET /api/v1/attendance/summary

- Query: `institutionId`, `attendanceDate`, `campusId` (optional).
- Response `200` (`AttendanceSummaryResponse`): `institutionId`, `campusId`,
  `attendanceDate`, `presentCount`, `absentCount`, `lateCount`, `excusedCount`,
  `totalRecorded`, `attendanceEligibleCount`, `attendancePercentage`.

### GET /api/v1/attendance/summary/trend

- Query: `institutionId`, `from`, `to`, `campusId` (optional).
- Response `200` `List<DailyAttendanceTrendResponse>`.

### POST /api/v1/attendance-alerts/generate

- Request (`GenerateAttendanceAlertsRequest`): `institutionId`, `sectionId`,
  `startDate`, `endDate`, `thresholdPercent` (0.00..100.00).
- Response `200` a bare integer (number of alerts generated).
- Side effects: creates `AttendanceAlert` rows and enqueues notifications via
  the outbox.

### GET /api/v1/attendance-alerts

- Query: `institutionId`, `startDate`, `endDate`, `status` (optional),
  `page` (default 0), `size` (default 20).
- Response `200` `Page<AttendanceAlertAdminResponse>`.

### POST /api/v1/attendance-alerts/{alertId}/acknowledge | /resolve

- No body. Response `200` `{ alertId, status, message }` with status
  `ACKNOWLEDGED` or `RESOLVED`.
- Rules: `acknowledge` requires status `OPEN`; `resolve` transitions to
  `RESOLVED`. Lifecycle `OPEN -> ACKNOWLEDGED -> RESOLVED`.
- Side effects: `AttendanceAlertAudit` rows.

### POST /api/v1/lesson-attendance/occurrences/{occurrenceId}

- Request (`MarkLessonAttendanceRequest`): `records` (non-empty, <= 200) of
  `LessonAttendanceItemRequest` (`studentId`, `status`, `remarks` <= 500).
- Response `200` `List<LessonAttendanceResponse>`.
- Response fields include `markedByUserId`, `markedAt`, `version`.
- Errors: `400`, `403`, `404`, `409`, `422`.

### PUT /api/v1/lesson-attendance/records/{attendanceRecordId}

- Request (`CorrectLessonAttendanceRequest`): `status`, `remarks`. Response
  `200` `LessonAttendanceResponse`. Audit rows recorded.

### GET /api/v1/lesson-attendance/analytics/*

- `analytics/students`: query `institutionId`, `sectionId`, `startDate`,
  `endDate` -> `List<StudentAttendanceAnalyticsResponse>`.
- `analytics/sections`: query `institutionId`, `startDate`, `endDate` ->
  `List<AttendanceGroupAnalyticsResponse>`.
- `analytics/subjects`: same query as sections -> per-subject rows.
- `analytics/low-attendance`: query `institutionId`, `sectionId`, `startDate`,
  `endDate`, `threshold` (default `75.00`) -> `List<StudentAttendanceAnalyticsResponse>`.

### Portal endpoints

- `GET /student-portal/attendance?from&to` -> `List<AttendanceResponse>` (self).
- `GET /student-portal/lesson-attendance?from&to` ->
  `List<ParentLessonAttendanceItemResponse>`.
- `GET /student-portal/lesson-attendance/summary?from&to` ->
  `ParentLessonAttendanceSummaryResponse`.
- `GET /student-portal/attendance-alerts` -> `List<AttendanceAlertResponse>`.

## E. Validation and business rules

- Records are keyed by (student, date) for daily and (occurrence, student) for
  lessons; duplicates conflict.
- Status enums are validated by Jackson (invalid value -> `400 MALFORMED_REQUEST`).
- Students must belong to the institution/section and be active.
- Alert threshold constrained to 0-100.

## F. Authorization matrix

| Permission | Read | Create/Mark | Update/Correct | Other |
|---|---|---|---|---|
| `ATTENDANCE_READ` | yes | - | - | summary/trend |
| `ATTENDANCE_MARK` | - | yes | - | - |
| `ATTENDANCE_UPDATE` | - | - | yes | - |
| `ATTENDANCE_AUDIT_READ` | yes (audit) | - | - | - |
| `ATTENDANCE_LESSON_READ` | yes | - | - | analytics/audit |
| `ATTENDANCE_LESSON_MARK` | - | yes | - | - |
| `ATTENDANCE_LESSON_UPDATE` | - | - | yes | - |
| `ATTENDANCE_ALERT_READ` | yes | - | - | - |
| `ATTENDANCE_ALERT_GENERATE` | - | yes | - | - |
| `ATTENDANCE_ALERT_RESOLVE` | - | - | acknowledge/resolve | - |
| `STUDENT_PORTAL_READ` | self | - | - | own records only |

## G. Error contract

`400`, `403`, `404`, `409 CONCURRENT_MODIFICATION`/`DUPLICATE_RESOURCE`,
`422 BUSINESS_RULE_VIOLATION`.

## H. State transitions

```
AttendanceAlert: OPEN --acknowledge--> ACKNOWLEDGED --resolve--> RESOLVED
                 OPEN ------------------resolve-----------------> RESOLVED
```

## I. Dependencies and integrations

- `timetable`: lesson occurrences drive lesson attendance and analytics.
- `notification`: alert generation enqueues outbox notifications.
- `academic`/`student`: membership and enrollment checks.

## J. Open issues and implementation gaps

- `attendance/dto/Solution.java` is a stray coding-challenge class (a trie
  "displayContacts" helper) committed into the DTO package. It is unused by the
  application and should be removed from production source.
- Analytics endpoints return full lists with no pagination and no upper bound on
  the date range; a very large range can be expensive.
- Alert status is stored as a free string rather than an enum.
- Daily mark accepts up to 500 records per call; no idempotency key.
