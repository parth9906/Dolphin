# Homework & Assignments

Status: **Implemented**

[Shared conventions](../../../../../../../docs/api/README.md) apply.

## A. Module overview

Owns assignments (homework) and student submissions with grading, for staff and
for the student portal.

Included in V1: create assignment (draft), read, search, update draft, publish,
list submissions, grade a submission; student list/submit/view-own.

Excluded: attachments/file upload, plagiarism checks, rubrics, bulk grading.

Dependencies: `academic` (sections), `student`, `staff`, `identity` (teacher
authorization via `TeacherSectionAuthorization`).

Principal classes: `controller/{AssignmentController,StudentAssignmentController}`,
`service/{AssignmentService,StudentAssignmentService}`,
`entity/{Assignment,AssignmentSubmission,AssignmentStatus,AssignmentSubmissionStatus}`.

## B. API conventions

- Base paths: `/api/v1/assignments`, `/api/v1/student-portal/assignments`.
- Authentication: bearer; permissions in the inventory.
- Scope: institution scope + teacher authorization for the target section.
- Optimistic locking: `Assignment` and `AssignmentSubmission` carry `version`;
  update/publish/submit/grade require the current `version`.
- Timestamps: `OffsetDateTime` (UTC-offset ISO-8601).

## C. Endpoint inventory

| Method | Path | Purpose | Permission | Scope |
|---|---|---|---|---|
| POST | `/api/v1/assignments` | Create assignment (draft) | `ASSIGNMENT_CREATE` | institution + section |
| GET | `/api/v1/assignments/{assignmentId}` | Read assignment | `ASSIGNMENT_READ` | institution |
| GET | `/api/v1/assignments` | Search assignments | `ASSIGNMENT_READ` | institution |
| PATCH | `/api/v1/assignments/{assignmentId}` | Update draft | `ASSIGNMENT_UPDATE` | institution |
| POST | `/api/v1/assignments/{assignmentId}/publish` | Publish | `ASSIGNMENT_PUBLISH` | institution |
| GET | `/api/v1/assignments/{assignmentId}/submissions` | List submissions | `ASSIGNMENT_SUBMISSION_READ` | institution |
| PUT | `/api/v1/assignments/{assignmentId}/submissions/{submissionId}/grade` | Grade submission | `ASSIGNMENT_SUBMISSION_GRADE` | institution |
| GET | `/api/v1/student-portal/assignments` | My assignments | `STUDENT_PORTAL_READ` | self |
| POST | `/api/v1/student-portal/assignments/{assignmentId}/submissions` | Submit | `ASSIGNMENT_SUBMISSION_CREATE` | self |
| GET | `/api/v1/student-portal/assignments/{assignmentId}/submissions/me` | My submission | `STUDENT_PORTAL_READ` | self |

All `Implemented`.

## D. Endpoint contracts

### POST /api/v1/assignments

`CreateAssignmentRequest`: `institutionId`, `sectionId` (required), `title`
(required, <= 200), `instructions` (required, <= 10000), `dueAt`
(`OffsetDateTime`, required), `maxMarks` (required, >= 0.01).
Response `201` `AssignmentResponse` (status `DRAFT`).
Errors: `400`, `403`, `404`, `422`.

### GET /api/v1/assignments

Query: `institutionId` (required), `sectionId` (optional), `status`
(optional: `DRAFT|PUBLISHED`), `page`,`size`,`sort` (default `size=20`,
`sort=createdAt,desc`). Response `200` `Page<AssignmentResponse>`.

### GET /api/v1/assignments/{assignmentId}

Response `200` `AssignmentResponse` (includes `version`).

### PATCH /api/v1/assignments/{assignmentId}

`UpdateAssignmentRequest`: `version` (required), and any of `title`,
`instructions`, `dueAt`, `maxMarks`. Response `200`. Only `DRAFT` assignments
can be updated. Errors: `409 CONCURRENT_MODIFICATION`, `422` (not draft).

### POST /api/v1/assignments/{assignmentId}/publish

`PublishAssignmentRequest`: `version` (required). Response `200`
`AssignmentResponse` (status `PUBLISHED`, `publishedAt` set).
Transition `DRAFT -> PUBLISHED`.

### GET /api/v1/assignments/{assignmentId}/submissions

Query: `page`,`size`,`sort` (default `size=20`, `sort=submittedAt,asc`).
Response `200` `Page<AssignmentSubmissionResponse>`.

### PUT /api/v1/assignments/{assignmentId}/submissions/{submissionId}/grade

`GradeAssignmentSubmissionRequest`: `marksObtained` (>= 0, up to 6.2 digits),
`feedback` (<= 2000), `version` (required). Response `200`
`AssignmentSubmissionResponse` (status `GRADED`, `gradedByStaffId`, `gradedAt`).
Errors: `409` (stale version), `422` (marks above `maxMarks`).

### GET /api/v1/student-portal/assignments

Query: `page`,`size`,`sort`. Returns published assignments for the student's
active sections -> `Page<AssignmentResponse>`.

### POST /api/v1/student-portal/assignments/{assignmentId}/submissions

`SubmitAssignmentRequest`: `submissionText` (required, <= 50000), `version`
(optional; used when updating an existing submission). Response `201`/`200`
`AssignmentSubmissionResponse`. Status is `SUBMITTED`, or `LATE` when past
`dueAt`. Rules: assignment must be published; the student must be enrolled in
its section.

### GET /api/v1/student-portal/assignments/{assignmentId}/submissions/me

Response `200` `AssignmentSubmissionResponse` (own submission). `404` if none.

## E. Validation and business rules

- `maxMarks >= 0.01`; grading is bounded by `maxMarks` and `@Digits(6,2)`.
- Only `DRAFT` assignments are editable; publish is one-way.
- Submissions before `dueAt` are `SUBMITTED`, after are `LATE`; grading sets
  `GRADED`.
- All state-changing calls are optimistic-locked by `version` -> `409` on stale.
- Teacher authorization (`TeacherSectionAuthorization`) restricts which sections
  a teacher may create/manage assignments for.

## F. Authorization matrix

| Permission | Read | Create | Update | Publish | Grade | Submit |
|---|---|---|---|---|---|---|
| `ASSIGNMENT_READ` | yes | - | - | - | - | - |
| `ASSIGNMENT_CREATE` | - | yes | - | - | - | - |
| `ASSIGNMENT_UPDATE` | - | - | yes | - | - | - |
| `ASSIGNMENT_PUBLISH` | - | - | - | yes | - | - |
| `ASSIGNMENT_SUBMISSION_READ` | yes | - | - | - | - | - |
| `ASSIGNMENT_SUBMISSION_GRADE` | - | - | - | - | yes | - |
| `STUDENT_PORTAL_READ` | self | - | - | - | - | self |
| `ASSIGNMENT_SUBMISSION_CREATE` | - | - | - | - | - | self |

## G. Error contract

`400`, `403`, `404`, `409 CONCURRENT_MODIFICATION`, `422 BUSINESS_RULE_VIOLATION`.

## H. State transitions

```
Assignment:   DRAFT --publish--> PUBLISHED
Submission:   (none) --submit--> SUBMITTED | LATE --grade--> GRADED
```

## I. Dependencies and integrations

- `academic`: sections for assignment targeting.
- `staff`/`identity`: teacher authorization.
- Student portal resolves the student from the account link.

## J. Open issues and implementation gaps

- No attachments, comments or resubmission workflow beyond text.
- No unpublish/archive or delete.
- No notification when an assignment is published (no outbox event).
