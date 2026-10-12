# Dolphin API Testing Guide (Postman + cURL)

This guide lets you exercise **every implemented Dolphin REST endpoint** from
either Postman or the command line. It is generated from the repository source
(controllers, `@PreAuthorize`, request/response DTOs, `SecurityConfig`,
Flyway migrations) and the module `README.md` files. The source code is the
authority.

Companion artifacts:

- `postman/Dolphin.postman_collection.json` — 203 requests in 28 folders.
- `postman/Dolphin.local.postman_environment.json` — `baseUrl` + token/id variables.

> **Scope.** This guide only *describes* how to run requests. Do not run these
> against a database you are not authorized to touch. Nothing here starts the
> application or migrates the database by itself.

---

## 1. Prerequisites

- The Dolphin backend is running locally. `src/main/resources/application.yaml`
  sets **no `server.port`**, so the default port is **8080** →
  `http://localhost:8080`.
- PostgreSQL is reachable at the configured datasource
  (`jdbc:postgresql://localhost:5432/dolphin`, user `springuser`) and the
  Flyway migrations have been applied.
- The `JWT_SECRET` environment variable is set (the app fails fast without a
  valid base64 key of at least 32 bytes). Access tokens live 900 s
  (`expiration-ms: 900000`); refresh tokens live 30 days by default.
- `jq` is available if you want to capture ids from the shell (optional).

### 1.1 There is no seeded login user (important)

The migrations seed the **roles** `PLATFORM_ADMIN`, `GUARDIAN`, `TEACHER`,
`STUDENT` and the permission catalogue, and `V2__create_identity_tables.sql`
tries to grant `PLATFORM_ADMIN` to a user named `dolphin_admin` — but **no
migration inserts a `user_account` row**. The `user_role` insert is a no-op
unless that user already exists.

Therefore, before you can log in you must have a user account. Create one out of
band (this is a normal operational step; it is **not** something these artifacts
execute for you). The password must be stored as a Spring `DelegatingPasswordEncoder`
hash (BCrypt by default, i.e. a value like `{bcrypt}$2a$...`). Sketch:

```sql
-- Run this yourself, in your own environment. Not executed by this guide.
INSERT INTO user_account (id, username, email, password_hash, first_name, last_name, active, created_at, updated_at)
VALUES (gen_random_uuid(), 'dolphin_admin', 'admin@example.org', '{bcrypt}$2a$10$<hash>', 'Dolphin', 'Admin', TRUE, NOW(), NOW());

INSERT INTO user_role (user_id, role_id)
SELECT u.id, r.id FROM user_account u, role r
WHERE u.username = 'dolphin_admin' AND r.code = 'PLATFORM_ADMIN';
```

An alternative used during development is to start with any pre-existing user
created through the identity endpoints by another administrator, then assign the
`PLATFORM_ADMIN` role and an organization scope.

Set the credentials in the Postman environment (`adminUsername`, `adminPassword`)
or in your shell.

---

## 2. Configure the base URL and tokens

```bash
export BASE_URL=http://localhost:8080
export ACCESS_TOKEN=""
export REFRESH_TOKEN=""
```

In Postman: import both files, select the **Dolphin local** environment, then set
`adminUsername` / `adminPassword`. The login request writes `accessToken`,
`refreshToken` and `userId` into both collection and environment variables.

---

## 3. Authentication flows

### 3.1 Login

`POST /api/v1/auth/login` (public). Body is `LoginRequest` `{username, password}`.
Response `200` is `LoginResponse`:

```json
{
  "accessToken": "<jwt>",
  "tokenType": "Bearer",
  "expiresInSeconds": 900,
  "refreshToken": "<opaque>",
  "refreshExpiresInSeconds": 2592000,
  "userId": "…",
  "username": "dolphin_admin"
}
```

```bash
curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"username":"dolphin_admin","password":"<admin-password>"}'

# capture tokens (jq)
export ACCESS_TOKEN=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"username":"dolphin_admin","password":"<admin-password>"}' | jq -r '.accessToken')
export REFRESH_TOKEN=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"username":"dolphin_admin","password":"<admin-password>"}' | jq -r '.refreshToken')
```

Failure cases: `400 VALIDATION_ERROR` when a field is blank; `401
INVALID_CREDENTIALS` for unknown/inactive user or wrong password; `429
TOO_MANY_LOGIN_ATTEMPTS` after 5 failures in 15 minutes.

### 3.2 Authenticated request

All non-public endpoints take `Authorization: Bearer <accessToken>`.

```bash
curl -s "$BASE_URL/api/v1/students?institutionId=$INSTITUTION_ID&page=0&size=20" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 3.3 Refresh (rotates the refresh token)

`POST /api/v1/auth/refresh` (public). Body `{ "refreshToken": "…" }`. Returns a
new `LoginResponse`; the presented refresh token is revoked and replaced (reuse
of a rotated token revokes the whole session family).

```bash
curl -s -X POST "$BASE_URL/api/v1/auth/refresh" \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"
```

### 3.4 Logout

`POST /api/v1/auth/logout` (public). Body `{ "refreshToken": "…" }`. Returns
`204 No Content` and revokes the session family.

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE_URL/api/v1/auth/logout" \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"
```

### 3.5 Change own password

`POST /api/v1/auth/change-password` (authenticated). Body
`{currentPassword, newPassword}` (new password 8–100 chars). Returns `200`
`{"status":"CHANGED","message":"…"}` and revokes all of the caller's refresh
sessions. **Warning:** changing the admin password will invalidate
`adminPassword`; update the environment afterwards.

---

## 4. Capturing ids and reusing them

Every create request either returns a response object (with `id`) or a **bare
UUID string**. Capture the value and reuse it in the follow-up requests:

```bash
# bare UUID response (organization, staff, academic, timetable, leave, enrollment…)
export INSTITUTION_ID=$(curl -s -X POST "$BASE_URL/api/v1/institutions" \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"clusterId\":\"$CLUSTER_ID\",\"code\":\"INST-01\",\"name\":\"Dolphin Public School\",\"institutionType\":\"K12\"}" | jq -r '.')

# object response (fetch .id)
export STUDENT_ID=$(curl -s -X POST "$BASE_URL/api/v1/students" \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"institutionId\":\"$INSTITUTION_ID\",\"admissionNumber\":\"ADM-2026-0001\",\"firstName\":\"Aarav\"}" | jq -r '.id')

# paginated collection response (fetch .content[0].id)
export ALERT_ID=$(curl -s "$BASE_URL/api/v1/attendance-alerts?institutionId=$INSTITUTION_ID&startDate=2026-01-01&endDate=2026-12-31" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq -r '.content[0].id')
```

The Postman requests do the equivalent automatically in their **Tests** tab
(`pm.collectionVariables.set(...)` and `pm.environment.set(...)`).

---

## 5. Recommended execution order (dependencies)

Most read endpoints need an id produced by a create endpoint, and every staff
endpoint needs a valid token whose permission codes match the `@PreAuthorize`
authority. Run top-to-bottom; within each module create before read.

