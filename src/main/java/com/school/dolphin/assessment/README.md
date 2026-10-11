# Assessment & Marks

Status: **Implemented**

[Shared conventions](../../../../../../../docs/api/README.md) apply.

## A. Module overview

Owns assessments, per-student marks, mark-change audit, grade calculation and
report cards (staff-scoped and student self-scoped).

Included in V1: create assessment, search assessments, record marks (bulk),
read results, correct a mark (with `version`), mark audit, staff report card,
student-portal report card.

Excluded: exam scheduling (see `timetable`), transcripts/certificates (see
`document`), grade-scale configuration.

Dependencies: `academic` (sections), `student`, `identity`.

Principal classes:
`controller/{AssessmentController,StudentReportCardController,StudentPortalReportCardController}`,
`service/{AssessmentService,StudentReportCardService,GradeCalculator}`.

## B. API conventions

- Base paths: `/api/v1/assessments`, `/api/v1/students`,
  `/api/v1/student-portal`.
- Authentication: bearer; `ASSESSMENT_CREATE`, `MARKS_READ`, `MARKS_RECORD`,
  `MARKS_UPDATE`, `MARKS_AUDIT_READ`, `STUDENT_PORTAL_READ`.
- Scope: institution scope for staff endpoints; the portal report card resolves
  the student from the account link.
- Marks use `BigDecimal`. `date` fields use `LocalDate`.

## C. Endpoint inventory

| Method | Path | Purpose | Permission | Scope |
|---|---|---|---|---|
| POST | `/api/v1/assessments` | Create assessment | `ASSESSMENT_CREATE` | institution |
| GET | `/api/v1/assessments` | Search assessments | `MARKS_READ` | institution |
| POST | `/api/v1/assessments/{assessmentId}/marks` | Record marks (bulk) | `MARKS_RECORD` | institution |
| GET | `/api/v1/assessments/{assessmentId}/results` | Assessment results | `MARKS_READ` | institution |
| PUT | `/api/v1/assessments/marks/{markId}` | Correct a mark | `MARKS_UPDATE` | institution |
| GET | `/api/v1/assessments/marks/{markId}/audit` | Mark audit trail | `MARKS_AUDIT_READ` | institution |
| GET | `/api/v1/students/{studentId}/report-card` | Staff report card | `MARKS_READ` | institution |
| GET | `/api/v1/student-portal/report-card` | Self report card | `STUDENT_PORTAL_READ` | self |

All `Implemented`.

## D. Endpoint contracts

### POST /api/v1/assessments

Request (`CreateAssessmentRequest`): `institutionId` (required), `sectionId`
(optional), `name` (required, <= 150), `subjectName` (required, <= 100),
`assessmentDate` (required), `maxMarks` (required, >= 0.01).
Response `201` `AssessmentResponse` (`{ id, institutionId, sectionId, name,
subjectName, assessmentDate, maxMarks, active }`).
Errors: `400`, `403`, `404`, `422`.

### GET /api/v1/assessments

Query: `institutionId` (required), `sectionId` (optional), `fromDate`/`toDate`
(optional, ISO date), `page`,`size`,`sort` (default `size=20`,
`sort=assessmentDate,desc`).
Response `200` `Page<AssessmentResponse>`.

### POST /api/v1/assessments/{assessmentId}/marks

Request (`RecordMarksRequest`): `records` (non-empty, <= 500) of `MarkEntry`
(`studentId` required, `marksObtained` >= 0.00, `remarks` <= 500).
Response `200` `List<StudentMarkResponse>`.
Errors: `400`, `403`, `404`, `409` (duplicate mark), `422`
(`marksObtained > maxMarks`, student not in institution).

### GET /api/v1/assessments/{assessmentId}/results

Response `200` `List<StudentMarkResponse>` (`markId`, `assessmentId`,
`studentId`, admission/name fields, `marksObtained`, `maxMarks`, `remarks`,
`version`).

### PUT /api/v1/assessments/marks/{markId}

Request (`UpdateStudentMarkRequest`): `version` (required - optimistic lock),
`marksObtained` (required, >= 0.00), `remarks` (<= 500).
Response `200` `StudentMarkResponse`.
Errors: `400`, `403`, `404`, `409 CONCURRENT_MODIFICATION` (stale `version`),
`422` (marks above max).

### GET /api/v1/assessments/marks/{markId}/audit

Response `200` `List<StudentMarkAuditResponse>` (`id`, `studentMarkId`,
`previousMarks`, `newMarks`, `previousRemarks`, `newRemarks`, `changedByUserId`,
`changedAt`).

### GET /api/v1/students/{studentId}/report-card

Query: `fromDate` (required), `toDate` (required).
Response `200` (`StudentReportCardResponse`): student identity, `institutionId`,
date range, `assessmentCount`, `totalMarksObtained`, `totalMaximumMarks`,
`overallPercentage`, `overallGrade`, `subjects`
(`List<SubjectResultResponse>`), `assessments` (`List<AssessmentResultItem>`).
Errors: `400`, `403`, `404`.

### GET /api/v1/student-portal/report-card

Query: `fromDate`, `toDate` (required). Resolves the student from the account.
Response `200` `StudentReportCardResponse`. Errors `403` (no link / inactive).

## E. Validation and business rules

- `maxMarks >= 0.01`; `marksObtained >= 0`; marks cannot exceed the assessment
  max (service rule -> `422`).
- Duplicate mark for a student/assessment conflicts.
- Mark corrections are optimistic-locked by `version` (`409` on stale version)
  and audited.
- Grades computed by `GradeCalculator` (percentage -> grade band).

## F. Authorization matrix

| Permission | Read | Create | Record | Update | Audit |
|---|---|---|---|---|---|
| `MARKS_READ` | yes | - | - | - | - |
| `ASSESSMENT_CREATE` | - | yes | - | - | - |
| `MARKS_RECORD` | - | - | yes | - | - |
| `MARKS_UPDATE` | - | - | - | yes | - |
| `MARKS_AUDIT_READ` | - | - | - | - | yes |
| `STUDENT_PORTAL_READ` | self | - | - | - | - |

## G. Error contract

`400`, `403`, `404`, `409 DUPLICATE_RESOURCE`/`CONCURRENT_MODIFICATION`,
`422 BUSINESS_RULE_VIOLATION`.

## H. State transitions

Marks are created then corrected; each correction appends an audit row. No
delete. Assessments have an `active` flag with no lifecycle endpoint.

## I. Dependencies and integrations

- `academic`: sections referenced by assessments.
- `student`: mark ownership and report-card identity.
- `document` (proposed): future transcript generation.

## J. Open issues and implementation gaps

- No update/deactivate endpoint for assessments.
- No pagination on results/marks/audit (bounded in practice by assessment size).
- Grade bands live in `GradeCalculator`; not configurable via API.
- Marks for a student not currently enrolled in the section are not cross-checked
  against enrollment.
