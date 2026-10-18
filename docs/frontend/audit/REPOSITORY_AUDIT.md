# Dolphin Frontend Repository Audit

**Audit basis:** `Dolphin(3).zip` frontend source, cross-checked against `dolphin(5).zip` backend source and its API contract documentation. This is a static source audit; no application, database, or tests were run.

## Repository and stack

- Frontend root: `frontend/`.
- Build tool: Vite (`frontend/vite.config.ts`).
- UI: React 19, TypeScript 6, React Router 7.
- Data fetching/cache: TanStack Query 5.
- Forms/validation dependencies: React Hook Form, Zod, `@hookform/resolvers`; use in each feature must be confirmed before assuming a common pattern.
- Select control: `react-select`.
- Icons: `lucide-react`.
- IndexedDB dependency: `idb` is installed, but no IndexedDB/service-worker/sync-queue implementation was found in the inspected source tree.
- Scripts: `npm run build` runs `tsc -b && vite build`; `npm run lint` runs `oxlint`; `npm test` runs `vitest run`. Focused Vitest tests now cover attendance draft reconciliation and Timetable tab keyboard behavior.
- The ZIP has no `.git` directory or `node_modules`; repository status and build/test results cannot be verified from this archive.

## Application structure

- Entry: `frontend/src/main.tsx`, `frontend/src/app/App.tsx`.
- Providers: `frontend/src/app/providers.tsx` creates one TanStack Query client and wraps `AuthProvider`.
- Routing: `frontend/src/app/router.tsx`.
- Shell/navigation: `frontend/src/app/AppShell.tsx`.
- Route guards: `ProtectedRoute.tsx`, `PermissionRoute.tsx`, `AnyPermissionRoute.tsx`.
- Auth/API infrastructure: `frontend/src/lib/auth/*`, `frontend/src/lib/api/*`.
- Feature modules each generally have `api/`, `pages/`, and some have `hooks/`, `components/`, and feature CSS.
- Existing feature areas include organization, users, staff, students, academics, attendance, examinations/marks, timetable, admissions, homework, certificates, leave, discipline, hostel, inventory, parent portal, and dashboard.

## Confirmed findings

### P0 — Organization context is implemented repeatedly

`frontend/src/features/organization/pages/OrganizationPage.tsx` owns `dolphin.organization.selection.v1`, validates/parses the stored selection, and persists it. Several feature pages independently read the same key or maintain a different selection convention. Examples include `features/leave/pages/LeaveManagementPage.tsx`, `features/homework/pages/HomeworkPage.tsx`, `features/admissions/pages/AdmissionsPage.tsx`, `features/attendance/pages/AttendancePage.tsx`, `features/certificates/pages/CertificatesPage.tsx`, and `features/users/pages/UserManagementPage.tsx`.

The current implementation has no shared React organization-context provider or single subscription mechanism. This creates duplicated parsing and makes cache invalidation, context changes, and stale-response handling inconsistent. A stored ID must remain a selection hint only; Dolphin performs authorization independently.

### P0 — Large page components carry multiple responsibilities

Measured source sizes include:

| File | Lines |
|---|---:|
| `features/attendance/pages/AttendancePage.tsx` | 1,586 |
| `features/users/pages/UserManagementPage.tsx` | 1,482 |
| `features/examinations/pages/AssessmentManagementPage.tsx` | 1,379 |
| `features/students/pages/StudentDetailPage.tsx` | 1,375 |
| `features/timetable/pages/TimetablePage.tsx` | 1,371 |
| `features/staff/pages/TeacherManagementPage.tsx` | 1,316 |
| `features/admissions/pages/AdmissionsPage.tsx` | 1,227 |
| `features/academics/pages/AcademicSetupPage.tsx` | 1,129 |
| `features/hostel/pages/HostelPage.tsx` | 1,118 |
| `features/discipline/pages/DisciplinePage.tsx` | 1,066 |
| `features/homework/pages/HomeworkPage.tsx` | 1,041 |

These are extraction candidates, not automatic rewrite targets. Each must be traced and split only where responsibilities are independently understandable and testable.

### P1 — Browser-native confirmation/alert calls remain

Found in `features/hostel/pages/HostelPage.tsx`, `features/inventory/pages/InventoryPage.tsx`, `features/attendance/pages/AttendancePage.tsx`, `features/homework/pages/HomeworkPage.tsx`, `features/leave/pages/LeaveManagementPage.tsx`, and `features/certificates/pages/CertificatesPage.tsx`. Replace workflow dialogs incrementally with an accessible shared dialog/notification pattern; do not change the underlying mutation semantics.