1. **Authentication** — login first to populate `accessToken`.
2. **Identity** — create role → create permission → grant permission to role →
   create user → grant role/scope (needed for portal logins and account links).
3. **Organization** — enterprise → region → cluster → **institution** → campus.
   Everything scoped (students, staff, academics, …) needs `institutionId`, and
   most also accept `campusId`.
4. **Students** — create student; optionally link a user account.
5. **Staff** — create staff + assignment (`staffAssignmentId`, `staffMemberId`);
   used by teacher-subject assignments and timetable.
6. **Academic structure** — year → activate → class → section → enroll student.
7. **Subjects & teacher assignments** — subject → assign teacher.
8. **Timetable** — room → slot → lesson → generate occurrences → (list
   occurrences to capture `occurrenceId`).
9. **Attendance (daily)** and **Lesson attendance** (needs `occurrenceId`).
10. **Assessment & marks** — assessment → record marks → audit → report card.
11. **Homework** — create → publish → (student submits) → grade.
12. **Discipline, Calendar, Admissions, Hostel, Inventory, Mess, Documents.**
13. **Notifications / outbox**.
14. **Analytics** (needs institution + dates).
15. **Student Portal** and **Parent Portal** (need a `STUDENT`/`GUARDIAN`
    account token and, for parents, a linked guardian relationship).

Requests that can run **independently** (after login): all `GET` reads of
organization nodes, `GET /users/{id}`, `GET /roles/{id}`, `GET /permissions/{id}`,
notification inbox/unread-count, and the outbox admin reads.

---

## 6. Endpoint reference (cURL, grouped by module)

Every command assumes `export BASE_URL` and `export ACCESS_TOKEN`, plus the ids
created earlier. Shell id variables use the upper-snake form of the Postman /
environment keys, e.g. `INSTITUTION_ID` (`institutionId`), `STUDENT_ID`,
`STAFF_MEMBER_ID`, `STAFF_ASSIGNMENT_ID`, `ACADEMIC_YEAR_ID`, `SCHOOL_CLASS_ID`,
`SECTION_ID`, `SUBJECT_ID`, `TEACHER_SUBJECT_ASSIGNMENT_ID`, `ATTENDANCE_ID`,
`LESSON_RECORD_ID`, `OCCURRENCE_ID`, `ALERT_ID`, `ASSESSMENT_ID`, `MARK_ID`,
`ROOM_ID`, `SLOT_ID`, `LESSON_ID`, `ASSIGNMENT_ID`, `SUBMISSION_ID`,
`STAFF_LEAVE_ID`, `STUDENT_LEAVE_ID`, `LEAVE_TYPE_ID`, `INCIDENT_ID`,
`EVENT_ID`, `APPLICATION_ID`, `HOSTEL_ID`, `HOSTEL_ROOM_ID`, `ALLOCATION_ID`,
`ITEM_ID`, `MEAL_ID`, `NOTIFICATION_ID`, `OUTBOX_EVENT_ID`, `TEMPLATE_ID`,
`DOCUMENT_ID`. Set each one as you create the matching resource (see section 4).
Bodies are the exact request DTOs.

### 6.1 Authentication — `/api/v1/auth`

```bash
# login / refresh / logout / change-password (see section 3)
curl -s -X POST "$BASE_URL/api/v1/auth/login" -H 'Content-Type: application/json' \
  -d '{"username":"dolphin_admin","password":"<pwd>"}'
curl -s -X POST "$BASE_URL/api/v1/auth/refresh" -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"
curl -s -X POST "$BASE_URL/api/v1/auth/logout" -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"
curl -s -X POST "$BASE_URL/api/v1/auth/change-password" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"currentPassword":"<pwd>","newPassword":"NewPassword123"}'
```

Permissions: login/refresh/logout are public; change-password needs only an
authenticated user.

### 6.2 Identity — users, roles, permissions

| Permission | Endpoint |
|---|---|
| `ROLE_CREATE` / `ROLE_READ` | `POST /api/v1/roles`, `GET /api/v1/roles/{id}` |
| `ROLE_PERMISSION_ASSIGN` | `POST /api/v1/roles/{roleId}/permissions/{permissionId}` |
| `PERMISSION_CREATE` / `PERMISSION_READ` | `POST /api/v1/permissions`, `GET /api/v1/permissions/{id}` |
| `USER_CREATE` / `USER_READ` / `USER_UPDATE` / `USER_DEACTIVATE` | `POST /api/v1/users`, `GET|PUT /api/v1/users/{id}`, `PATCH /api/v1/users/{id}/deactivate` |
| `USER_ROLE_ASSIGN` | `POST /api/v1/users/{userId}/roles/{roleId}` |
| `USER_SCOPE_ASSIGN` | `POST /api/v1/users/{userId}/scopes` |

```bash
curl -s -X POST "$BASE_URL/api/v1/roles" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' -d '{"code":"SAMPLE_ROLE","name":"Sample Role"}'
curl -s -X POST "$BASE_URL/api/v1/permissions" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' -d '{"code":"SAMPLE_PERMISSION","name":"Sample Permission"}'
curl -s -X POST "$BASE_URL/api/v1/users" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"username":"sample.user","email":"sample.user@example.org","password":"ChangeMe123!","firstName":"Sample","lastName":"User"}'
curl -s -X POST "$BASE_URL/api/v1/users/$USER_ID/scopes" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' -d "{\"scopeType\":\"INSTITUTION\",\"scopeId\":\"$INSTITUTION_ID\"}"
curl -s -X PATCH "$BASE_URL/api/v1/users/$USER_ID/deactivate" -H "Authorization: Bearer $ACCESS_TOKEN"
```

> These are administrative endpoints with **no organization-scope restriction** —
> the permission is the only gate. Required role: `PLATFORM_ADMIN` (or any role
> granted the specific permission).

### 6.3 Organization — `/api/v1/enterprises|regions|clusters|institutions|campuses`

| Permission | Endpoint |
|---|---|
| `ENTERPRISE_CREATE`/`_READ` | `POST /api/v1/enterprises`, `GET /api/v1/enterprises/{id}` |
| `REGION_CREATE`/`_READ` | `POST /api/v1/regions`, `GET /api/v1/regions/{id}`, `GET /api/v1/regions/by-enterprise/{enterpriseId}` |
| `CLUSTER_CREATE`/`_READ` | `POST /api/v1/clusters`, `GET /api/v1/clusters/{id}`, `GET /api/v1/clusters/by-region/{regionId}` |
| `INSTITUTION_CREATE`/`_READ` | `POST /api/v1/institutions`, `GET /api/v1/institutions/{id}` |
| `CAMPUS_CREATE`/`_READ` | `POST /api/v1/campuses`, `GET /api/v1/campuses/{id}` |

