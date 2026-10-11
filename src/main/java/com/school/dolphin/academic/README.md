# Academic Structure, Subjects & Teaching Assignments

Status: **Implemented**

[Shared conventions](../../../../../../../docs/api/README.md) apply.

## A. Module overview

Owns the academic calendar structure and student enrollment, plus subjects and
teacher-subject assignments.

Included in V1: academic years (create/activate/close/list), classes, sections,
student enrollment (enroll/complete/withdraw/transfer/roster/history), subjects,
teacher-subject assignments (assign/end/list).

Excluded: exam schedules, grade configuration (see `assessment`), timetable
periods (see `timetable`), section capacity auto-promotion.

Dependencies: `organization`, `student`, `staff` (for teacher assignments).

Principal classes: `controller/{AcademicStructureController,TeacherSubjectController}`,
`service/{AcademicStructureService,TeacherSubjectService}`,
`entity/{AcademicYear,SchoolClass,ClassSection,StudentEnrollment,AcademicSubject,TeacherSubjectAssignment}`.

## B. API conventions

- Base paths: `/api/v1/academic` (structure) and `/api/v1` (subjects and
  teacher-subject assignments).
- Authentication: bearer; permissions in the inventory.
- Scope: **institution scope** enforced on every endpoint.
- **Create/lifecycle endpoints return a bare UUID** (the created/affected id),
  not a response object. Read endpoints return response records.
- Pagination: `GET /academic/sections/{sectionId}/students` is paginated with a
  hard page-size cap of 100 (violation -> `422`); other reads return full lists.

## C. Endpoint inventory

| Method | Path | Purpose | Permission | Scope |
|---|---|---|---|---|
| POST | `/api/v1/academic/years` | Create academic year | `ACADEMIC_YEAR_CREATE` | institution |
| PATCH | `/api/v1/academic/years/{academicYearId}/activate` | Activate year | `ACADEMIC_YEAR_ACTIVATE` | institution |
| PATCH | `/api/v1/academic/years/{academicYearId}/close` | Close year | `ACADEMIC_YEAR_CLOSE` | institution |
| GET | `/api/v1/academic/years` | List years | `ACADEMIC_YEAR_READ` | institution |
| POST | `/api/v1/academic/classes` | Create class | `CLASS_CREATE` | institution |
| GET | `/api/v1/academic/years/{academicYearId}/classes` | List classes | `CLASS_READ` | institution |
| POST | `/api/v1/academic/sections` | Create section | `SECTION_CREATE` | institution |
| GET | `/api/v1/academic/classes/{schoolClassId}/sections` | List sections | `SECTION_READ` | institution |
| POST | `/api/v1/academic/enrollments` | Enroll student | `STUDENT_ENROLL` | institution |
| GET | `/api/v1/academic/sections/{sectionId}/students` | Section roster | `ENROLLMENT_READ` | institution |
| GET | `/api/v1/academic/students/{studentId}/enrollments` | Enrollment history | `ENROLLMENT_READ` | institution |
| PATCH | `/api/v1/academic/enrollments/{enrollmentId}/complete` | Complete enrollment | `ENROLLMENT_COMPLETE` | institution |
| PATCH | `/api/v1/academic/enrollments/{enrollmentId}/withdraw` | Withdraw enrollment | `ENROLLMENT_WITHDRAW` | institution |
| POST | `/api/v1/academic/enrollments/{enrollmentId}/transfer` | Transfer student | `STUDENT_TRANSFER` | institution |
| POST | `/api/v1/subjects` | Create subject | `SUBJECT_CREATE` | institution |
| GET | `/api/v1/subjects` | List subjects | `SUBJECT_READ` | institution |
| POST | `/api/v1/teacher-subject-assignments` | Assign teacher to subject | `TEACHER_SUBJECT_ASSIGN` | institution |
| GET | `/api/v1/teacher-subject-assignments` | List assignments | `TEACHER_SUBJECT_READ` | institution |
| PATCH | `/api/v1/teacher-subject-assignments/{assignmentId}/end` | End assignment | `TEACHER_SUBJECT_ASSIGN` | institution |

All the above are `Implemented`.

## D. Endpoint contracts (selected)

### POST /api/v1/academic/years

Request (`CreateAcademicYearRequest`): `institutionId` (UUID, required),
`name` (required, <= 50), `startDate`, `endDate` (required).
Response `201` body: a JSON string UUID.

```json
"7c2f9a10-1f4b-4a2e-9f0d-0f9a2b7c1e01"
```

Errors: `400`; `403`; `404`; `409 DUPLICATE_RESOURCE` (name already used in the
institution, case-insensitive); `422` (`endDate` not after `startDate`, inactive
institution). New years start `PLANNED`.

### PATCH /api/v1/academic/years/{academicYearId}/activate

No body. Response `200` UUID. Errors `403`, `404`, `422` (year not `PLANNED`;
institution already has an `ACTIVE` year). Transition `PLANNED -> ACTIVE`.

### PATCH /api/v1/academic/years/{academicYearId}/close

No body. Response `200` UUID. Errors `403`, `404`, `422` (year not `ACTIVE`; an
active enrollment still exists). Transition `ACTIVE -> CLOSED`.