### P1 — Vite proxy ignores the documented environment variable

`frontend/vite.config.ts` hardcodes `target: "http://localhost:8080"`, while `frontend/.env.example` and `FRONTEND_SETUP.md` document `VITE_BACKEND_TARGET`. The current proxy therefore does not honor the documented override.

### P1 — Authentication uses sessionStorage

`frontend/src/lib/auth/token-storage.ts` stores access/refresh tokens in `sessionStorage`. `auth-provider.tsx` restores session through refresh, which returns the access context in the same response; `api-client.ts` attaches bearer tokens and retries one request after a 401 through the registered refresh handler. This matches the current JSON-token backend contract, but browser storage remains exposed to same-origin script execution. Do not change the protocol without an explicit backend/security decision.

### P1 — API client normalizes common errors but needs regression coverage

`frontend/src/lib/api/api-client.ts` handles non-2xx responses, JSON error payloads, timeouts, network errors, unexpected response formats, 204 responses, and one refresh retry. It does not have dedicated visible handling here for every backend error category (for example 409/422/429); feature pages often display `Error.message` directly. Standardize presentation without discarding backend error codes or useful messages.

### P1 — Offline-first behavior is not established by source

`idb` is present in dependencies, but no service worker, durable IndexedDB operation queue, or sync engine was found under `frontend/src` or the frontend root in this archive. Local component draft state is not proof of durable offline support. `FRONTEND_SETUP.md` describes local drafts and explicit synchronization, but those claims require verification against implementation.

### P1 — Test/build verification unavailable from this archive

No test/spec files or test script were found in the inspected frontend package. `node_modules` is absent. The audit has not run build, lint, browser tests, or API integration tests. Do not claim a passing build.

### P2 — Documentation is currently empty

The existing files `docs/frontend/ARCHITECTURE.md`, `API_CONTRACTS.md`, `AUTHENTICATION_AND_AUTHORIZATION.md`, `DESIGN_SYSTEM.md`, `IMPLEMENTATION_PLAN.md`, `OFFLINE_FIRST.md`, and `SYNC_DESIGN.md` are zero bytes in the uploaded archive. This audit adds evidence-based audit documents separately under `docs/frontend/audit/` rather than silently treating the existing docs as complete.

## Routing and permissions

`router.tsx` wraps the application shell in `ProtectedRoute` and uses `PermissionRoute`/`AnyPermissionRoute` on protected feature routes. `AppShell.tsx` filters navigation by permissions. These are UX controls only; Dolphin's `@PreAuthorize` checks and service-layer scope checks remain authoritative.

## Responsive/UI observations

`AppShell.tsx` has a mobile navigation-open state, backdrop, close controls, and `aria-expanded` on the menu button. The presence of these controls does not prove every page is usable at 320–430px. Feature CSS is extensive and inconsistent in size; responsive behavior, overflow, touch targets, dialogs, focus handling, and table/card alternatives need per-screen verification.

## Verification limits

- Static inspection only.
- No live backend calls.
- No database access.
- No source files were changed in either repository as part of this audit pass.
- The next code change should be a small organization-context slice, after its current selection behavior and query dependencies are fully mapped.

## Working-copy changes and verification (2026-10-18)

The refactor working copy now centralizes organization selection through `features/organization/hooks/organization-selection.ts` for Organization, Leave, Academic Setup, Timetable, Students, Admissions, Attendance, Attendance Analytics, Assessments, Staff, Inventory, Hostel, Discipline, Certificates, and Homework. User Management no longer adds a selected institution to the scope picker unless the authenticated access context/scope response contains that scope.

`app/providers.tsx` now clears query/mutation cache and cancels in-flight queries when the selected organization hierarchy changes, and clears cache when an authenticated session ends or the user identity changes. These changes require runtime regression testing, particularly to ensure active non-scoped queries refetch appropriately.

Native browser confirmation/alert calls found in Leave, Attendance, Homework, Certificates, Inventory, and Hostel have been replaced with a shared `lib/ui/dialogs.ts` helper backed by the existing SweetAlert2 dependency. The Vite proxy now honors `VITE_BACKEND_TARGET` from the environment.

A syntax transpilation check using the globally available TypeScript compiler completed for 89 active TypeScript/TSX source files with zero syntax diagnostics. `npm run build` remains blocked because the extracted `node_modules` is incomplete and the required `vite/client` and Node type definitions are absent. `npm run lint` remains blocked because `oxlint` is not installed in this execution environment. No production build, full TypeScript check, browser test, or automated test suite is claimed as passed.