```bash
curl -s -X POST "$BASE_URL/api/v1/enterprises" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' -d '{"code":"DOLPHIN","name":"Dolphin Education Group"}'
curl -s -X POST "$BASE_URL/api/v1/institutions" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"clusterId\":\"$CLUSTER_ID\",\"code\":\"INST-01\",\"name\":\"Dolphin Public School\",\"institutionType\":\"K12\"}"
curl -s "$BASE_URL/api/v1/regions/by-enterprise/$ENTERPRISE_ID" -H "Authorization: Bearer $ACCESS_TOKEN"
```

Reads need a scope at/above the requested node; creates need scope over the
parent node. Enterprise creation is permission-gated only (no parent).

### 6.4 Students — `/api/v1/students`, `/api/v1/student-portal/me`

| Permission | Endpoint |
|---|---|
| `STUDENT_CREATE` | `POST /api/v1/students` |
| `STUDENT_READ` | `GET /api/v1/students/{id}`, `GET /api/v1/students` |
| `STUDENT_UPDATE` | `PUT /api/v1/students/{id}` |
| `STUDENT_DEACTIVATE` | `PATCH /api/v1/students/{id}/deactivate` |
| `STUDENT_ACCOUNT_LINK` | `POST /api/v1/students/{id}/account-link` |
| `STUDENT_PORTAL_READ` | `GET /api/v1/student-portal/me` (self) |

```bash
curl -s -X POST "$BASE_URL/api/v1/students" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"institutionId\":\"$INSTITUTION_ID\",\"campusId\":\"$CAMPUS_ID\",\"admissionNumber\":\"ADM-2026-0001\",\"firstName\":\"Aarav\",\"lastName\":\"Sharma\",\"dateOfBirth\":\"2014-05-02\"}"
curl -s "$BASE_URL/api/v1/students?institutionId=$INSTITUTION_ID&search=Aarav&page=0&size=20&sort=firstName,asc" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X POST "$BASE_URL/api/v1/students/$STUDENT_ID/account-link" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' -d "{\"userAccountId\":\"$USER_ACCOUNT_ID\"}"
curl -s -X PATCH "$BASE_URL/api/v1/students/$STUDENT_ID/deactivate" -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 6.5 Staff — `/api/v1/staff`

```bash
curl -s -X POST "$BASE_URL/api/v1/staff" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"institutionId\":\"$INSTITUTION_ID\",\"campusId\":\"$CAMPUS_ID\",\"firstName\":\"Meera\",\"lastName\":\"Nair\",\"email\":\"meera.nair@example.org\",\"employeeNumber\":\"EMP-0007\",\"staffType\":\"TEACHER\",\"jobTitle\":\"Mathematics Teacher\",\"startDate\":\"2026-06-01\"}"
curl -s "$BASE_URL/api/v1/staff?institutionId=$INSTITUTION_ID&status=ACTIVE&page=0&size=20" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X PATCH "$BASE_URL/api/v1/staff/assignments/$STAFF_ASSIGNMENT_ID/status" \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H 'Content-Type: application/json' -d '{"status":"ON_LEAVE"}'
```

Permissions: `STAFF_CREATE`, `STAFF_READ`, `STAFF_UPDATE` (institution scope).
`staffType` ∈ `TEACHER|PRINCIPAL|ADMINISTRATOR|LIBRARIAN|COUNSELOR|SUPPORT`;
`status` ∈ `ACTIVE|ON_LEAVE|INACTIVE|TERMINATED`.

### 6.6 Guardians & invitations — `/api/v1/guardians`, `/api/v1/guardian-invitations`

```bash
curl -s -X POST "$BASE_URL/api/v1/guardians" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"institutionId\":\"$INSTITUTION_ID\",\"firstName\":\"Ritu\",\"lastName\":\"Verma\",\"email\":\"ritu.verma@example.org\",\"phone\":\"+91-9000000001\"}"
curl -s -X POST "$BASE_URL/api/v1/students/$STUDENT_ID/guardians/$GUARDIAN_ID" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' -d '{"relationshipType":"MOTHER","primaryContact":true,"pickupAuthorized":true}'
curl -s "$BASE_URL/api/v1/students/$STUDENT_ID/guardians" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X DELETE "$BASE_URL/api/v1/students/$STUDENT_ID/guardians/$GUARDIAN_ID" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X POST "$BASE_URL/api/v1/guardian-invitations/$GUARDIAN_ID" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' -d '{"email":"ritu.verma@example.org"}'
# public accept (no token)
curl -s -X POST "$BASE_URL/api/v1/guardian-invitations/accept" -H 'Content-Type: application/json' \
  -d "{\"token\":\"$INVITATION_TOKEN\",\"password\":\"GuardianPass123\"}"
curl -s -X PATCH "$BASE_URL/api/v1/guardians/$GUARDIAN_ID/deactivate" -H "Authorization: Bearer $ACCESS_TOKEN"
```

Permissions: `GUARDIAN_CREATE|READ|UPDATE|DEACTIVATE`, `STUDENT_GUARDIAN_LINK`,
`STUDENT_GUARDIAN_UNLINK`, `GUARDIAN_INVITE`. `POST
/api/v1/guardian-invitations/accept` is **public**. The invitation token is
returned only once by create-invitation.

### 6.7 Academic structure — `/api/v1/academic`

```bash
# year → activate → class → section → enroll
YEAR=$(curl -s -X POST "$BASE_URL/api/v1/academic/years" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"institutionId\":\"$INSTITUTION_ID\",\"name\":\"2026-2027\",\"startDate\":\"2026-04-01\",\"endDate\":\"2027-03-31\"}" | jq -r '.')
curl -s -X PATCH "$BASE_URL/api/v1/academic/years/$YEAR/activate" -H "Authorization: Bearer $ACCESS_TOKEN"
CLASS=$(curl -s -X POST "$BASE_URL/api/v1/academic/classes" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"academicYearId\":\"$YEAR\",\"name\":\"Grade 5\",\"code\":\"G5\",\"sortOrder\":1}" | jq -r '.')
SECTION=$(curl -s -X POST "$BASE_URL/api/v1/academic/sections" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"schoolClassId\":\"$CLASS\",\"campusId\":\"$CAMPUS_ID\",\"name\":\"A\",\"capacity\":40}" | jq -r '.')
curl -s -X POST "$BASE_URL/api/v1/academic/enrollments" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"studentId\":\"$STUDENT_ID\",\"sectionId\":\"$SECTION\",\"startDate\":\"2026-04-05\"}"
curl -s "$BASE_URL/api/v1/academic/sections/$SECTION/students?page=0&size=20&sort=startDate" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/academic/students/$STUDENT_ID/enrollments" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X PATCH "$BASE_URL/api/v1/academic/enrollments/$ENROLLMENT_ID/complete" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' -d '{"endDate":"2026-12-20"}'
curl -s -X PATCH "$BASE_URL/api/v1/academic/years/$YEAR/close" -H "Authorization: Bearer $ACCESS_TOKEN"
```

Permissions: `ACADEMIC_YEAR_*`, `CLASS_*`, `SECTION_*`, `STUDENT_ENROLL`,
`ENROLLMENT_READ|COMPLETE|WITHDRAW`, `STUDENT_TRANSFER`. Create/lifecycle
endpoints return a **bare UUID**.

### 6.8 Subjects & teacher assignments — `/api/v1/subjects`, `/api/v1/teacher-subject-assignments`

```bash
curl -s -X POST "$BASE_URL/api/v1/subjects" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"institutionId\":\"$INSTITUTION_ID\",\"code\":\"MATH\",\"name\":\"Mathematics\"}"
curl -s "$BASE_URL/api/v1/subjects?institutionId=$INSTITUTION_ID" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X POST "$BASE_URL/api/v1/teacher-subject-assignments" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"staffAssignmentId\":\"$STAFF_ASSIGNMENT_ID\",\"subjectId\":\"$SUBJECT_ID\",\"startDate\":\"2026-06-01\"}"
curl -s "$BASE_URL/api/v1/teacher-subject-assignments?institutionId=$INSTITUTION_ID" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X PATCH "$BASE_URL/api/v1/teacher-subject-assignments/$TEACHER_SUBJECT_ASSIGNMENT_ID/end?endDate=2026-12-20" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Permissions: `SUBJECT_CREATE|READ`, `TEACHER_SUBJECT_ASSIGN|READ`.

