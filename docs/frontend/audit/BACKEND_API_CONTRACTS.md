# Whale ↔ Dolphin API Contract Audit

## Source of truth

Backend source and module contracts are in `dolphin/src/main/java/com/school/dolphin/**` and `dolphin/docs/api/README.md`. The backend index states that endpoints are under `/api/v1`, authenticated calls use JWT bearer tokens, controller permissions use `@PreAuthorize`, and organization/institution/campus scope is checked in service methods. API contracts must not be inferred from TypeScript alone.

Whale's `frontend/src/lib/api/api-client.ts` uses `VITE_API_BASE_URL` (default `/api/v1`) and appends relative service paths. Services must therefore pass paths without a leading slash or a repeated `/api/v1` prefix.

## Authentication and access context

| Method | Path | Frontend source | Backend source | Contract verified |
|---|---|---|---|---|
| POST | `/api/v1/auth/login` | `features/auth` via `lib/auth/auth-service.ts` | `identity/controller` | See Dolphin `identity/README.md`; JSON token response. |
| POST | `/api/v1/auth/refresh` | `lib/auth/auth-session.ts` | `identity/controller` | Refresh token rotation; request/response shape documented in Dolphin identity README. |
| POST | `/api/v1/auth/logout` | `lib/auth/auth-service.ts` | `identity/controller` | Revokes refresh session. |
| GET | `/api/v1/me/access-context` | Not called by the frontend | Legacy backend endpoint; access context is consumed from login and refresh responses. |

## Organization endpoints used by Whale

`features/organization/api/organization-service.ts` uses these relative paths. Actual controller mappings were verified in Dolphin:

| Method | Full path | Controller | Permission | Scope behavior |
|---|---|---|---|---|
| GET | `/api/v1/enterprises` | `EnterpriseController` | `ENTERPRISE_READ` | Service/controller behavior must remain authoritative. |
| GET | `/api/v1/enterprises/{id}` | `EnterpriseController` | `ENTERPRISE_READ` | Enterprise scope. |
| POST | `/api/v1/enterprises` | `EnterpriseController` | `ENTERPRISE_CREATE` | No parent scope; permission-gated in documented contract. |
| POST | `/api/v1/regions` | `RegionController` | `REGION_CREATE` | Scope over parent enterprise. |
| GET | `/api/v1/regions/{id}` | `RegionController` | `REGION_READ` | Region scope. |
| GET | `/api/v1/regions/by-enterprise/{enterpriseId}` | `RegionController` | `REGION_READ` | Scope over requested enterprise. |
| POST | `/api/v1/clusters` | `ClusterController` | `CLUSTER_CREATE` | Scope over parent region; body contains `regionId`, `code`, `name`. |
| GET | `/api/v1/clusters/{id}` | `ClusterController` | `CLUSTER_READ` | Scope over cluster. |
| GET | `/api/v1/clusters/by-region/{regionId}` | `ClusterController` | `CLUSTER_READ` | Scope over requested region. |
| POST | `/api/v1/institutions` | `InstitutionController` | `INSTITUTION_CREATE` | Scope over parent cluster; body contains `clusterId`, `code`, `name`, `institutionType`. |
| GET | `/api/v1/institutions/{id}` | `InstitutionController` | `INSTITUTION_READ` | Scope over institution. |
| GET | `/api/v1/institutions/by-cluster/{clusterId}` | `InstitutionController` | `INSTITUTION_READ` | Scope over requested cluster. |
| GET | `/api/v1/campuses/{id}` | `CampusController` | `CAMPUS_READ` | Scope over campus. |
| GET | `/api/v1/campuses/by-institution/{institutionId}` | `CampusController` | `CAMPUS_READ` | Scope over requested institution. |

Creation support: cluster and institution creation use the documented `POST /api/v1/clusters` and `POST /api/v1/institutions` contracts. The frontend presents each create action only when its corresponding `*_CREATE` permission is present, injects the currently selected parent ID, and refreshes/selects the created record after success. Institution type is a required text field capped at 50 characters because the contract specifies a maximum length but no enum values.

Important discrepancy: Dolphin's organization contract explicitly documents **no update/deactivate/delete endpoints**, and only read-by-ID plus child lists where shown. Do not add UI mutations for absent endpoints. The hierarchy in the backend README is `Enterprise → Region → Cluster → Institution → Campus` (campus optional), while some older frontend copy may say school/college.

## Leave endpoints used by Whale

Verified against `leave/controller/StaffLeaveController.java`, `StudentLeaveController.java`, and `leave/README.md`:

