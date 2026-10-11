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

A dedicated analytics module (further aggregated dashboards across modules) is
**not yet implemented**. Everything else in section D is a proposal.

## D. Implemented endpoint

### GET /api/v1/analytics/institution-summary

- Query: `institutionId` (required), `fromDate` (required), `toDate` (required,
  range <= 366 days). Auth: bearer. Permission: `ANALYTICS_READ`.
- Scope: institution scope enforced; `403` outside the caller's scope.
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

## B. Proposal: conventions

- Base path (proposed): `/api/v1/analytics`.
- Authentication: bearer.
- Permissions (proposed): `ANALYTICS_READ` (aggregate/read) and possibly
  `ANALYTICS_EXPORT`.
- Scope: institution/campus scope; a caller must not see another institution's
  aggregates.
- Pagination: aggregate endpoints should be bounded by an explicit date range and
  capped, or paginated, to avoid unbounded scans.
- Timestamps: aggregates should echo the requested range in ISO-8601.

## C. Proposal: endpoint inventory

| Method | Path (proposed) | Purpose | Permission (proposed) |
|---|---|---|---|
| GET | `/api/v1/analytics/attendance` | Institution attendance dashboard | `ANALYTICS_READ` |
| GET | `/api/v1/analytics/enrollment` | Enrollment counts by class/section | `ANALYTICS_READ` |
| GET | `/api/v1/analytics/assessment` | Grade distribution by subject | `ANALYTICS_READ` |
| GET | `/api/v1/analytics/hostel` | Occupancy by hostel/room type | `ANALYTICS_READ` |
| GET | `/api/v1/analytics/inventory` | Stock levels / low-stock count | `ANALYTICS_READ` |
| GET | `/api/v1/analytics/mess` | Meal headcount / consumption trends | `ANALYTICS_READ` |

All are **proposed**; none exist today.

## D. Proposed behaviour (all unapproved)

Each proposed endpoint would accept `institutionId` (required), optional
`campusId`, and a `fromDate`/`toDate` range, and return aggregate counts/series
with an `institutionId`/`campusId`/range echo. Authorization would reuse the
existing institution/campus scope check.

## E. Existing (implemented) analytics you can use today

Because the proposed module does not exist, use the module-owned endpoints above.
They are the source of truth for current analytics behaviour and are documented
in their own READMEs.

## F. Validation and business rules

No rules exist yet for the proposed module. The existing module-owned analytics
enforce institution scope and (for lesson analytics) require `institutionId`,
`sectionId` and a date range.

## G. Authorization matrix (proposed)

| Permission | Read |
|---|---|
| `ANALYTICS_READ` | aggregate dashboards |
| `ANALYTICS_EXPORT` (proposed) | export (not implemented) |

## H. Error contract (proposed)

Standard codes; `403` for out-of-scope institutions, `422` for invalid ranges.

## I. State transitions

Not applicable (read-only).

## J. Dependencies and integrations (proposed)

Would read from `attendance`, `assessment`, `academic`, `hostel`, `inventory`,
`mess`, `admissions`.

## K. Open issues and implementation gaps

- The dedicated analytics package is empty; there is no cross-module dashboard.
- Analytics today is fragmented across module-owned endpoints.
- An `ANALYTICS_READ`/`ANALYTICS_EXPORT` permission does not exist in the
  database yet; adding analytics requires a migration to define and grant it.
- Open question (product decision): should analytics be a separate module, or
  should each owning module expose its own aggregates? The current code favours
  the latter.