### 6.9 Attendance (daily) — `/api/v1/attendance`

```bash
curl -s -X POST "$BASE_URL/api/v1/attendance" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"institutionId\":\"$INSTITUTION_ID\",\"attendanceDate\":\"2026-10-12\",\"records\":[{\"studentId\":\"$STUDENT_ID\",\"status\":\"PRESENT\",\"remarks\":\"On time\"}]}"
curl -s "$BASE_URL/api/v1/attendance?institutionId=$INSTITUTION_ID&attendanceDate=2026-10-12&page=0&size=20" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X PUT "$BASE_URL/api/v1/attendance/$ATTENDANCE_ID" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' -d '{"status":"LATE","remarks":"Arrived late"}'
curl -s "$BASE_URL/api/v1/attendance/$ATTENDANCE_ID/audit" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/attendance/summary?institutionId=$INSTITUTION_ID&attendanceDate=2026-10-12" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/attendance/summary/trend?institutionId=$INSTITUTION_ID&from=2026-10-01&to=2026-10-31" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Permissions: `ATTENDANCE_MARK|READ|UPDATE|AUDIT_READ`. `status` ∈
`PRESENT|ABSENT|LATE|EXCUSED`; 1–500 records per mark call.

### 6.10 Lesson attendance — `/api/v1/lesson-attendance`

```bash
curl -s "$BASE_URL/api/v1/lesson-attendance/occurrences/$OCCURRENCE_ID/roster" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/lesson-attendance/occurrences/$OCCURRENCE_ID" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X POST "$BASE_URL/api/v1/lesson-attendance/occurrences/$OCCURRENCE_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"records\":[{\"studentId\":\"$STUDENT_ID\",\"status\":\"PRESENT\",\"remarks\":\"OK\"}]}"
curl -s -X PUT "$BASE_URL/api/v1/lesson-attendance/records/$LESSON_RECORD_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H 'Content-Type: application/json' \
  -d '{"status":"LATE","remarks":"Late arrival"}'