### POST /api/v1/academic/classes

Request (`CreateSchoolClassRequest`): `academicYearId` (required), `name`
(required, <= 80), `code` (required, <= 30, stored upper-case), `sortOrder`
(>= 0). Response `201` UUID. Errors: `403`, `404`, `422` (year `CLOSED`).

### POST /api/v1/academic/sections

Request (`CreateClassSectionRequest`): `schoolClassId` (required), `campusId`
(optional), `name` (required, <= 50), `capacity` (positive, optional). Response
`201` UUID. Errors: `403`, `404`, `422` (class inactive / year closed / campus not
in institution).

### POST /api/v1/academic/enrollments

Request (`EnrollStudentRequest`): `studentId` (required), `sectionId`
(required), `startDate` (required). Response `201` UUID.
Errors: `403`, `404`, `409 DUPLICATE_RESOURCE` (student already has an active
enrollment), `422` (section/class inactive, year not `ACTIVE`, student and
section in different institutions, `startDate` outside the year).

### GET /api/v1/academic/sections/{sectionId}/students

Query: `page`,`size`,`sort` (default `size=20`, `sort=startDate`). `size > 100`
-> `422 BUSINESS_RULE_VIOLATION`. Response `200` `Page<StudentEnrollmentResponse>`
(active enrollments in the section).

### GET /api/v1/academic/students/{studentId}/enrollments

Response `200` `List<StudentEnrollmentResponse>` (full history).

### PATCH /api/v1/academic/enrollments/{enrollmentId}/complete | /withdraw

Both take `EnrollmentEndRequest` (`endDate` required) and return `200` UUID.
Errors: `403`, `404`, `422` (enrollment not `ACTIVE`; `endDate` before
`startDate`). Transitions `ACTIVE -> COMPLETED` / `ACTIVE -> WITHDRAWN`.

### POST /api/v1/academic/enrollments/{enrollmentId}/transfer

Request (`TransferStudentRequest`): `targetSectionId` (required),
`effectiveDate` (required). Response `200` UUID (the new enrollment id).
Rules: target section/class/year active; same institution; date within both
years and not before current start; different section; capacity not exceeded.
Side effect: current enrollment set to `COMPLETED` with `endDate = effectiveDate`
and a new `ACTIVE` enrollment created in the target section.

### POST /api/v1/subjects, GET /api/v1/subjects

`CreateAcademicSubjectRequest`: `institutionId`, `code` (<= 30), `name`
(<= 120), `description` (<= 500, optional) -> `201 AcademicSubjectResponse`.
`GET` with `?institutionId=` returns `List<AcademicSubjectResponse>`.

### POST /api/v1/teacher-subject-assignments

`AssignTeacherSubjectRequest`: `staffAssignmentId` (required), `subjectId`
(required), `startDate` (required), `endDate` (optional) ->
`201 TeacherSubjectAssignmentResponse`.

### PATCH /api/v1/teacher-subject-assignments/{assignmentId}/end

Query `endDate` (ISO date, required) -> `200 TeacherSubjectAssignmentResponse`
with `active=false`.

## E. Validation and business rules

- Academic year name unique per institution (case-insensitive); `endDate` after
  `startDate`; at most one `ACTIVE` year per institution.
- Enrollment start date must fall within the academic year.
- A student has at most one `ACTIVE` enrollment.
- Section capacity, when set, is enforced on enroll and transfer.
- Class code stored upper-case.
- `@Version` optimistic locking on enrollments.

## F. Authorization matrix

| Permission | Read | Create | Lifecycle | Notes |
|---|---|---|---|---|
| `ACADEMIC_YEAR_*` | yes | yes | activate/close | institution scope |
| `CLASS_*`, `SECTION_*` | yes | yes | - | institution scope |
| `STUDENT_ENROLL`, `ENROLLMENT_READ`, `ENROLLMENT_COMPLETE`, `ENROLLMENT_WITHDRAW`, `STUDENT_TRANSFER` | yes | enroll | complete/withdraw/transfer | institution scope |
| `SUBJECT_*`, `TEACHER_SUBJECT_*` | yes | yes | end | institution scope |

## G. Error contract

`400`, `403`, `404`, `409 DUPLICATE_RESOURCE`, `409 CONCURRENT_MODIFICATION`,
`422 BUSINESS_RULE_VIOLATION`.

## H. State transitions

```
AcademicYear:  PLANNED --activate--> ACTIVE --close--> CLOSED
Enrollment:    ACTIVE --complete--> COMPLETED
               ACTIVE --withdraw--> WITHDRAWN
               ACTIVE --transfer--> COMPLETED (new ACTIVE enrollment created)
```

## I. Dependencies and integrations

Consumed by `attendance`, `assessment`, `timetable`, `homework`,
`notification` and the portals, which key off section/enrollment ids.

## J. Open issues and implementation gaps

- No update/deactivate for years, classes or sections.
- Class `code` uniqueness is not enforced explicitly in the service; a duplicate
  may surface as `409 CONSTRAINT_VIOLATION` if the DB constraint exists.
- Teacher-subject assignment overlap (a teacher double-booked for the same
  subject/period) is not validated here.
- Roster rejects `size > 100` with `422` rather than clamping.