| Method | Path | Request/response | Permission | Scope |
|---|---|---|---|---|
| GET | `/api/v1/staff-leave?institutionId&status&page&size&sort` | Spring `Page<StaffLeaveResponse>` | `STAFF_LEAVE_READ` | Institution. |
| POST | `/api/v1/staff-leave` | `CreateStaffLeaveRequest` → `StaffLeaveResponse` | `STAFF_LEAVE_CREATE` | Institution. |
| GET | `/api/v1/staff-leave/types?institutionId` | `List<LeaveTypeResponse>` | `STAFF_LEAVE_READ` | Institution. |
| POST | `/api/v1/staff-leave/{id}/approve` | `ReviewStaffLeaveRequest` (`comment`) → response | `STAFF_LEAVE_REVIEW` | Institution. |
| POST | `/api/v1/staff-leave/{id}/reject` | `ReviewStaffLeaveRequest` (`comment`) → response | `STAFF_LEAVE_REVIEW` | Institution. |
| POST | `/api/v1/staff-leave/{id}/cancel` | No body → response | `STAFF_LEAVE_CANCEL` | Institution. |
| GET | `/api/v1/staff-leave/{id}/audit` | `List<StaffLeaveAuditResponse>` | `STAFF_LEAVE_AUDIT_READ` | Institution. |
| GET/POST | `/api/v1/student-leave` | Page/list or `CreateStudentLeaveRequest` | `STUDENT_LEAVE_READ` / `STUDENT_LEAVE_CREATE` | Institution. |
| GET | `/api/v1/student-leave/types?institutionId` | `List<LeaveTypeResponse>` | `STUDENT_LEAVE_READ` | Institution. |
| POST | `/api/v1/student-leave/{id}/approve` or `/reject` | Review comment → response | `STUDENT_LEAVE_REVIEW` | Institution. |
| POST | `/api/v1/student-leave/{id}/cancel` | No body → response | `STUDENT_LEAVE_CANCEL` | Institution. |
| GET | `/api/v1/student-leave/{id}/audit` | Audit list | `STUDENT_LEAVE_AUDIT_READ` | Institution. |

Whale's `leave-service.ts` paths match these controller mappings. Dolphin's list endpoint default page size is 20, while Whale requests `size=50`; this is within the documented max page size of 100. The frontend currently requests only page 0, so it does not expose pagination beyond the first 50 results.

Whale also calls `GET /api/v1/staff` and `GET /api/v1/students` for lookup lists. Verify each feature's permission/scope behavior against `staff/README.md`, `student/README.md`, and the respective controller/service before changing filters or response handling.

## Other frontend feature APIs

The frontend service modules under `frontend/src/features/*/api/*-service.ts` call organization, identity, staff, student, academic, attendance, assessment, timetable, admissions, homework, document/certificate, leave, discipline, hostel, inventory, and parent-portal paths. Their corresponding backend module contract files are:

- `identity/README.md`
- `organization/README.md`
- `staff/README.md`
- `student/README.md`
- `academic/README.md`
- `attendance/README.md`
- `assessment/README.md`
- `timetable/README.md`
- `admissions/README.md`
- `homework/README.md`
- `document/README.md`
- `leave/README.md`
- `discipline/README.md`
- `hostel/README.md`
- `inventory/README.md`
- `parent/README.md`

These contracts must be cross-checked endpoint-by-endpoint before refactoring each service. Do not interpret a module README marked proposed or partially implemented as proof that an endpoint exists; controller source takes precedence.

## Error contract

Dolphin documents `ErrorResponse` with `timestamp`, `status`, `code`, `message`, and `path` for handled application errors; relevant codes include `VALIDATION_ERROR` (400), `ACCESS_DENIED` (403), `RESOURCE_NOT_FOUND` (404), `DUPLICATE_RESOURCE` / `CONSTRAINT_VIOLATION` (409), `BUSINESS_RULE_VIOLATION` (422), and `TOO_MANY_LOGIN_ATTEMPTS` (429). Unauthenticated filter-chain 401 responses may not use this envelope. Whale's API client handles both JSON parsing failures and generic network/timeout errors; UI layers should map status/code to useful messages without hiding backend detail.

## Known gaps in this contract audit

This document verifies the organization and leave calls in depth and identifies the source documents for other frontend modules. A full DTO-by-DTO inventory for every frontend service remains a prerequisite before refactoring those feature services. No endpoint should be added based on this document alone unless its controller and DTO are inspected.