curl -s "$BASE_URL/api/v1/lesson-attendance/records/$LESSON_RECORD_ID/audit" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/lesson-attendance/analytics/students?institutionId=$INSTITUTION_ID&sectionId=$SECTION_ID&startDate=2026-01-01&endDate=2026-12-31" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/lesson-attendance/analytics/sections?institutionId=$INSTITUTION_ID&startDate=2026-01-01&endDate=2026-12-31" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/lesson-attendance/analytics/subjects?institutionId=$INSTITUTION_ID&startDate=2026-01-01&endDate=2026-12-31" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/lesson-attendance/analytics/low-attendance?institutionId=$INSTITUTION_ID&sectionId=$SECTION_ID&startDate=2026-01-01&endDate=2026-12-31&threshold=75.00" -H "Authorization: Bearer $ACCESS_TOKEN"
```

Permissions: `ATTENDANCE_LESSON_READ|MARK|UPDATE`. `occurrenceId` comes from
section 6.13 (occurrence listing).

### 6.11 Attendance alerts — `/api/v1/attendance-alerts`

```bash
curl -s -X POST "$BASE_URL/api/v1/attendance-alerts/generate" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"institutionId\":\"$INSTITUTION_ID\",\"sectionId\":\"$SECTION_ID\",\"startDate\":\"2026-01-01\",\"endDate\":\"2026-12-31\",\"thresholdPercent\":75.00}"
curl -s "$BASE_URL/api/v1/attendance-alerts?institutionId=$INSTITUTION_ID&startDate=2026-01-01&endDate=2026-12-31&page=0&size=20" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/attendance-alerts/$ALERT_ID/audit" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X POST "$BASE_URL/api/v1/attendance-alerts/$ALERT_ID/acknowledge" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X POST "$BASE_URL/api/v1/attendance-alerts/$ALERT_ID/resolve" -H "Authorization: Bearer $ACCESS_TOKEN"
```

Permissions: `ATTENDANCE_ALERT_GENERATE|READ|RESOLVE`. Lifecycle
`OPEN → ACKNOWLEDGED → RESOLVED`. Generate returns a bare integer.

### 6.12 Assessment & marks — `/api/v1/assessments` (+ report cards)

```bash
curl -s -X POST "$BASE_URL/api/v1/assessments" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"institutionId\":\"$INSTITUTION_ID\",\"sectionId\":\"$SECTION_ID\",\"name\":\"Unit Test 1\",\"subjectName\":\"Mathematics\",\"assessmentDate\":\"2026-09-01\",\"maxMarks\":100.00}"
curl -s "$BASE_URL/api/v1/assessments?institutionId=$INSTITUTION_ID&sectionId=$SECTION_ID&page=0&size=20" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X POST "$BASE_URL/api/v1/assessments/$ASSESSMENT_ID/marks" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"records\":[{\"studentId\":\"$STUDENT_ID\",\"marksObtained\":88.50,\"remarks\":\"Good\"}]}"
curl -s "$BASE_URL/api/v1/assessments/$ASSESSMENT_ID/results" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X PUT "$BASE_URL/api/v1/assessments/marks/$MARK_ID" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' -d '{"version":0,"marksObtained":90.00,"remarks":"Reviewed"}'
curl -s "$BASE_URL/api/v1/assessments/marks/$MARK_ID/audit" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/students/$STUDENT_ID/report-card?fromDate=2026-01-01&toDate=2026-12-31" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/student-portal/report-card?fromDate=2026-01-01&toDate=2026-12-31" -H "Authorization: Bearer $ACCESS_TOKEN"
```

Permissions: `ASSESSMENT_CREATE`, `MARKS_READ|RECORD|UPDATE|AUDIT_READ`. Mark
correction requires the current `version` (409 on stale).

### 6.13 Timetable — `/api/v1/timetable` (+ student self-timetable)

```bash
ROOM=$(curl -s -X POST "$BASE_URL/api/v1/timetable/rooms" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"institutionId\":\"$INSTITUTION_ID\",\"campusId\":\"$CAMPUS_ID\",\"code\":\"R-101\",\"name\":\"Room 101\",\"capacity\":40}" | jq -r '.')
curl -s "$BASE_URL/api/v1/timetable/rooms?institutionId=$INSTITUTION_ID" -H "Authorization: Bearer $ACCESS_TOKEN"
SLOT=$(curl -s -X POST "$BASE_URL/api/v1/timetable/slots" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"academicYearId\":\"$ACADEMIC_YEAR_ID\",\"dayOfWeek\":1,\"startTime\":\"09:00:00\",\"endTime\":\"09:45:00\",\"label\":\"Period 1\"}" | jq -r '.')
curl -s "$BASE_URL/api/v1/timetable/slots?academicYearId=$ACADEMIC_YEAR_ID" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/timetable/sections/$SECTION_ID" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/timetable/teachers/$STAFF_ASSIGNMENT_ID" -H "Authorization: Bearer $ACCESS_TOKEN"
LESSON=$(curl -s -X POST "$BASE_URL/api/v1/timetable/lessons" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"sectionId\":\"$SECTION_ID\",\"slotId\":\"$SLOT\",\"teacherAssignmentId\":\"$STAFF_ASSIGNMENT_ID\",\"subjectId\":\"$SUBJECT_ID\",\"roomId\":\"$ROOM\"}" | jq -r '.')
curl -s -X POST "$BASE_URL/api/v1/timetable/occurrences/generate" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"sectionId\":\"$SECTION_ID\",\"startDate\":\"2026-01-01\",\"endDate\":\"2026-12-31\"}"
curl -s "$BASE_URL/api/v1/timetable/occurrences?sectionId=$SECTION_ID&startDate=2026-01-01&endDate=2026-12-31" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X POST "$BASE_URL/api/v1/timetable/occurrences/$OCCURRENCE_ID/substitute" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' -d "{\"substituteStaffAssignmentId\":\"$STAFF_ASSIGNMENT_ID\",\"comment\":\"Covering\"}"
curl -s "$BASE_URL/api/v1/timetable/occurrences/coverage?institutionId=$INSTITUTION_ID&startDate=2026-01-01&endDate=2026-12-31" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/timetable/occurrences/$OCCURRENCE_ID/substitute-audit" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/student-portal/timetable" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X PATCH "$BASE_URL/api/v1/timetable/lessons/$LESSON/cancel" -H "Authorization: Bearer $ACCESS_TOKEN"
```

Permissions: `ROOM_CREATE|READ`, `TIMETABLE_SLOT_CREATE|READ`,
`TIMETABLE_READ`, `TEACHER_TIMETABLE_READ`, `TIMETABLE_LESSON_CREATE|UPDATE|CANCEL`,
`SUBSTITUTE_ASSIGN`. Create endpoints return bare UUIDs; generate returns a bare
integer.

### 6.14 Homework — `/api/v1/assignments`, `/api/v1/student-portal/assignments`

```bash
curl -s -X POST "$BASE_URL/api/v1/assignments" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"institutionId\":\"$INSTITUTION_ID\",\"sectionId\":\"$SECTION_ID\",\"title\":\"Fractions worksheet\",\"instructions\":\"Complete exercises 1-10\",\"dueAt\":\"2026-10-20T18:00:00+05:30\",\"maxMarks\":20.00}"
curl -s "$BASE_URL/api/v1/assignments/$ASSIGNMENT_ID" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/assignments?institutionId=$INSTITUTION_ID&status=DRAFT&page=0&size=20" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X PATCH "$BASE_URL/api/v1/assignments/$ASSIGNMENT_ID" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' -d '{"version":0,"title":"Fractions worksheet (revised)"}'
curl -s -X POST "$BASE_URL/api/v1/assignments/$ASSIGNMENT_ID/publish" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' -d '{"version":0}'
curl -s "$BASE_URL/api/v1/assignments/$ASSIGNMENT_ID/submissions?page=0&size=20" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X PUT "$BASE_URL/api/v1/assignments/$ASSIGNMENT_ID/submissions/$SUBMISSION_ID/grade" \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H 'Content-Type: application/json' \
  -d '{"marksObtained":18.00,"feedback":"Well done","version":0}'
# student portal (student token)
curl -s "$BASE_URL/api/v1/student-portal/assignments?page=0&size=20" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X POST "$BASE_URL/api/v1/student-portal/assignments/$ASSIGNMENT_ID/submissions" \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H 'Content-Type: application/json' \
  -d '{"submissionText":"Here is my completed worksheet."}'
