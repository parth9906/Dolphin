# Analytics

Status: **Partially Implemented**. A dedicated `analytics` package now ships an
institution summary endpoint; aggregated cross-module dashboards beyond it
remain proposed.

[Shared conventions](../../../../../../../docs/api/README.md) apply.

## A. Module overview

The `analytics` package owns `GET /api/v1/analytics/institution-summary`
(`ANALYTICS_READ`, institution scope). Cross-cutting analytics also exist inside
the modules that own the data:

- Attendance analytics (lesson student/section/subject/low-attendance) live in
  `attendance` (`/api/v1/lesson-attendance/analytics/*`) - see
  [attendance/README.md](../attendance/README.md).
- Attendance summary and trend live in `attendance`
  (`/api/v1/attendance/summary`, `/summary/trend`).
- Admissions summary lives in `admissions`
  (`/api/v1/admissions/applications/summary`).
- Notification outbox summary lives in `notification`
  (`/api/v1/notification-outbox/summary`).

Only the institution summary endpoint ships in the dedicated `analytics`
package today. Further aggregated cross-module dashboards are **not yet
implemented**; the sections marked **proposed** below describe intended,
unapproved behaviour.

## B. Implemented endpoint

### GET /api/v1/analytics/institution-summary

- Query: `institutionId` (required), `fromDate` (required), `toDate` (required,
  range <= 366 days). Auth: bearer. Permission: `ANALYTICS_READ`.
- Scope: institution scope enforced; `403` outside the caller's scope.
- Errors: `400` for missing/invalid query parameters, `404` for an unknown
  institution, `422 BUSINESS_RULE_VIOLATION` when the range is missing, reversed
  or longer than 366 days.
- Response `200` `AnalyticsInstitutionSummaryResponse`:
  `{ institutionId, fromDate, toDate, activeStudents, activeStaff,
  activeEnrollments, attendancePresent, attendanceAbsent, attendanceLate,
  attendanceExcused, attendanceEligible, attendancePercentage }`.
- Semantics: `activeStudents` counts active student profiles; `activeStaff`
  counts distinct staff members with an active assignment; `activeEnrollments`
  counts active `student_enrollment` rows for the institution;
  attendance figures count daily attendance records in the range and match the
  `attendance` module formula (eligible = present + absent + late; percentage =
  (present + late) / eligible, rounded half-up, `0.00` when no records).

## C. Proposal: conventions

- Base path (proposed): `/api/v1/analytics`.
- Authentication: bearer.
- Permissions (proposed): `ANALYTICS_READ` (aggregate/read) and possibly
  `ANALYTICS_EXPORT`.
- Scope: institution/campus scope; a caller must not see another institution's
  aggregates.
- Pagination: aggregate endpoints should be bounded by an explicit date range and
  capped, or paginated, to avoid unbounded scans.
- Timestamps: aggregates should echo the requested range in ISO-8601.

## D. Proposal: endpoint inventory

| Method | Path (proposed) | Purpose | Permission (proposed) |
|---|---|---|---|
| GET | `/api/v1/analytics/attendance` | Institution attendance dashboard | `ANALYTICS_READ` |
| GET | `/api/v1/analytics/enrollment` | Enrollment counts by class/section | `ANALYTICS_READ` |
| GET | `/api/v1/analytics/assessment` | Grade distribution by subject | `ANALYTICS_READ` |
| GET | `/api/v1/analytics/hostel` | Occupancy by hostel/room type | `ANALYTICS_READ` |
| GET | `/api/v1/analytics/inventory` | Stock levels / low-stock count | `ANALYTICS_READ` |
| GET | `/api/v1/analytics/mess` | Meal headcount / consumption trends | `ANALYTICS_READ` |

All are **proposed**; none exist today.

## E. Proposed behaviour (all unapproved)

Each proposed endpoint would accept `institutionId` (required), optional
`campusId`, and a `fromDate`/`toDate` range, and return aggregate counts/series
with an `institutionId`/`campusId`/range echo. Authorization would reuse the
existing institution/campus scope check.

## F. Existing (implemented) analytics you can use today

Beyond `institution-summary`, current analytics live inside the modules that own
the data (the endpoints listed in section A). Those module-owned endpoints are
the source of truth for their behaviour and are documented in their own READMEs.

## G. Validation and business rules

The implemented `institution-summary` endpoint enforces institution scope and a
maximum date range of 366 days. Module-owned analytics enforce their own rules
and (for lesson analytics) require `institutionId`, `sectionId` and a date range.

## H. Authorization matrix

| Permission | Read |
|---|---|
| `ANALYTICS_READ` | aggregate dashboards |
| `ANALYTICS_EXPORT` (proposed) | export (not implemented) |

## I. Error contract

Standard codes; `403` for out-of-scope institutions, `422` for invalid ranges.

## J. State transitions

Not applicable (read-only).

## K. Dependencies and integrations

The implemented endpoint reads `student`, `staff`, `academic`
(`student_enrollment`) and `attendance`, and uses `organization` for scope and
`identity` for the `ANALYTICS_READ` permission. A broader analytics module would
additionally read `assessment`, `hostel`, `inventory`, `mess` and `admissions`
(proposed).

## L. Open issues and implementation gaps

- The dedicated `analytics` package ships only
  `GET /api/v1/analytics/institution-summary`; there is no other cross-module
  dashboard.
- Analytics beyond that endpoint is fragmented across module-owned endpoints.
- `ANALYTICS_READ` exists (migration `V79`) and is granted to `PLATFORM_ADMIN`;
  `ANALYTICS_EXPORT` is not defined.
- Open question (product decision): should analytics be a separate module, or
  should each owning module expose its own aggregates? The current code favours
  the latter.
