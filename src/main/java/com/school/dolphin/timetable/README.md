# Timetable & Scheduling

Status: **Implemented**

[Shared conventions](../../../../../../../docs/api/README.md) apply.

## A. Module overview

Owns rooms, timetable slots, scheduled lessons, dated lesson occurrences,
substitute assignment and substitute audit.

Included in V1: room CRUD (create/list), slot create/list, lesson
create/reschedule/cancel, section/teacher timetable reads, occurrence generation
and listing, coverage listing, substitute assignment and audit, student
self-timetable.

Excluded: exam timetables, room-booking calendars, recurring-term automation
beyond occurrence generation.

Dependencies: `organization`, `academic` (sections, years, subjects, teacher
assignments), `staff`, `leave` (teacher-on-leave suppression during generation).

Principal classes: `controller/{TimetableController,StudentPortalTimetableController}`,
`service/{TimetableService,LessonOccurrenceService,SubstituteAssignmentService,TeacherSectionAuthorization}`.

## B. API conventions

- Base paths: `/api/v1/timetable`, `/api/v1/student-portal`.
- Authentication: bearer; permissions in the inventory.
- Scope: institution scope where enforced (see gap below).
- Enums: `LessonOccurrenceStatus`; days of week `1..7` (Monday..Sunday).

## C. Endpoint inventory

| Method | Path | Purpose | Permission | Scope |
|---|---|---|---|---|
| POST | `/api/v1/timetable/rooms` | Create room | `ROOM_CREATE` | institution |
| GET | `/api/v1/timetable/rooms` | List rooms | `ROOM_READ` | institution |
| POST | `/api/v1/timetable/slots` | Create slot | `TIMETABLE_SLOT_CREATE` | institution |
| GET | `/api/v1/timetable/slots` | List slots | `TIMETABLE_SLOT_READ` | institution |
| GET | `/api/v1/timetable/sections/{sectionId}` | Section timetable | `TIMETABLE_READ` | institution |
| GET | `/api/v1/timetable/teachers/{staffAssignmentId}` | Teacher timetable | `TEACHER_TIMETABLE_READ` | institution |
| POST | `/api/v1/timetable/lessons` | Create lesson | `TIMETABLE_LESSON_CREATE` | institution |
| PUT | `/api/v1/timetable/lessons/{lessonId}` | Reschedule lesson | `TIMETABLE_LESSON_UPDATE` | institution |
| PATCH | `/api/v1/timetable/lessons/{lessonId}/cancel` | Cancel lesson | `TIMETABLE_LESSON_CANCEL` | institution |
| POST | `/api/v1/timetable/occurrences/generate` | Generate occurrences | `TIMETABLE_LESSON_CREATE` | **missing** |
| GET | `/api/v1/timetable/occurrences` | List occurrences | `TIMETABLE_READ` | **missing** |
| POST | `/api/v1/timetable/occurrences/{occurrenceId}/substitute` | Assign substitute | `SUBSTITUTE_ASSIGN` | institution |
| GET | `/api/v1/timetable/occurrences/coverage` | Coverage list | `TIMETABLE_READ` | institution |
| GET | `/api/v1/timetable/occurrences/{occurrenceId}/substitute-audit` | Substitute audit | `TIMETABLE_READ` | institution |
| GET | `/api/v1/student-portal/timetable` | My timetable | `STUDENT_PORTAL_READ` | self |

All `Implemented`.

## D. Endpoint contracts (selected)

### POST /api/v1/timetable/rooms

`CreateSchoolRoomRequest`: `institutionId` (required), `campusId` (optional),
`code` (required, <= 30), `name` (required, <= 100), `capacity` (positive,
optional) -> `201` UUID. `GET /rooms?institutionId=` -> `List<SchoolRoomResponse>`.

### POST /api/v1/timetable/slots

`CreateTimetableSlotRequest`: `academicYearId` (required), `dayOfWeek`
(1..7), `startTime`, `endTime` (required), `label` (<= 50) -> `201` UUID.
`GET /slots?academicYearId=` -> `List<TimetableSlotResponse>`.

### POST /api/v1/timetable/lessons

`CreateScheduledLessonRequest`: `sectionId`, `slotId`, `teacherAssignmentId`,
`subjectId` (required), `roomId` (optional) -> `201` UUID.

