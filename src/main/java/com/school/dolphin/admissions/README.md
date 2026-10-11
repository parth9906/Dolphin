# Admissions

Status: **Implemented**

[Shared conventions](../../../../../../../docs/api/README.md) apply.

## A. Module overview

Owns admission applications, their review workflow, aggregate summary and the
enrollment action that turns an accepted application into a student.

Included in V1: create application, search, summary, read-by-id, update details,
update status, enroll (creates a student).

Excluded: online public application form, document upload, fee payment,
waitlist auto-promotion.

Dependencies: `organization`, `academic` (class/section), `student`.

Principal classes: `controller/AdmissionApplicationController`,
`service/AdmissionApplicationService`,
`entity/{AdmissionApplication,AdmissionApplicationStatus}`.

## B. API conventions

- Base path: `/api/v1/admissions/applications`.
- Authentication: bearer; permissions in the inventory.
- Scope: institution/campus scope.
- Pagination: search returns `Page<AdmissionApplicationResponse>` (default
  `size=20`, `sort=applicationDate`).
- Dates: `LocalDate`.
- `AdmissionApplicationStatus` = `APPLIED | UNDER_REVIEW | ACCEPTED | REJECTED |
  WAITLISTED | ENROLLED`.

## C. Endpoint inventory

| Method | Path | Purpose | Permission | Scope |
|---|---|---|---|---|
| POST | `/api/v1/admissions/applications` | Create application | `ADMISSION_APPLICATION_CREATE` | institution/campus |
| GET | `/api/v1/admissions/applications` | Search | `ADMISSION_APPLICATION_READ` | institution/campus |
| GET | `/api/v1/admissions/applications/summary` | Aggregate counts | `ADMISSION_APPLICATION_READ` | institution/campus |
| GET | `/api/v1/admissions/applications/{applicationId}` | Read | `ADMISSION_APPLICATION_READ` | institution/campus |
| PATCH | `/api/v1/admissions/applications/{applicationId}/status` | Change status | `ADMISSION_APPLICATION_UPDATE` | institution/campus |
| PUT | `/api/v1/admissions/applications/{applicationId}` | Update details | `ADMISSION_APPLICATION_UPDATE` | institution/campus |
| POST | `/api/v1/admissions/applications/{applicationId}/enroll` | Enroll -> student | `ADMISSION_APPLICATION_ENROLL` | institution/campus |

All `Implemented`.

## D. Endpoint contracts

### POST /api/v1/admissions/applications

`CreateAdmissionApplicationRequest`: `institutionId` (required), `campusId`
(optional), `applyingClassId` (required), `applicantFirstName` (required,
<= 100), `applicantLastName` (required, <= 100), `applicantDateOfBirth`
(required, past), `parentName` (<= 200), `parentPhone` (<= 30), `parentEmail`
(email, <= 200), `notes` (<= 2000), `applicationDate` (optional, defaults to
today). Response `201` `AdmissionApplicationResponse` with status `APPLIED`.

### GET /api/v1/admissions/applications

Query: `institutionId` (required), `campusId` (optional), `status` (optional),
`fromDate`/`toDate` (optional), `page`,`size`,`sort`.
Response `200` `Page<AdmissionApplicationResponse>`.

### GET /api/v1/admissions/applications/summary

Query: `institutionId` (required), `campusId` (optional), `fromDate`/`toDate`
(optional). Response `200` `AdmissionApplicationSummaryResponse`:
`{ appliedCount, underReviewCount, acceptedCount, rejectedCount,
waitlistedCount, enrolledCount }`.

### GET /api/v1/admissions/applications/{applicationId}

Response `200` `AdmissionApplicationResponse`.

### PATCH /api/v1/admissions/applications/{applicationId}/status

`UpdateAdmissionApplicationStatusRequest`: `status` (required). Response `200`.
State machine (rejected transitions -> `422`):

```
APPLIED       -> UNDER_REVIEW | ACCEPTED | REJECTED | WAITLISTED
UNDER_REVIEW  -> ACCEPTED | REJECTED | WAITLISTED
WAITLISTED    -> ACCEPTED | REJECTED
ACCEPTED      -> (terminal)
REJECTED      -> (terminal)
ENROLLED      -> (terminal)
```

### PUT /api/v1/admissions/applications/{applicationId}

`UpdateAdmissionApplicationRequest`: `campusId` (optional), `applyingClassId`
(required), `parentName`, `parentPhone`, `parentEmail`, `notes`. Response `200`.
Editable only while status is `APPLIED` or `UNDER_REVIEW` (else `422`).

### POST /api/v1/admissions/applications/{applicationId}/enroll

`EnrollAdmissionApplicationRequest`: `sectionId` (required), `admissionNumber`
(required, <= 50), `startDate` (required). Response `200`
`AdmissionApplicationResponse` (status `ENROLLED`, `enrolledStudentId` set).
Rules: application must be `ACCEPTED`; creates a student; admission number
unique per institution (`409` on duplicate). Errors `403`, `404`,
`409 DUPLICATE_RESOURCE`, `422`.

## E. Validation and business rules

- `applicantDateOfBirth` must be in the past.
- Status transitions restricted by the state machine above.
- Editing allowed only for `APPLIED`/`UNDER_REVIEW`.
- Enroll requires `ACCEPTED` and produces a `Student` plus `ENROLLED` status.
- `@Version` optimistic locking on applications.

## F. Authorization matrix

| Permission | Read | Create | Update | Enroll |
|---|---|---|---|---|
| `ADMISSION_APPLICATION_READ` | yes | - | - | - |
| `ADMISSION_APPLICATION_CREATE` | - | yes | - | - |
| `ADMISSION_APPLICATION_UPDATE` | - | - | yes | - |
| `ADMISSION_APPLICATION_ENROLL` | - | - | - | yes |

## G. Error contract

`400`, `403`, `404`, `409 DUPLICATE_RESOURCE`, `409 CONCURRENT_MODIFICATION`,
`422 BUSINESS_RULE_VIOLATION`.

## H. State transitions

```
APPLIED --> UNDER_REVIEW --> ACCEPTED --> ENROLLED
   |            |  \--> REJECTED
   |            \--> WAITLISTED --> ACCEPTED/REJECTED
   \--> ACCEPTED/REJECTED/WAITLISTED
```

## I. Dependencies and integrations

- `academic`: `applyingClassId` and enrollment `sectionId`.
- `student`: created on enroll.

## J. Open issues and implementation gaps

- No public application endpoint (staff-only creation in V1).
- No document upload or payment.
- No waitlist auto-promotion or capacity gating on enroll.
- Summary counts are computed for a date range but not paginated.