curl -s "$BASE_URL/api/v1/student-portal/assignments/$ASSIGNMENT_ID/submissions/me" -H "Authorization: Bearer $ACCESS_TOKEN"
```

Permissions: `ASSIGNMENT_CREATE|READ|UPDATE|PUBLISH`,
`ASSIGNMENT_SUBMISSION_READ|GRADE|CREATE`, `STUDENT_PORTAL_READ`. Assignment and
submission mutations require the current `version`.

### 6.15 Staff leave — `/api/v1/staff-leave`

```bash
curl -s -X POST "$BASE_URL/api/v1/staff-leave" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"staffMemberId\":\"$STAFF_MEMBER_ID\",\"institutionId\":\"$INSTITUTION_ID\",\"leaveTypeId\":\"$LEAVE_TYPE_ID\",\"startDate\":\"2026-11-01\",\"endDate\":\"2026-11-03\",\"reason\":\"Annual vacation\"}"
curl -s "$BASE_URL/api/v1/staff-leave?institutionId=$INSTITUTION_ID&status=PENDING&page=0&size=20" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X POST "$BASE_URL/api/v1/staff-leave/$STAFF_LEAVE_ID/approve" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' -d '{"comment":"Approved"}'
curl -s -X POST "$BASE_URL/api/v1/staff-leave/$STAFF_LEAVE_ID/cancel" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/staff-leave/$STAFF_LEAVE_ID/audit" -H "Authorization: Bearer $ACCESS_TOKEN"
```

Permissions: `STAFF_LEAVE_CREATE|READ|REVIEW|CANCEL|AUDIT_READ`.
`leaveTypeId` is **not** exposed by any API (seeded `leave_type` codes:
`ANNUAL`, `SICK`, `PERSONAL`, `UNPAID`); obtain the UUID from the database
(`SELECT id, code FROM leave_type;`) or from an existing leave response.

### 6.16 Student leave — `/api/v1/student-leave`

```bash
curl -s -X POST "$BASE_URL/api/v1/student-leave" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"studentId\":\"$STUDENT_ID\",\"institutionId\":\"$INSTITUTION_ID\",\"leaveTypeId\":\"$LEAVE_TYPE_ID\",\"startDate\":\"2026-11-01\",\"endDate\":\"2026-11-03\",\"reason\":\"Family function\"}"
curl -s "$BASE_URL/api/v1/student-leave?institutionId=$INSTITUTION_ID&status=PENDING&page=0&size=20" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X POST "$BASE_URL/api/v1/student-leave/$STUDENT_LEAVE_ID/approve" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' -d '{"comment":"Approved"}'
curl -s -X POST "$BASE_URL/api/v1/student-leave/$STUDENT_LEAVE_ID/cancel" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/student-leave/$STUDENT_LEAVE_ID/audit" -H "Authorization: Bearer $ACCESS_TOKEN"
```

Permissions: `STUDENT_LEAVE_CREATE|READ|REVIEW|CANCEL|AUDIT_READ`.

### 6.17 Discipline — `/api/v1/discipline/incidents`

```bash
curl -s -X POST "$BASE_URL/api/v1/discipline/incidents" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"institutionId\":\"$INSTITUTION_ID\",\"campusId\":\"$CAMPUS_ID\",\"studentId\":\"$STUDENT_ID\",\"category\":\"DISRUPTION\",\"severity\":\"MINOR\",\"description\":\"Repeatedly talking during class\",\"incidentDate\":\"2026-10-01\"}"
curl -s "$BASE_URL/api/v1/discipline/incidents?institutionId=$INSTITUTION_ID&page=0&size=20" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/discipline/incidents/$INCIDENT_ID" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X PATCH "$BASE_URL/api/v1/discipline/incidents/$INCIDENT_ID/status" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' -d '{"status":"UNDER_REVIEW"}'
```

Permissions: `DISCIPLINE_INCIDENT_CREATE|READ|UPDATE`.

### 6.18 Calendar events — `/api/v1/calendar-events`

```bash
curl -s -X POST "$BASE_URL/api/v1/calendar-events" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"institutionId\":\"$INSTITUTION_ID\",\"campusId\":\"$CAMPUS_ID\",\"title\":\"Annual Sports Day\",\"description\":\"Inter-house athletics\",\"eventType\":\"SPORTS\",\"startDate\":\"2026-11-10\",\"endDate\":\"2026-11-10\",\"startTime\":\"09:00:00\",\"endTime\":\"16:00:00\"}"
curl -s "$BASE_URL/api/v1/calendar-events?institutionId=$INSTITUTION_ID&eventType=SPORTS&page=0&size=20" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/calendar-events/$EVENT_ID" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X PUT "$BASE_URL/api/v1/calendar-events/$EVENT_ID" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Annual Sports Day (updated)","eventType":"SPORTS","startDate":"2026-11-11","endDate":"2026-11-11"}'
curl -s -X POST "$BASE_URL/api/v1/calendar-events/$EVENT_ID/deactivate" -H "Authorization: Bearer $ACCESS_TOKEN"
```

Permissions: `CALENDAR_EVENT_CREATE|READ|UPDATE|DEACTIVATE`.

### 6.19 Admissions — `/api/v1/admissions/applications`

```bash
curl -s -X POST "$BASE_URL/api/v1/admissions/applications" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"institutionId\":\"$INSTITUTION_ID\",\"campusId\":\"$CAMPUS_ID\",\"applyingClassId\":\"$SCHOOL_CLASS_ID\",\"applicantFirstName\":\"Ishaan\",\"applicantLastName\":\"Verma\",\"applicantDateOfBirth\":\"2015-03-15\",\"parentName\":\"Ritu Verma\",\"parentEmail\":\"ritu.verma@example.org\"}"
curl -s "$BASE_URL/api/v1/admissions/applications?institutionId=$INSTITUTION_ID&page=0&size=20" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/admissions/applications/summary?institutionId=$INSTITUTION_ID" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/admissions/applications/$APPLICATION_ID" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X PUT "$BASE_URL/api/v1/admissions/applications/$APPLICATION_ID" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"applyingClassId\":\"$SCHOOL_CLASS_ID\",\"parentName\":\"Ritu Verma\",\"notes\":\"Updated\"}"
curl -s -X PATCH "$BASE_URL/api/v1/admissions/applications/$APPLICATION_ID/status" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' -d '{"status":"ACCEPTED"}'
curl -s -X POST "$BASE_URL/api/v1/admissions/applications/$APPLICATION_ID/enroll" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"sectionId\":\"$SECTION_ID\",\"admissionNumber\":\"ADM-2026-0002\",\"startDate\":\"2026-04-05\"}"
```

Permissions: `ADMISSION_APPLICATION_CREATE|READ|UPDATE|ENROLL`. Enroll requires
status `ACCEPTED`.

### 6.20 Hostel — `/api/v1/hostels` (+ rooms, allocations)

```bash
curl -s -X POST "$BASE_URL/api/v1/hostels" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"institutionId\":\"$INSTITUTION_ID\",\"campusId\":\"$CAMPUS_ID\",\"code\":\"HST-01\",\"name\":\"Boys Hostel A\",\"hostelType\":\"BOYS\",\"wardenName\":\"Mr. Rao\"}"
curl -s "$BASE_URL/api/v1/hostels?institutionId=$INSTITUTION_ID&page=0&size=20" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X POST "$BASE_URL/api/v1/hostels/$HOSTEL_ID/rooms" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' -d '{"roomNumber":"101","floor":1,"roomType":"DOUBLE","capacity":2}'
curl -s "$BASE_URL/api/v1/hostels/$HOSTEL_ID/rooms?page=0&size=20" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X PUT "$BASE_URL/api/v1/hostels/$HOSTEL_ID/rooms/$HOSTEL_ROOM_ID" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"roomNumber":"101","floor":1,"roomType":"DOUBLE","capacity":3,"version":0}'
curl -s -X POST "$BASE_URL/api/v1/hostels/$HOSTEL_ID/allocations" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"studentId\":\"$STUDENT_ID\",\"roomId\":\"$HOSTEL_ROOM_ID\",\"startDate\":\"2026-04-05\"}"
curl -s "$BASE_URL/api/v1/hostels/$HOSTEL_ID/allocations?page=0&size=20" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X PATCH "$BASE_URL/api/v1/hostels/$HOSTEL_ID/allocations/$ALLOCATION_ID/vacate" \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H 'Content-Type: application/json' -d '{"version":0}'
curl -s -X PATCH "$BASE_URL/api/v1/hostels/$HOSTEL_ID/deactivate" -H "Authorization: Bearer $ACCESS_TOKEN"
```

Permissions: `HOSTEL_CREATE|READ|UPDATE`, `HOSTEL_ROOM_CREATE|READ|UPDATE`,
`HOSTEL_ALLOCATION_CREATE|READ|UPDATE`. Mutations require `version`.

### 6.21 Inventory — `/api/v1/inventory/items`

```bash
curl -s -X POST "$BASE_URL/api/v1/inventory/items" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"institutionId\":\"$INSTITUTION_ID\",\"campusId\":\"$CAMPUS_ID\",\"code\":\"RICE\",\"name\":\"Basmati Rice\",\"category\":\"FOOD\",\"unit\":\"KG\",\"reorderLevel\":50.000}"
curl -s "$BASE_URL/api/v1/inventory/items?institutionId=$INSTITUTION_ID&lowStockOnly=false&page=0&size=20" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X POST "$BASE_URL/api/v1/inventory/items/$ITEM_ID/receipts" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' -d '{"quantity":100.000,"referenceType":"PURCHASE","remarks":"Delivery"}'
curl -s -X POST "$BASE_URL/api/v1/inventory/items/$ITEM_ID/issues" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' -d '{"quantity":10.000,"referenceType":"MESS_MEAL"}'
curl -s -X POST "$BASE_URL/api/v1/inventory/items/$ITEM_ID/wastage" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' -d '{"quantity":2.000,"remarks":"Spoiled"}'
curl -s -X POST "$BASE_URL/api/v1/inventory/items/$ITEM_ID/adjustments" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' -d '{"direction":"IN","quantity":5.000,"remarks":"Stocktake correction"}'
curl -s "$BASE_URL/api/v1/inventory/items/$ITEM_ID/movements?page=0&size=20" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X PATCH "$BASE_URL/api/v1/inventory/items/$ITEM_ID/deactivate" -H "Authorization: Bearer $ACCESS_TOKEN"
```

Permissions: `INVENTORY_ITEM_CREATE|READ|UPDATE`,
`INVENTORY_STOCK_RECEIVE|ISSUE|ADJUST|READ`. Deactivation is blocked (422)
while stock remains; item update requires `version`.

### 6.22 Mess / canteen — `/api/v1/mess/meals`

```bash
curl -s -X POST "$BASE_URL/api/v1/mess/meals" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"institutionId\":\"$INSTITUTION_ID\",\"campusId\":\"$CAMPUS_ID\",\"mealType\":\"LUNCH\",\"servedOn\":\"2026-10-10\",\"headcount\":220,\"notes\":\"Regular lunch\",\"consumptions\":[{\"itemId\":\"$ITEM_ID\",\"quantity\":25.000}]}"
curl -s "$BASE_URL/api/v1/mess/meals?institutionId=$INSTITUTION_ID&page=0&size=20" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/mess/meals/$MEAL_ID" -H "Authorization: Bearer $ACCESS_TOKEN"
```

Requires **both** `MESS_MEAL_CREATE` and `INVENTORY_STOCK_ISSUE`. Creating a meal
issues stock through the inventory ledger (item must have enough quantity and be
active).

### 6.23 Notifications & outbox — `/api/v1/notifications`, `/api/v1/notification-outbox`

```bash
# inbox endpoints: any authenticated user, scoped to that user
curl -s "$BASE_URL/api/v1/notifications/unread-count" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/notifications?page=0&size=20&unreadOnly=false" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X PATCH "$BASE_URL/api/v1/notifications/$NOTIFICATION_ID/read" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X PATCH "$BASE_URL/api/v1/notifications/read-all" -H "Authorization: Bearer $ACCESS_TOKEN"
# outbox admin
curl -s "$BASE_URL/api/v1/notification-outbox/dead?page=0&size=20" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X POST "$BASE_URL/api/v1/notification-outbox/$OUTBOX_EVENT_ID/retry" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/notification-outbox/summary" -H "Authorization: Bearer $ACCESS_TOKEN"
```

Inbox endpoints need only authentication. Outbox admin needs
`NOTIFICATION_OUTBOX_READ` / `NOTIFICATION_OUTBOX_RETRY`. The retry request needs
a real dead event id (from the `/dead` listing).

### 6.24 Documents & certificates — `/api/v1/documents`, `/api/v1/students/{id}/documents`

```bash
curl -s -X POST "$BASE_URL/api/v1/documents/templates" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"institutionId\":\"$INSTITUTION_ID\",\"code\":\"BONAFIDE\",\"name\":\"Bonafide Certificate\",\"body\":\"This certifies {{student_name}} ({{admission_number}}).\"}"
curl -s "$BASE_URL/api/v1/documents/templates?institutionId=$INSTITUTION_ID" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s -X POST "$BASE_URL/api/v1/documents/issue" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"studentId\":\"$STUDENT_ID\",\"institutionId\":\"$INSTITUTION_ID\",\"templateId\":\"$TEMPLATE_ID\",\"title\":\"Bonafide Certificate 2026\"}"
curl -s "$BASE_URL/api/v1/documents/$DOCUMENT_ID" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/students/$STUDENT_ID/documents" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/student-portal/documents" -H "Authorization: Bearer $ACCESS_TOKEN"
```

Permissions: `DOCUMENT_TEMPLATE_CREATE|READ`, `DOCUMENT_ISSUE`, `DOCUMENT_READ`,
`STUDENT_PORTAL_READ` (portal).

### 6.25 Analytics — `/api/v1/analytics`

```bash
curl -s "$BASE_URL/api/v1/analytics/institution-summary?institutionId=$INSTITUTION_ID&fromDate=2026-01-01&toDate=2026-12-31" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Permission `ANALYTICS_READ`, institution scope, range ≤ 366 days.