### PUT /api/v1/timetable/lessons/{lessonId}

`RescheduleLessonRequest`: `slotId`, `teacherAssignmentId`, `subjectId`
(required), `roomId` (optional) -> `200` UUID.

### PATCH /api/v1/timetable/lessons/{lessonId}/cancel

No body -> `200` UUID. Transition cancels the lesson (rebookable per V26).

### GET /api/v1/timetable/sections/{sectionId} / teachers/{staffAssignmentId}

Return `List<ScheduledLessonResponse>` (section name, day/time, teacher, subject,
room).

### POST /api/v1/timetable/occurrences/generate

`GenerateLessonOccurrencesRequest`: `sectionId`, `startDate`, `endDate`
(required; `endDate >= startDate`). Response `201` integer (occurrences created).
Rules: range <= 366 days; occurrences skipped when they already exist or the
teacher is on approved leave.

### GET /api/v1/timetable/occurrences

Query: `sectionId`, `startDate`, `endDate`. Response `200`
`List<LessonOccurrenceResponse>`.

### POST /api/v1/timetable/occurrences/{occurrenceId}/substitute

`AssignSubstituteRequest`: `substituteStaffAssignmentId` (required), `comment`
(<= 1000) -> `200` `SubstituteAssignmentResponse`. Audit row recorded.

### GET /api/v1/timetable/occurrences/coverage

Query: `institutionId`, `startDate`, `endDate` -> `List<LessonOccurrenceResponse>`.

### GET /api/v1/student-portal/timetable

No params. Resolves the student's active enrollments and returns
`List<ScheduledLessonResponse>`.

## E. Validation and business rules

- `dayOfWeek` in `1..7`; `startTime`/`endTime` required.
- Occurrence generation capped at 366 days; skips teacher-on-leave days.
- Substitute assignment validates the substitute assignment and logs audit.
- `AssertTrue` validation on the occurrence date range.

## F. Authorization matrix

| Permission | Read | Create | Update | Special |
|---|---|---|---|---|
| `ROOM_READ` / `ROOM_CREATE` | yes | yes | - | institution scope |
| `TIMETABLE_SLOT_READ` / `TIMETABLE_SLOT_CREATE` | yes | yes | - | institution scope |
| `TIMETABLE_READ` | yes | - | - | institution scope (except `/occurrences`) |
| `TIMETABLE_LESSON_CREATE` | - | yes | - | institution scope (except `/occurrences/generate`) |
| `TIMETABLE_LESSON_UPDATE` / `TIMETABLE_LESSON_CANCEL` | - | - | yes | institution scope |
| `TEACHER_TIMETABLE_READ` | yes | - | - | institution scope |
| `SUBSTITUTE_ASSIGN` | - | - | yes | institution scope |
| `STUDENT_PORTAL_READ` | self | - | - | own sections |

## G. Error contract

`400`, `403`, `404`, `409 CONCURRENT_MODIFICATION`, `422 BUSINESS_RULE_VIOLATION`.

## H. State transitions

```
ScheduledLesson: ACTIVE --cancel--> CANCELLED (rebookable)
LessonOccurrence: scheduled --substitute--> teacher replaced (audited)
```

## I. Dependencies and integrations

- `academic`/`staff`: sections, teacher assignments, subjects.
- `leave`: suppresses occurrences when the teacher is on approved leave.
- `attendance`: lesson occurrences drive lesson attendance.

## J. Open issues and implementation gaps

- **Missing scope check (important):** `POST /api/v1/timetable/occurrences/generate`
  and `GET /api/v1/timetable/occurrences` receive no `Authentication` and call
  `LessonOccurrenceService.generateForSection(...)` /
  `getSectionOccurrences(...)` directly. Neither method performs an
  institution-scope check, and the controller comments acknowledge the check is
  absent. Any user holding `TIMETABLE_LESSON_CREATE` or `TIMETABLE_READ` can
  generate or read occurrences for any section, across institutions. This needs
  an authorization fix (service should accept `Authentication` and call
  `OrganizationScopeAuthorization`).
- No update/delete for rooms, slots or lessons (only reschedule/cancel).
- Occurrence listing has no pagination or range cap.