### 6.26 Student portal — `/api/v1/student-portal/*`

Use a token for a **user account linked to a student** (`STUDENT_PORTAL_READ`).

```bash
curl -s "$BASE_URL/api/v1/student-portal/me" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/student-portal/attendance?from=2026-01-01&to=2026-12-31" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/student-portal/lesson-attendance?from=2026-01-01&to=2026-12-31" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/student-portal/lesson-attendance/summary?from=2026-01-01&to=2026-12-31" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/student-portal/attendance-alerts" -H "Authorization: Bearer $ACCESS_TOKEN"
# (timetable, report-card, assignments, documents are in their own modules above)
```

### 6.27 Parent portal — `/api/v1/parent-portal/*`

Use a token for a **guardian account** (`PARENT_PORTAL_READ`, class-level) whose
guardian is linked to the student.

```bash
curl -s "$BASE_URL/api/v1/parent-portal/students" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/parent-portal/students/$STUDENT_ID" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/parent-portal/students/$STUDENT_ID/attendance?from=2026-01-01&to=2026-12-31" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/parent-portal/students/$STUDENT_ID/lesson-attendance?startDate=2026-01-01&endDate=2026-12-31" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/parent-portal/students/$STUDENT_ID/lesson-attendance/summary?startDate=2026-01-01&endDate=2026-12-31" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -s "$BASE_URL/api/v1/parent-portal/students/$STUDENT_ID/attendance-alerts" -H "Authorization: Bearer $ACCESS_TOKEN"
```

Note the mixed query naming in the parent portal: `from`/`to` for daily
attendance, `startDate`/`endDate` for lesson attendance.

---

## 7. Roles, permissions and access control

- **Authorization is permission-based.** Each endpoint is guarded by
  `@PreAuthorize("hasAuthority('X')")`. The JWT carries the caller's effective
  permission codes at issue time; the filter trusts only those signed claims.
  Failing the permission check returns `403 ACCESS_DENIED`.
- **Organization scope is a second, independent layer** checked in services:
  a user must hold an active organization scope covering the target
  institution/campus. Out-of-scope access also returns `403`.
- **Roles seeded by migrations:** `PLATFORM_ADMIN` (all administrative
  permissions), `GUARDIAN` (`PARENT_PORTAL_READ`), `TEACHER` (assignment,
  lesson-attendance and marks permissions), `STUDENT` (`STUDENT_PORTAL_READ`,
  `ASSIGNMENT_SUBMISSION_CREATE`). `PLATFORM_ADMIN` currently holds ~132
  permission codes.
- **There is no "developer" or "read-only user" role** in the code. If you need a
  read-only principal, create a role, grant only the `*_READ` permissions, assign
  it to a user, and log in as that user. The same applies to any narrower role.
- **Portal endpoints** never trust a client-supplied student id: the acting
  student/guardian is resolved from the authenticated account, and parents must
  have an active authorized relationship with the requested student.
- An **unauthenticated** request to a protected endpoint returns `401` from the
  security filter chain using the servlet default body (not `ErrorResponse`).
  A **permission/scope failure** returns `403` in the `ErrorResponse` shape.

### Permission → module quick map

| Module | Permissions (prefixes) |
|---|---|
| Identity | `USER_*`, `ROLE_*`, `PERMISSION_*` |
| Organization | `ENTERPRISE_*`, `REGION_*`, `CLUSTER_*`, `INSTITUTION_*`, `CAMPUS_*` |
| Students | `STUDENT_CREATE/READ/UPDATE/DEACTIVATE/ACCOUNT_LINK`, `STUDENT_PORTAL_READ` |
| Staff | `STAFF_CREATE/READ/UPDATE` |
| Guardians | `GUARDIAN_*`, `STUDENT_GUARDIAN_LINK/UNLINK` |
| Academic | `ACADEMIC_YEAR_*`, `CLASS_*`, `SECTION_*`, `STUDENT_ENROLL`, `ENROLLMENT_*`, `STUDENT_TRANSFER`, `SUBJECT_*`, `TEACHER_SUBJECT_*` |
| Attendance | `ATTENDANCE_*`, `ATTENDANCE_LESSON_*`, `ATTENDANCE_ALERT_*` |
| Assessment | `ASSESSMENT_CREATE`, `MARKS_*` |
| Timetable | `ROOM_*`, `TIMETABLE_*`, `TEACHER_TIMETABLE_READ`, `SUBSTITUTE_ASSIGN` |
| Homework | `ASSIGNMENT_*` |
| Leave | `STAFF_LEAVE_*`, `STUDENT_LEAVE_*` |
| Discipline | `DISCIPLINE_INCIDENT_*` |
| Calendar | `CALENDAR_EVENT_*` |
| Admissions | `ADMISSION_APPLICATION_*` |
| Hostel | `HOSTEL_*` |
| Inventory | `INVENTORY_ITEM_*`, `INVENTORY_STOCK_*` |
| Mess | `MESS_MEAL_*` + `INVENTORY_STOCK_ISSUE` |
| Notifications | `NOTIFICATION_OUTBOX_*` |
| Documents | `DOCUMENT_*` |
| Analytics | `ANALYTICS_READ` |
| Parent portal | `PARENT_PORTAL_READ` |

---

## 8. Expected responses

**Success.** Read endpoints return the response record (or a Spring Data `Page`
envelope with `content`, `pageable`, `totalElements`, `totalPages`, …). Create
endpoints return either the response record with `201`, a **bare UUID string**,
or a bare integer (see the module notes).

**Errors** use `ErrorResponse` (except the filter-chain `401`):

```json
{
  "timestamp": "2026-01-15T09:30:00+05:30",
  "status": 404,
  "code": "RESOURCE_NOT_FOUND",
  "message": "Student not found",
  "path": "/api/v1/students/..."
}
```

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Bean Validation failure (`field: message` joined) |
| `MALFORMED_REQUEST` | 400 | Unreadable body / wrong parameter type |
| `INVALID_CREDENTIALS` | 401 | Failed login (generic message) |
| `INVALID_REFRESH_TOKEN` | 401 | Unknown/expired/revoked/reused refresh token |
| `ACCESS_DENIED` | 403 | Missing permission or failed scope/ownership check |
| `RESOURCE_NOT_FOUND` | 404 | Missing entity |
| `DUPLICATE_RESOURCE` | 409 | Unique/business duplicate |
| `CONSTRAINT_VIOLATION` | 409 | Database constraint violation |
| `CONCURRENT_MODIFICATION` | 409 | Optimistic/pessimistic lock conflict |
| `BUSINESS_RULE_VIOLATION` | 422 | Service-layer rule violation |
| `TOO_MANY_LOGIN_ATTEMPTS` | 429 | Login rate limit (5 failures / 15 min) |

---

## 9. Coverage, gaps and things to watch

- **No seeded login user.** See §1.1 — you must provision an admin account before
  the authentication requests will succeed.
- **`leaveTypeId` is not exposed by any API.** Staff/student leave creation needs
  a real `leave_type` UUID from the database (codes: `ANNUAL`, `SICK`,
  `PERSONAL`, `UNPAID`).
- **`occurrenceId` is generated, not created directly.** Run
  `POST /api/v1/timetable/occurrences/generate` and then `GET
  /api/v1/timetable/occurrences` to obtain one. Lesson-attendance and substitute
  requests depend on it.
- **Student leave requires an active enrollment** for the student.
- **Portal requests need portal accounts.** `/api/v1/student-portal/*` needs a
  token for a user linked to a student; `/api/v1/parent-portal/*` needs a token
  for a *linked* guardian. Running them with the admin token yields `403` (or
  `404`/empty lists), which is expected.
- **Transfer requires a different target section.** The collection's transfer
  request uses `{{sectionId}}` as a placeholder; replace it with a second
  section id or it will fail with `422`.
- **Version fields.** Mark correction, assignment update/publish, submission
  grade, inventory/hostel updates and admission transitions require the current
  `version` (start at `0` immediately after creation). A wrong value returns
  `409 CONCURRENT_MODIFICATION`.
- **Destructive/state-changing requests.** Deactivate/unlink/complete/withdraw/
  transfer/close requests change state; run them last or against disposable test
  data. The collection groups them so creates come first.
- **`POST /api/v1/auth/change-password`** invalidates the admin password used by
  the other requests.
- **Seed/catalogue data not creatable via API:** `leave_type` (see above) and the
  seeded roles/permissions. Everything else in the collection's create requests
  builds its own prerequisites.
- **Analytics beyond the institution summary is not implemented**; the
  attendance/admissions/outbox "analytics" live in their owning modules and are
  covered there.
- **Notifications outbox retry** only makes sense with a real `DEAD` event from
  `GET /api/v1/notification-outbox/dead`.
- These artifacts were produced by static inspection of the source only; they
  were **not** executed against a running server or database, so runtime
  behaviour (exact error bodies, generated ids) is documented from the code and
  the module READMEs, not observed.
