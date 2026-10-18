# Change Set and Verification Record

## Scope

- Changed repository: Dolphin frontend only.
- Reference repository: Dolphin backend, read-only.
- Backend endpoints, DTOs, services, migrations, and permissions were not changed.
- Existing API service files were not modified by this change set.

## Changes

1. Centralized observable organization selection in `frontend/src/features/organization/hooks/organization-selection.ts` and migrated all active feature pages that previously parsed `dolphin.organization.selection.v1` directly.
2. Made Student List and Create Student respond to selection changes; Create Student updates the shared store with the complete institution and campus objects after successful creation.
3. Added query cancellation/cache clearing when the organization hierarchy changes, and cache/selection clearing on logout, session expiration, or user switching (`frontend/src/app/providers.tsx`).
4. Removed User Management logic that inserted the selected institution into available scope options without evidence that the authenticated user's scopes include it.
5. Added shared confirmation/information dialogs in `frontend/src/lib/ui/dialogs.ts`; replaced active browser `window.confirm()`/`window.alert()` calls in Leave, Attendance, Homework, Certificates, Inventory, and Hostel.
6. Loaded SweetAlert2's stylesheet globally in `frontend/src/main.tsx`.
7. Updated `frontend/vite.config.ts` to honor `VITE_BACKEND_TARGET`, falling back to `http://localhost:8080`.
8. Filled the seven previously empty frontend documentation files and added five source-backed audit documents under `docs/frontend/audit/`.

## Static checks performed

- TypeScript syntax transpilation: **passed**, 89 active `.ts`/`.tsx` source files, zero syntax diagnostics.
- Search for active `window.alert()` / `window.confirm()` calls: **none found**.
- Search for feature-level direct organization-selection storage reads: **none found**; the key is read/written by the shared organization-selection store only.
- API service diff review: no existing feature API service file was changed.
- Dolphin source: read-only; no backend files were changed.

## Checks blocked by environment

- `npm run build`: **blocked** because the extracted `node_modules` does not contain `vite/client` and `@types/node`; TypeScript reports TS2688 for both type definitions.
- `npm run lint`: **blocked** because `oxlint` is not installed in the extracted environment.
- `npm ci`: did not complete in the execution environment, so no claim is made that dependencies were installed.
- Automated tests and browser/responsive/accessibility tests: **not run**. The package has no `test` script in the inspected `package.json`.

Syntax transpilation is not a substitute for a full TypeScript typecheck, lint, production build, or runtime verification.

## Remaining high-priority work

1. Install the locked dependencies in the real Dolphin repository and run typecheck/build/lint.
2. Add automated tests for organization changes, session changes, 401/403 behavior, and query-cache isolation.
3. Verify active requests cannot commit stale results in every feature, not just Leave.
4. Decompose the oversized Attendance, Assessment Management, User Management, Timetable, and Student pages into feature-owned components/hooks one page at a time.
5. Complete viewport-by-viewport responsive, keyboard, focus, screen-reader, and dialog tests.
6. Implement offline writes only after Dolphin's existing endpoint contracts provide a safe idempotency/duplicate-prevention and conflict strategy. The current frontend does not claim durable offline synchronization.

## Follow-up refactoring slice — 2026-10-18

Regression and browser tests were explicitly deferred by the project owner. This slice therefore focuses on low-risk responsibility extraction from three oversized feature pages without changing API calls or business workflows.

### Files added
- `frontend/src/features/attendance/pages/attendance-page-utils.ts`: attendance draft type, status labels/options, select styling, date/time formatting, error display, and draft creation helpers.
- `frontend/src/features/users/pages/user-management-utils.ts`: user scope option types, scope formatting, response unwrapping, page-size constant, and initial invitation form state.
- `frontend/src/features/examinations/pages/assessment-management-utils.ts`: assessment select styling, date/number/student formatting, and error display helpers.

### Files changed
- `frontend/src/features/attendance/pages/AttendancePage.tsx`
- `frontend/src/features/users/pages/UserManagementPage.tsx`
- `frontend/src/features/examinations/pages/AssessmentManagementPage.tsx`

### Scope and limitations
- This is a helper/responsibility extraction only. It does not yet split the full page JSX into smaller view components or hooks.
- Existing service calls, endpoint paths, request payloads, and permission checks were not intentionally changed.
- Automated and browser regression tests were skipped as requested.
- A full production build has not been run in this slice; the previously documented missing dependency/type-definition blocker remains unresolved.

### Additional component extraction
- Added `frontend/src/features/attendance/pages/AttendanceFilters.tsx` to own the institution, academic year, class, section, date, and lesson-occurrence filter UI. It receives typed values and callbacks from `AttendancePage`; API access and unsaved-change confirmation remain owned by the page.
- `AttendancePage.tsx` now delegates that filter block to the component. The helper extraction and filter component reduce the page from 1,570 lines in the uploaded baseline to approximately 1,300 lines in this working copy; further roster/history view extraction is still needed.
- A syntax-only TypeScript transpilation check passed for the seven changed/new TS/TSX files. This is not a full type check, build, or regression test.

### Follow-up component extraction — lesson attendance roster

- Added `frontend/src/features/attendance/pages/AttendanceRosterTable.tsx` to own lesson roster row presentation, editable status/remarks controls, and record-history action.
- `AttendancePage.tsx` now coordinates roster data and passes typed values/callbacks to the component; attendance service calls, mutation handling, permission decisions, and draft state remain in the page.
- Added an intentional narrow-screen card layout for the lesson roster while retaining the table presentation on wider screens. Both presentations use the same draft callbacks and existing permissions.
- Added a caption and explicit column scopes to improve table semantics.
- Regression/browser tests remain skipped per instruction. A syntax-only TypeScript transpilation check was run after this change; full typecheck/build remains blocked by unavailable frontend dependencies in this extracted environment.

### Follow-up component extraction — administration and assessments

- Added `frontend/src/features/users/pages/InviteUserDialog.tsx`; invitation form presentation and its controlled inputs are now separated from `UserManagementPage.tsx`. The page retains invitation submission, API interaction, permission checks, and state ownership.
- Added `frontend/src/features/users/pages/UserAccessDialog.tsx`; assigned-role and organization-scope presentation is now separated from `UserManagementPage.tsx`. Assignment/revocation handlers and permission decisions remain in the page.
- Added `frontend/src/features/examinations/pages/AssessmentCreateDialog.tsx`; assessment create/edit form presentation is separated from `AssessmentManagementPage.tsx`. Validation/submission and academic lookup handlers remain in the page.
- Added `frontend/src/features/examinations/pages/AssessmentMarksWorkspace.tsx`; marks-register presentation is separated from `AssessmentManagementPage.tsx`. Existing marks state, API operations, permission decisions, and audit dialog ownership remain in the page.
- The extracted components use the existing page CSS classes and existing API/service behavior. No backend endpoint, DTO, permission, or service was changed.
- Regression and browser tests were skipped as requested. Syntax-only TypeScript transpilation passed for the six touched/new TSX files. Full type checking, lint, production build, and runtime behavior remain unverified because dependencies are not installed in this extracted environment.


## Timetable subjects panel extraction

- Extracted the Subjects tab presentation and its controlled form/table into `frontend/src/features/timetable/components/TimetableSubjectsPanel.tsx`. The page retains data fetching, permission decisions, mutation handlers, and selection state.
- Extracted timetable form controls (`Field`, `Dropdown`, `Empty`) and the React Select styling into `frontend/src/features/timetable/components/TimetableControls.tsx` for reuse within the timetable feature.
- Added an accessible caption to the subject table and a local visually-hidden utility class.
- No API endpoint, DTO, authorization, or backend code was changed.
- Verification for this slice: syntax transpilation only; full type-check/build not run because dependencies are not installed in the extracted archive. Automated and browser regression tests remain skipped per instruction.

## Timetable assignments and rooms panel extraction

- Added `frontend/src/features/timetable/components/TimetableResourcePanels.tsx` with separate `TimetableAssignmentsPanel` and `TimetableRoomsPanel` components.
- `TimetablePage.tsx` continues to own queries, permission checks, form state, mutations, and cache invalidation; the extracted panels receive typed values and callbacks.
- Added accessible captions and scoped column headers to the extracted data tables. Existing API calls, request shapes, and permission behavior are unchanged.
- `TimetablePage.tsx` decreased from 1,374 lines in this archive to 1,145 lines after the Subjects, Assignments, and Rooms panel extractions.
- TypeScript syntax transpilation passed for all 101 active TS/TSX files. `npm run build` was attempted and failed before checking application code because `vite/client` and `node` type definitions are unavailable; the archive does not include installed dependencies. Automated/browser regression tests remain skipped per instruction.

## Timetable time-slots panel extraction — 2026-10-18

- Added `frontend/src/features/timetable/components/TimetableSlotsPanel.tsx` to own time-slot creation form and listing presentation.
- `TimetablePage.tsx` continues to own the slot form state, permission decisions, mutation handler, API interaction, and query invalidation; the panel receives typed values and callbacks.
- Added accessible caption and scoped column headers for the time-slot table. Added client-side prevention of submitting a time slot whose end time is not after its start time; backend validation remains authoritative.
- No backend files, endpoints, DTOs, or authorization rules were changed.
- Automated and browser regression tests remain skipped as requested. Syntax-only TypeScript transpilation is checked across active TS/TSX files; full type-check/build and lint remain unverified because dependencies are not installed in this extracted archive.

## Timetable scheduled-lessons panel extraction — 2026-10-18

- Added `frontend/src/features/timetable/components/TimetableScheduledLessonsPanel.tsx` to own scheduled-lesson form and list presentation, including time-slot, teacher, assigned-subject, and optional-room controls.
- `TimetablePage.tsx` continues to own React Query fetching, permission resolution, form state, create/cancel handlers, confirmation workflow, API calls, and query invalidation. The panel receives typed values and callbacks.
- Preserved sorting by weekday and start time. Added accessible table caption/scoped column headers and a contextual accessible label for each cancellation action.
- Preserved existing API calls and request payloads; no Dolphin/backend code, endpoints, DTOs, or authorization rules were changed.
- Automated and browser regression tests remain skipped as requested. Syntax-only TypeScript transpilation passed across 103 active TS/TSX files with zero syntax diagnostics. Full type-check, production build, and lint were not run because dependencies are not installed in this extracted archive.

## Timetable lesson-occurrences panel extraction — 2026-10-18

- Added `frontend/src/features/timetable/components/TimetableOccurrencesPanel.tsx` to own occurrence generation form presentation, date-range filters, loading/empty/error states, and the occurrences table.
- `TimetablePage.tsx` continues to own the occurrence query, generation permission check, generation handler, API request, success/error reporting, and query invalidation. The panel receives typed values and callbacks.
- Preserved the existing date-range behavior and occurrence sorting. Added an accessible table caption, scoped column headers, and an alert role for occurrence-load errors.
- No Dolphin/backend code, API endpoints, DTOs, service methods, or authorization rules were changed.
- Automated and browser regression tests remain skipped as requested. A syntax-only TypeScript transpilation check was run across active TS/TSX source files; this is not a full type check or production build. Full type-check, production build, and lint remain unverified because project dependencies are not installed in this extracted archive.


### Student list responsibility extraction — 2026-10-18

- Added `frontend/src/features/students/pages/StudentSearchPanel.tsx` to own the institution/campus/search form and its loading, error, and permission-dependent UI. It receives typed organization data and callbacks; it does not call APIs or decide permissions.
- Added `frontend/src/features/students/pages/StudentReactivationDialog.tsx` to own the accessible student-reactivation confirmation dialog. The page continues to own the permission check, mutation, error handling, and query invalidation.
- Updated `StudentListPage.tsx` to coordinate these components. Existing student service calls, query hooks, endpoint paths, and organization-selection behavior were not intentionally changed.
- Automated and browser regression tests remain skipped as requested. Full typecheck/build/lint have not been verified in this extracted environment.

## Student detail profile section extraction

- Added `frontend/src/features/students/components/StudentProfileSections.tsx` to render the personal-information and organization sections of the student detail page.
- Updated `frontend/src/features/students/pages/StudentDetailPage.tsx` to pass the existing student data, permission flags, and institution/campus query results into the extracted component.
- Kept data fetching, permission resolution, API operations, account linking, activation/deactivation handlers, and navigation in the page.
- No backend files or API contracts changed.
- Verification: source was inspected and the extraction was checked for import and JSX consistency. Full TypeScript build, lint, and runtime verification remain unverified; automated/browser regression tests are skipped as requested.

## Student account-access extraction

- Added `frontend/src/features/students/components/StudentAccountAccessPanel.tsx` for linked-account status, account details, loading/error states, and permission-driven entry actions.
- Added `frontend/src/features/students/components/StudentAccountDialogs.tsx` for create-login/retry-link and existing-account search/link dialogs.
- Updated `StudentDetailPage.tsx` to own the queries, permission decisions, form state, create/link mutations, and callbacks while delegating presentation to the new components.
- No backend files, API endpoints, or request/response contracts were changed.
- Verification in this environment is limited to TypeScript syntax transpilation. Full type-check/build and lint were not run because frontend dependencies are not installed. Automated/browser regression tests remain intentionally skipped per the user's instruction.


## Staff onboarding dialog extraction — 2026-10-18

- Added `frontend/src/features/staff/components/TeacherOnboardingDialog.tsx` to own the teacher onboarding form presentation, including personal details, employment details, campus selection, and pending/error messaging.
- Updated `TeacherManagementPage.tsx` to pass controlled form state, selected institution/campus context, permission flags, and callbacks to the dialog. The page retains campus and staff queries, permission decisions, validation/submission workflow, API calls, notification state, and query refresh behavior.
- Existing staff service calls, endpoint paths, request payloads, and backend contracts were not intentionally changed. Dolphin remains read-only.
- Automated/browser regression tests remain skipped as requested. Syntax-only transpilation is used for this slice; full typecheck/build and lint remain unverified because dependencies are not installed in this extracted environment.


## Staff assignment status dialog extraction — 2026-10-18

- Added `frontend/src/features/staff/components/TeacherAssignmentStatusDialog.tsx` to own the assignment-status dialog presentation, current/new status display, terminal-state warnings, and save/cancel controls.
- Updated `TeacherManagementPage.tsx` to pass the selected assignment, allowed status options, pending state, and callbacks into the extracted dialog. The page retains the allowed-transition rules, mutation/API call, notification handling, and refresh behavior.
- Preserved existing staff service calls, request payloads, status-transition restrictions, and backend contracts. Dolphin remains read-only.
- Automated/browser regression tests remain skipped as requested. Source syntax transpilation will be checked for this slice; full type-check/build/lint and runtime behavior remain unverified in this extracted environment.

## Admissions application form extraction — 2026-10-18

- Added `frontend/src/features/admissions/components/AdmissionsApplicationFormPanel.tsx` to own the create/edit application form presentation for applicant details, academic placement, parent/guardian details, notes, and submit/cancel controls.
- Updated `AdmissionsPage.tsx` to pass controlled form state, academic-year/campus/class options, loading state, institution context, and callbacks into the component. The page continues to own permission checks, validation and request construction, API service calls, mutations, notifications, and query invalidation.
- Preserved the existing fields, required constraints, max lengths, edit restrictions for applicant identity fields, and existing admissions API contracts. No Dolphin/backend code or endpoints were changed.
- Automated/browser regression tests remain skipped as requested. Syntax-only TypeScript transpilation is checked for the active source tree; full type-check, production build, and lint remain unverified because project dependencies are not installed in this extracted environment.

## Admissions review panel extraction — 2026-10-18

- Added `frontend/src/features/admissions/components/AdmissionsReviewPanel.tsx` to own application review details, status selection, and save/cancel presentation.
- Updated `AdmissionsPage.tsx` to pass the selected application, status options/labels, formatting callbacks, pending state, and action callbacks into the panel. The page retains permission checks, status-update API calls, mutation handling, and query invalidation.
- Preserved the existing reviewable status list and status-update service contract. No Dolphin/backend code or endpoints were changed.
- Automated/browser regression tests remain skipped as requested. Syntax-only TypeScript transpilation is checked across active source files; full type-check, production build, and lint remain unverified because project dependencies are not installed in this extracted environment.


## Admissions enrollment panel extraction — 2026-10-18

- Added `frontend/src/features/admissions/components/AdmissionsEnrollmentPanel.tsx` to own the enrollment panel presentation, section selection, admission number, start date, section loading/error/empty states, and submit/cancel controls.
- Updated `AdmissionsPage.tsx` to pass the selected accepted application, active section options, controlled form values, query status, and callbacks into the panel. The page retains eligibility checks, section query ownership, enrollment API invocation, request construction, notifications, and query invalidation.
- Preserved the existing enrollment service contract and required fields. The submit control is disabled when required data is unavailable or the section query has failed. No Dolphin/backend code or endpoints were changed.
- Automated/browser regression tests remain skipped as requested. Syntax-only TypeScript transpilation is checked for the active source tree; full type-check, production build, lint, and runtime behavior remain unverified in this extracted environment.


## Teacher assignments table extraction — 2026-10-18

- Added `frontend/src/features/staff/components/TeacherAssignmentsTable.tsx` to own the staff assignment filter, table rows, empty state, loading overlay, and pagination presentation.
- Updated `TeacherManagementPage.tsx` to pass the existing assignments, campus data, permission flags, display helpers, and action callbacks into the component. The page retains organization-scope resolution, data fetching, status-transition rules, permission evaluation, onboarding validation/submission, status mutations, and refresh state.
- Preserved the existing staff service calls, status filter values, pagination bounds, status-change visibility, and empty-state onboarding action. Added a programmatic label for the status selector, table caption/column scopes, and an accessible pagination label.
- No Dolphin/backend files, API endpoints, request payloads, or response contracts were changed. Automated/browser regression tests remain skipped as requested. Syntax-only TypeScript transpilation and ZIP integrity will be checked for this slice; full type-check/build and lint remain unverified because dependencies are not installed in this extracted environment.

## Teacher management overview extraction — 2026-10-18

- Added `frontend/src/features/staff/components/TeacherManagementOverview.tsx` to own the institution context card, missing-institution guidance, assignment metric cards, and onboarding-completion summary.
- Updated `TeacherManagementPage.tsx` to provide the existing institution context, permission-aware counts, status label, onboarding summary, and result-dismiss callback. The page continues to own organization-scope resolution, queries, permission checks, status-transition rules, onboarding/status mutations, validation, notifications, and refresh state.
- Preserved the existing layout order, labels, empty-state behavior, metric values, and onboarding-result content. No Dolphin/backend files, service calls, API endpoints, request payloads, or authorization rules were changed.
- `TeacherManagementPage.tsx` decreased from 769 to 680 lines. Syntax-only TypeScript transpilation passed for all 116 active TS/TSX files with zero syntax errors. `npm run build` was attempted but stopped before checking application code because `vite/client` and `node` type definitions are unavailable in the extracted environment. Lint and full type correctness remain unverified. Automated/browser regression tests remain skipped as requested.


## User directory controls extraction — 2026-10-18

- Added `frontend/src/features/users/pages/UserDirectoryControls.tsx` to own the user-directory metric cards and search/status/organization-scope filter presentation.
- Updated `UserManagementPage.tsx` to pass controlled values and callbacks. Search debounce, pagination resets, scope option construction, selected-scope derivation, permissions, fetching, and account/access mutations remain in the page.
- Preserved existing status options, search placeholder, scope selection behavior, counts, labels, and CSS classes; added explicit label associations for the two React Select controls and accessible section labels.
- No Dolphin/backend files, endpoints, request payloads, response contracts, or authorization rules were changed. Automated/browser regression tests remain skipped as requested. Syntax transpilation and ZIP integrity are checked for this slice; full type-check/build and lint remain unverified in this extracted environment.


## User confirmation dialog extraction — 2026-10-18

- Added `frontend/src/features/users/pages/UserConfirmationDialog.tsx` for the shared user-administration confirmation dialog presentation, including accessible alert-dialog semantics, title/description, cancel action, and saving state.
- Updated `UserManagementPage.tsx` to pass the existing `PendingConfirmation`, saving flag, and cancel callback into the component. Confirmation state, mutation callbacks, permission decisions, error handling, and refresh behavior remain in the page.
- Preserved existing dialog labels, CSS classes, disabled conditions, and confirm callback behavior. No Dolphin/backend files, API contracts, or authorization rules were changed.
- Automated/browser regression tests remain skipped as requested. TypeScript syntax transpilation and ZIP integrity are checked for this slice; full type-check/build and lint remain unverified because dependencies are unavailable in the extracted environment.

## User access role/scope section extraction — 2026-10-18

- Added `UserRoleAssignmentsSection.tsx` and `UserOrganizationScopesSection.tsx` to separate role assignment/revocation presentation and organization-scope assignment/removal presentation from `UserAccessDialog.tsx`.
- Kept role/scope state, available-option derivation, permission flags, API service calls, mutation handling, confirmation workflows, errors, and refreshes in `UserManagementPage.tsx`; the new sections receive typed props and callbacks only.
- Preserved existing role/scope labels, empty states, option search behavior, action visibility, disabled conditions, and service/API contracts. No Dolphin/backend files or authorization rules were changed.
- Automated/browser regression tests remain skipped as requested. TypeScript syntax transpilation and ZIP integrity are checked for this slice; full type-check/build and lint remain unverified because the extracted environment lacks required Vite/Node type definitions and dependencies.

## User directory table extraction — 2026-10-18

- Added `frontend/src/features/users/pages/UserDirectoryTable.tsx` to own the account table, account status presentation, empty state, loading indicator, row actions, and pagination UI.
- Updated `UserManagementPage.tsx` to pass typed account data, page/loading state, existing permission decisions, and callbacks. Account fetching, permission evaluation, access-dialog orchestration, deactivation confirmation/mutation, and pagination state remain in the page.
- Preserved self-deactivation protection, action visibility, disabled conditions, page bounds, labels, and empty-state behavior. Added an accessible table caption, explicit column scopes, and a labeled pagination region.
- No Dolphin/backend files, API endpoints, request payloads, response contracts, or authorization rules were changed. Automated/browser regression tests remain skipped as requested. TypeScript syntax transpilation and ZIP integrity are checked for this slice; full type-check/build and lint remain unverified in this extracted environment.

## Academic organization-scope panel extraction — 2026-10-18

- Added `frontend/src/features/academics/components/AcademicOrganizationScopePanel.tsx` to own the institution selector, current-scope summary, missing-institution guidance, and `INSTITUTION_READ` permission message.
- Reused the existing shared `academic-ui.tsx` exports (`Option`, `selectStyles`, and `FormField`) instead of maintaining duplicate selector styles and field wrappers inside `AcademicSetupPage.tsx`.
- Updated `AcademicSetupPage.tsx` to pass the resolved institution options, selected scope, loading/disabled state, permission context, and existing institution-change callback. Organization selection state, query ownership, permission evaluation, and all academic API/mutation logic remain in the page.
- Preserved the selector options, fallback institution label, disabled conditions, loading behavior, scope note, and guidance messages. No Dolphin/backend files, API endpoints, request payloads, response contracts, or authorization rules were changed.
- Automated/browser regression tests remain skipped as requested. Syntax-only TypeScript transpilation and ZIP integrity are checked for this slice; full type-check/build and lint remain unverified in this extracted environment.

## Academic setup workspace composition — 2026-10-18

- Connected the existing `AcademicYearsPanel`, `AcademicClassesPanel`, `AcademicSectionsPanel`, and `StudentEnrollmentsPanel` components to `AcademicSetupPage.tsx`, replacing duplicated inline workspace JSX with typed component props and callbacks.
- Kept tab visibility/state, organization scope, React Query ownership, permission evaluation, dependent academic selection state, form validation, service/API calls, mutations, notifications, and query invalidation in `AcademicSetupPage.tsx`.
- Preserved create/edit, lifecycle actions, class/section navigation, student search/enrollment, and the existing academic service contracts. The panel components retain presentation-only responsibilities.
- The page now composes the previously defined panels instead of duplicating their presentation inline; `AcademicSetupPage.tsx` decreased from 1,043 to 773 lines. The connected panels also provide explicit table captions/column scopes and avoid rendering cached roster rows when the corresponding read permission is absent.
- No Dolphin/backend files, endpoints, request payloads, response contracts, or authorization rules were changed. Automated/browser regression tests remain skipped as requested. Syntax transpilation and ZIP integrity will be checked for this slice; full type-check/build and lint remain unverified if dependency/type-definition blockers persist.

## Academic setup cleanup and attendance roster composition — 2026-10-18

- Audited `AcademicSetupPage.tsx` after connecting its workspace panels. Fixed missing Lucide icon imports used by the tab configuration and removed the duplicate `canUpdateClass` entry from the tab memo dependencies. These issues were not caught by syntax transpilation alone.
- Connected the existing `AttendanceLessonSummary` and `AttendanceLessonRosterPanel` components to `AttendancePage.tsx`, replacing duplicated inline lesson-summary, roster, draft-summary, history, and save-bar JSX. This also makes the existing `AttendanceHistoryPanel` and `AttendanceDraftStatus` reachable through the roster composition instead of leaving that extracted UI unused.
- Kept React Query ownership, organization selection, permissions, draft reconciliation, audit/user lookups, stale-edit discard logic, save/partial-failure behavior, and cache invalidation in `AttendancePage.tsx`. The extracted components receive typed values and callbacks and do not make API calls.
- Preserved existing labels, loading/empty/error handling, save eligibility, mark-all-present restrictions, audit history details, and the current attendance service contracts. No Dolphin/backend files, endpoints, request payloads, or authorization rules were changed.
- `AttendancePage.tsx` decreased from 1,271 to 996 lines. Syntax transpilation passed across 147 TS/TSX files with zero syntax errors. Full TypeScript build remains blocked before application checking by missing `vite/client` and `node` type definitions; lint was not run. Automated/browser regression tests remain skipped as requested.


## Hostel workspace component integration — 2026-10-18

- Connected the existing `HostelSummaryMetrics`, `HostelRoomsPanel`, and `HostelAllocationsPanel` components to `HostelPage.tsx`, replacing duplicated inline metrics, room table, and allocation table/filter/pagination presentation.
- Kept organization scope, permission evaluation, hostel/room/allocation/student fetching, selected-hostel state, pagination/filter state, form state and validation, service calls, mutations, confirmations, notifications, and refresh behavior in `HostelPage.tsx`. Components receive typed data and callbacks and do not call APIs.
- Preserved existing room/allocation filter defaults, counts, page boundaries, action visibility, loading and permission states, and API contracts. The integrated room and allocation panels also activate their existing responsive mobile-card layouts and accessible table captions/column scopes.
- Removed the now-unused allocation-filter options and `Clock` import from the page. No Dolphin/backend files, endpoints, request payloads, response contracts, or authorization rules were changed.
- Automated/browser regression tests remain skipped as requested. TypeScript syntax transpilation and ZIP integrity are checked for this slice; full type-check/build and lint remain unverified because the extracted environment lacks the required Vite/Node type definitions and dependencies.

## Hostel dialog form extraction — 2026-10-18

- Added `frontend/src/features/hostel/components/HostelDialog.tsx` to own the hostel create/edit, room create/edit, student allocation, and vacate-allocation dialog presentation.
- Added `hostel-dialog-types.ts` for the typed dialog state union. Updated `HostelPage.tsx` to render the dialog component and pass controlled form values, setters, option lists, existing submit handlers, close callback, and display helpers.
- Kept all form state, validation, permission evaluation, API calls, version handling, mutations, notices/errors, refresh behavior, and dialog-opening/reset logic in `HostelPage.tsx`. The extracted component does not call services or make authorization decisions.
- Preserved the existing form fields, constraints, select behavior, occupancy information, student-read-permission guidance, disabled conditions, copy, and submit callbacks. No Dolphin/backend files, endpoints, request payloads, response contracts, or authorization rules were changed.
- Automated/browser regression tests remain skipped as requested. Syntax-only TypeScript transpilation passed for 149 TS/TSX files with zero syntax errors. Full type-check/build and lint remain unverified because required Vite/Node type definitions and installed dependencies are unavailable in this extracted environment.

## Hostel directory panel extraction — 2026-10-18

- Added `frontend/src/features/hostel/components/HostelDirectoryPanel.tsx` to own the hostel directory toolbar, status filter, refresh action, table states/rows, hostel selection actions, and pagination presentation.
- Updated `HostelPage.tsx` to pass the current directory data, selected hostel, loading/permission flags, and callbacks. Filter and pagination state, institution-scoped fetching, selection reset behavior, permission evaluation, edit/deactivation handlers, API calls, and mutations remain in the page.
- Preserved the existing status filter options, selection behavior, action visibility, disabled conditions, pagination labels/bounds, and CSS classes. Added an accessible table caption, column scopes, a labeled status filter, and a loading status role.
- No Dolphin/backend files, endpoints, request payloads, response contracts, or authorization rules were changed. Automated/browser regression tests remain skipped as requested. Syntax transpilation and ZIP integrity are checked for this slice; full type-check/build and lint remain unverified because the extracted environment lacks required Vite/Node type definitions and dependencies.

## Discipline incident register extraction — 2026-10-18

- Added `frontend/src/features/discipline/components/DisciplineIncidentRegister.tsx` to own the incident register filters, search-this-page behavior, result table, loading/empty states, details/status actions, and pagination presentation.
- Updated `DisciplinePage.tsx` to pass the existing incident data, page metadata, filter values/options, permission flag, formatting helpers, and callbacks. Institution-scoped data fetching, filter/pagination state, status transition rules, permission evaluation, detail loading, and all create/status mutation workflows remain in the page.
- Preserved status/severity/student/date filters, client-side current-page search, date bounds, action availability, page boundaries, labels, CSS classes, and service/API contracts. Added a table caption, explicit column scopes, a loading status role, and a pagination region label.
- No Dolphin/backend files, endpoints, request payloads, response contracts, or authorization rules were changed. Automated/browser regression tests remain skipped as requested. Syntax transpilation and ZIP integrity are checked for this slice; full type-check/build and lint remain unverified because the extracted environment lacks required Vite/Node type definitions and dependencies.


## Discipline incident dialog extraction — 2026-10-18

- Extracted the incident details and status-update dialogs from `DisciplinePage.tsx` into `DisciplineIncidentDialogs.tsx`.
- Kept selected incident state, detail loading, allowed transition policy, status selection state, submit handler, API mutation, notifications, and register refresh in `DisciplinePage.tsx`; the component receives typed values and callbacks.
- Preserved existing labels, overlay-click close behavior, status options, loading state, and disabled-submit conditions. No backend files or API contracts changed.
- Syntax transpilation and archive integrity checks are run for this snapshot. Full application type-check/build remains blocked in this extracted environment by missing `vite/client` and `node` type definitions. Automated/browser regression tests remain skipped as requested.


## Discipline incident creation form extraction — 2026-10-18

- Added `frontend/src/features/discipline/components/DisciplineIncidentCreateForm.tsx` for the controlled incident-creation form and its student, category, severity, date, and description fields.
- `DisciplinePage.tsx` retains create-form state, student loading, permission checks, validation, request construction, API mutation, notices/errors, and refresh behavior. The extracted form receives values and callbacks only.
- Preserved the existing labels, React Select behavior, date maximum, 2,000-character limit, disabled submit conditions, and cancel/reset behavior. No backend files, API endpoints, DTOs, or authorization rules were changed.
- TypeScript syntax transpilation passed for 153 active TS/TSX files with zero syntax diagnostics. Full build/type-check remains blocked by unavailable `vite/client` and `node` type definitions in the extracted environment. Automated/browser regression tests remain skipped as requested.


## Homework submission review extraction — 2026-10-18

- Added `frontend/src/features/homework/components/HomeworkSubmissionReview.tsx` for the submission review panel, submission rows, grading form presentation, loading/error/empty states, and submission pagination.
- Updated `HomeworkPage.tsx` to compose the review component with typed submission data and callbacks. Submission query ownership, permission evaluation, selected assignment/submission state, grade validation, grading mutation, cache invalidation, and page state remain in the page.
- Preserved the current labels, grade form limits, status badges, submission metadata, loading/error behavior, page bounds, and existing CSS class names. No Dolphin/backend files or API contracts were changed.
- TypeScript syntax transpilation and ZIP integrity are checked for this snapshot. Full application type-check/build remains blocked by missing `vite/client` and `node` type definitions in the extracted environment. Automated/browser regression tests remain skipped as requested.

## Homework student assignment details extraction — 2026-10-18

- Added `frontend/src/features/homework/components/StudentAssignmentDetails.tsx` for the selected student's assignment details, current-submission summary, grading result/feedback display, response editor, and submit/close controls.
- Updated `HomeworkPage.tsx` to compose the detail component with typed assignment/submission values and callbacks. Student submission fetching, dirty-response detection, discard confirmation, before-unload protection, submit validation/mutation, permission checks, and query-cache invalidation remain in the page.
- Preserved existing text limits, graded-submission restrictions, permission messaging, loading/error states, save feedback, date formatting, and close/discard behavior. No Dolphin/backend files or API contracts were changed.
- Automated/browser regression tests remain skipped as requested. Syntax transpilation and ZIP integrity are checked for this slice; full type-check/build and lint remain unverified because the extracted environment lacks required Vite/Node type definitions and dependencies.

## Homework assignment form extraction — 2026-10-18

- Added `frontend/src/features/homework/components/HomeworkAssignmentForm.tsx` for the create/edit draft form, academic year/class/section selectors, assignment fields, academic-structure loading/errors, and form actions.
- Updated `HomeworkPage.tsx` to compose the form using controlled values and callbacks. Draft creation/update mutations, payload construction, validation, query ownership, permission evaluation, academic queries, and open/reset behavior remain in the page.
- Preserved the existing field limits, select behavior, loading/error messages, labels, and submit/close actions. No Dolphin/backend files, endpoints, DTOs, or authorization rules were changed.
- Syntax transpilation and archive integrity are checked for this snapshot. Full application type-check/build remains blocked by missing `vite/client` and `node` type definitions in the extracted environment. Automated/browser regression tests remain skipped as requested.

## Homework assignment library extraction — 2026-10-18

- Added `frontend/src/features/homework/components/HomeworkAssignmentLibrary.tsx` for assignment result counts, assignment cards, deadline badges, draft edit/publish/submission actions, empty state, and assignment pagination.
- Updated `HomeworkPage.tsx` to compose the library with typed page data and callbacks. Assignment query ownership, status-filter state, permission evaluation, edit-form state, publish confirmation/mutation, submission-review selection, and pagination state remain in the page.
- Preserved the existing assignment card metadata, status/deadline labels, publish confirmation wording, action visibility, empty-state copy, page boundaries, and CSS classes. No Dolphin/backend files, endpoints, request payloads, response contracts, or authorization rules were changed.
- Automated/browser regression tests remain skipped as requested. Syntax-only TypeScript transpilation and ZIP integrity are checked for this snapshot. Full type-check/build and lint remain unverified because the extracted environment lacks required Vite/Node type definitions and dependencies.


## Student assignment library extraction — 2026-10-18

- Added `StudentAssignmentLibrary.tsx` to own the student-facing assignment cards, deadline badges, empty state, and pagination presentation.
- `HomeworkPage.tsx` continues to own student workspace permissions, query state, selected assignment, discard confirmation, unsaved response resets, and page state updates. The component receives assignment data and typed callbacks; it does not fetch data or mutate server state.
- Kept existing assignment labels, deadline semantics, status badge classes, selection highlighting, and pagination bounds/disabled conditions.
- No Dolphin backend files or API contracts were changed.
- Verification: TypeScript syntax transpilation and ZIP integrity are checked for this slice. Full production build/type-check remains blocked in the extracted environment by missing `vite/client` and `node` type definitions. Browser regression tests remain skipped as requested.


## Inventory register presentation integration — 2026-10-18

- Connected the existing `InventoryItemsList` component to `InventoryPage.tsx` for inventory rows, loading/permission/empty states, responsive desktop/mobile item presentation, and item action buttons.
- Kept category/status/low-stock filters, current-page search, pagination, permission evaluation, details fetching, edit state, stock-movement workflow, deactivation confirmation, service calls, and refresh behavior in `InventoryPage.tsx`. The list receives filtered data and typed callbacks only.
- Preserved the page-level pagination, filter state, current action permissions, item-detail opening, stock movement opening, and deactivation guard. The extracted list uses the existing inventory CSS classes and adds its already-defined responsive mobile-card layout.
- No Dolphin/backend files, endpoints, request payloads, response contracts, or authorization rules were changed. Automated/browser regression tests remain skipped as requested. Syntax transpilation and ZIP integrity are checked for this slice; full type-check/build and lint remain unverified because the extracted environment lacks required Vite/Node type definitions and dependencies.

### Inventory dialogs and movement history composition — 2026-10-18

- Integrated the existing `InventoryStockMovementForm`, `InventoryItemDetailsDialog`, and `InventoryMovementHistoryPanel` components into `InventoryPage.tsx`, replacing the corresponding inline dialog JSX.
- Kept movement permission filtering, selected-item state, movement queries, pagination/filter state, submission handlers, validation, notifications, and cache/list refresh behavior in `InventoryPage.tsx`.
- Kept the item-details loading request and its state owner in the page; the dialog only renders the selected item and loading state.
- The stock movement history component retains its responsive desktop/mobile presentation and receives typed data and callbacks from the page.
- No Dolphin backend files, API contracts, or inventory service files were changed.
- `InventoryPage.tsx` decreased from 865 to 758 lines.
- Full build remains blocked in this extracted environment by missing `vite/client` and `node` type definitions; browser regression tests remain skipped as requested.

### Follow-up refactor — inventory item form integration — 2026-10-18

- Integrated the existing `InventoryItemFormPanel.tsx` into `InventoryPage.tsx` for item creation and editing.
- The page continues to own the form state, create/update validation and payload construction, permission gating, API mutations, notifications, and refresh behavior. The component receives controlled values and callbacks only.
- Preserved the existing close-vs-cancel behavior: close hides the form; cancel hides the form and resets the draft.
- No Dolphin backend files, API service files, endpoints, or request contracts were changed.
- Automated/browser regression tests remain skipped as requested. Syntax-only transpilation and ZIP integrity checks are performed for this archive; full typecheck/build remains blocked by missing `vite/client` and `node` type definitions in the extracted environment.

## Certificate template library extraction — 2026-10-18

- Added `frontend/src/features/certificates/components/CertificateTemplateLibrary.tsx` for the active-template count, empty state, template cards, and the permission-gated “Use this template” action.
- `CertificatesPage.tsx` retains template query/loading/error ownership, permission checks, template selection, document-title initialization, and issue-error reset. The extracted component receives the loaded templates and a typed callback; it does not fetch data or decide authorization.
- Preserved existing template labels, card styling classes, active badges, and template-selection behavior. No Dolphin/backend code, API contracts, endpoints, DTOs, or authorization rules were changed.
- Automated/browser regression tests remain skipped as requested. Syntax-only TypeScript transpilation is used for a basic syntax check; it is not a full type check or production build. Full build/type-check remains blocked in this extracted environment by missing `vite/client` and `node` type definitions.


## Certificate student picker extraction — 2026-10-18

- Added `CertificateStudentPicker.tsx` for the student search field, active-student results, selected-student summary, loading/error/empty presentation, and selection callbacks.
- Integrated the picker into `CertificatesPage.tsx`; query configuration, permission gating, student selection state, and issue workflow remain owned by the page.
- Preserved the minimum two-character search threshold, active-student-only results, selected-student highlighting, and existing labels and CSS classes.
- No backend files or API contracts changed.
- Validation: TypeScript syntax transpilation and ZIP integrity checked; full build/type-check remains blocked by missing `vite/client` and `node` type definitions in this environment. Browser regression tests remain skipped as requested.

## Issued document list reuse — 2026-10-18

- Added `frontend/src/features/certificates/components/IssuedDocumentList.tsx` to share the issued-document row presentation and View, Print / PDF, and Download text actions between the management student-record view and the authenticated student portal.
- Integrated the reusable list in `CertificatesPage.tsx`. Query ownership, permission gating, selected-document state, student-specific error clearing, printing, text download, and preview rendering remain in their existing owners.
- Preserved existing labels, row styling, issued-date formatting, and the difference between the management view callback (which clears the student-document error) and the student portal view callback.
- No Dolphin/backend files or API contracts changed. Automated/browser regression tests remain skipped as requested. Syntax-only transpilation and ZIP integrity are checked; full build/type-check remains blocked by missing `vite/client` and `node` type definitions in this extracted environment.

## Certificate template preview extraction — 2026-10-18

- Moved the template-only preview presentation into `frontend/src/features/certificates/components/TemplatePreview.tsx` and integrated it from `CertificatesPage.tsx`.
- The page continues to own preview visibility and template draft values. Sample placeholder substitution, sample values, preview labels, close behavior, and existing CSS classes are preserved in the extracted presentation component.
- The issued-document preview and print/download workflows remain separate and unchanged; no backend/API contracts or permission decisions changed.
- Automated/browser regression tests remain skipped as requested. Syntax-only TypeScript transpilation and ZIP integrity are checked; full build/type-check remains blocked by missing `vite/client` and `node` type definitions in this extracted environment.

## Certificates template form extraction — 2026-10-18

- Added `frontend/src/features/certificates/components/CertificateTemplateForm.tsx` for the controlled template-code, name, body, supported-placeholder guide, error display, preview toggle, and save/cancel controls.
- Integrated the form in `CertificatesPage.tsx` using typed values and callbacks. Template draft state, input validation, create-template mutation, permission gating, institution checks, success reset, and query invalidation remain in the page.
- Preserved field limits, required fields, error styling, preview toggle behavior, and close/cancel behavior. The template preview remains a separate component.
- No backend files, API contracts, or permission rules were changed.
- Verification: syntax-only TypeScript transpilation and ZIP integrity check. Full type-check/build remains blocked by missing `vite/client` and `node` type definitions. Lint and browser regression tests were not run as requested.

## Certificate issuance form extraction — 2026-10-18

- Added `frontend/src/features/certificates/components/CertificateIssueForm.tsx` to own the issuance workflow's presentational JSX, student picker integration, template/title controls, error/success states, and submit-button availability display.
- `CertificatesPage.tsx` retains permission evaluation, institution selection, student/template query ownership, controlled state, template-title synchronization, validation, issue mutation, notifications, and query invalidation.
- The new component receives typed values and callbacks; it does not call APIs, query hooks, or evaluate authorization.
- Preserved existing labels, help text, form IDs, input limits, empty/loading/error presentation, and submit enablement conditions.
- No backend/API contract changes.
- Verification: TypeScript syntax transpilation and archive integrity checks; full production build remains blocked by missing `vite/client` and `node` type definitions. Browser regression tests remain skipped by request.

## Issued-document preview and export extraction — 2026-10-18

- Added `frontend/src/features/certificates/components/IssuedDocumentPreview.tsx` to own the issued-document preview UI, date formatting used by that preview/export flow, browser print / Save as PDF rendering, and text-file download behavior.
- Integrated the component in `CertificatesPage.tsx` and passed the exported print/download handlers to `IssuedDocumentList` in both management and student views.
- Kept `activeDocument` selection and close state in `CertificatesPage.tsx`; query ownership, permissions, issuance mutations, and cache invalidation remain unchanged.
- Preserved existing preview text, print layout and timing, pop-up-blocked message, filename sanitization, text content, button labels, and existing CSS classes. No backend/API contract changes.
- `CertificatesPage.tsx` decreased from 677 to 462 lines. This is a presentation/export boundary, not a change to document generation: the current backend still provides rendered text and the browser print dialog is the PDF path.
- Verification: TypeScript syntax transpilation passed for 165 TS/TSX files with zero diagnostics; ZIP integrity checked. `npm run build` was attempted and remains blocked before application type-checking because `vite/client` and `node` type definitions are missing in the extracted environment. Browser regression tests remain skipped as requested.

## Assessment register presentation integration — 2026-10-18

- Integrated the existing `AssessmentRegisterFilters.tsx` and `AssessmentRegisterTable.tsx` into `AssessmentManagementPage.tsx`, replacing duplicate inline date-filter and register-table/pagination JSX.
- Kept assessment query ownership, permission evaluation, filter and pagination state, edit dialog state, roster loading, mark validation, mark mutations, and refresh behavior in the page. Extracted components receive typed data and callbacks only.
- Preserved date range constraints, page reset on filter changes/clear, refresh availability, empty/loading/permission states, edit/view-marks action conditions, and pagination boundaries. The table retains its accessible caption and scoped column headers.
- No Dolphin/backend files, endpoints, request payloads, response contracts, or authorization rules were changed.
- Automated/browser regression tests remain skipped as requested. Syntax-only TypeScript transpilation and ZIP integrity are checked for this slice. Full build/type-check and lint remain unverified if the extracted environment lacks required dependencies/type definitions.


## Assessment roster table integration — 2026-10-18

- Integrated the existing `AssessmentRosterTable.tsx` into `AssessmentMarksWorkspace.tsx`, replacing the duplicate inline roster table presentation.
- The workspace derives a lookup map from the loaded results and passes roster data, drafts, permission flags, save/edit callbacks, and audit selection through typed props. Mark mutations, validation, permission decisions, concurrency/version handling, and API operations remain owned by `AssessmentManagementPage.tsx`.
- Preserved marks/remarks editing, per-student save and cancel behavior, history action visibility, disabled-state conditions, and the empty-roster state. The reused component also supplies an accessible table caption and scoped column headers.
- No Dolphin/backend files, API contracts, or authorization rules changed. Automated/browser regression tests remain skipped as requested. Syntax-only transpilation and ZIP integrity checks are run for this slice; full build/type-check may remain blocked by missing `vite/client` and `node` type definitions in the extracted environment.

## Admissions application register extraction — 2026-10-18

- Added `frontend/src/features/admissions/components/AdmissionsApplicationRegister.tsx` for the admissions table rows, row actions, filtered-results state, and pagination controls.
- Integrated the register into `AdmissionsPage.tsx`. Query ownership, filter and pagination state, permission checks, edit/review/enroll handlers, mutations, and cache invalidation remain in the page; the component receives typed data and callbacks only.
- Preserved the existing row content, date/status formatting, action visibility, busy-state disabling, enrollment indicator, current-page search result message, and pagination boundaries. Added explicit column scopes to table headers.
- No Dolphin/backend files, API contracts, endpoints, or authorization rules were changed. Automated/browser regression tests remain skipped as requested.
- Verification for this slice: TypeScript syntax transpilation and ZIP integrity check. Full build/type-check remains blocked in this extracted environment by missing `vite/client` and `node` type definitions.

## Daily attendance presentation integration — 2026-10-18

- Integrated the existing `DailyAttendanceToolbar.tsx`, `DailyAttendanceFilters.tsx`, `DailyAttendanceRoster.tsx`, and `DailyAttendanceSaveBar.tsx` into `DailyAttendancePanel.tsx`, replacing duplicated inline toolbar, filter, responsive roster, and save-bar JSX.
- `DailyAttendancePanel.tsx` remains the owner of enrollment/record queries, date-overlap filtering, local drafts and undo state, dirty-state notification, future-date protection, permission-based row editing, validation, mark/update requests, partial-failure handling, and query invalidation.
- Preserved mobile status cycling, desktop explicit status selection, remarks expand/collapse and Escape behavior, undo, mark-all-present, refresh disabled state when no section is selected, status filters/counts, and save-button conditions. The extracted roster's accessible caption and scoped headers remain in place.
- No Dolphin/backend files, API contracts, endpoints, payloads, or authorization rules were changed. Automated/browser regression tests remain skipped as requested. Syntax-only TypeScript transpilation and ZIP integrity are checked; full build/type-check remains blocked by missing `vite/client` and `node` type definitions in the extracted environment.

## Attendance analytics filter panel extraction — 2026-10-18

- Added `AttendanceAnalyticsFilters.tsx` to own the report-filter panel presentation: institution, academic year, class, section, date range, low-attendance threshold, validation note, and filter-panel error display.
- Integrated the component into `AttendanceAnalyticsPage.tsx` through typed values and callbacks. Query ownership, permission checks, organization selection, cascading filter resets, report date validation, and CSV export remain in the page.
- Preserved the existing labels, options, select disabled conditions, date min/max constraints, error styling, and explanatory text.
- No backend files or API contracts changed.
- Verification: TypeScript syntax transpilation and ZIP integrity checks run for this slice. Full application type-check/build remains blocked in this extracted environment by missing `vite/client` and `node` type definitions. Browser regression tests remain skipped as requested.

## Attendance analytics results presentation extraction — 2026-10-18

- Added `AttendanceAnalyticsResults.tsx` with reusable presentation components for attendance summary metrics, section/subject breakdown tables, and student attendance tables.
- Integrated the results components into `AttendanceAnalyticsPage.tsx`; summary aggregation, React Query ownership, permission checks, selected organization and filters, CSV row construction, spreadsheet-formula escaping, and file download remain in the page.
- Preserved existing metrics, weighted attendance-rate calculation, loading/error/empty states, table columns, rate bars, row keys, labels, and CSS classes. No backend/API contract changes.
- `AttendanceAnalyticsPage.tsx` decreased from 669 to 457 lines.
- Verification: TypeScript syntax-only transpilation and ZIP integrity check. Full build/type-check remains blocked by missing `vite/client` and `node` type definitions in the extracted environment. Browser regression tests remain skipped as requested.

## Attendance page header and feedback extraction — 2026-10-18

- Added `frontend/src/features/attendance/pages/AttendancePageHeader.tsx` for the Attendance page heading, daily/lesson mode switch, query error/reload alert, success notice, and form error presentation.
- Updated `AttendancePage.tsx` to pass permission-derived mode visibility, current mode, feedback text, and callbacks. The page retains mode-change confirmation, unsaved-draft discard/reset behavior, permission evaluation, query ownership, and all attendance workflows.
- Preserved mode labels, pressed states, alert roles, reload behavior, and existing CSS classes. No Dolphin backend files or API contracts were changed.
- Automated/browser regression tests remain skipped as requested. Syntax-only TypeScript transpilation is checked for the active source tree; full type-check/build/lint and runtime behavior remain unverified because the extracted environment lacks the `vite/client` and `node` type definitions.


## Timetable organization scope extraction — 2026-10-18

- Added `frontend/src/features/timetable/components/TimetableOrganizationScope.tsx` for the institution, academic year, class, and section selector panel plus its contextual empty guidance.
- Updated `TimetablePage.tsx` to compose the scope panel using typed values and callbacks.
- Kept query ownership, permission evaluation, option derivation, cascading selection resets, and message clearing in `TimetablePage.tsx`.
- Preserved existing labels, disabled conditions, loading indicators, contextual guidance, and CSS classes.
- No backend files or API contracts changed.
- Verification: TypeScript syntax transpilation and ZIP integrity checks are performed for this slice; full production build remains blocked by unavailable `vite/client` and `node` type definitions in this extracted environment. Browser regression tests remain skipped as requested.

## Timetable page feedback and tab navigation extraction — 2026-10-18

- Added `TimetablePageAlerts.tsx` for page-level operation errors, success notices, dashboard query errors, dismiss actions, and the existing retry callback.
- Added `TimetableTabs.tsx` for the permission-filtered timetable tab navigation, active-tab presentation, accessible tab roles, and selection callback.
- Integrated both into `TimetablePage.tsx`. The page retains permission-derived tab visibility, active-tab fallback, message clearing, query invalidation, all queries, and timetable operations.
- Preserved alert roles, labels, tab IDs, icons, CSS classes, retry query key, and tab-switch behavior. No backend files or API contracts changed.
- Verification: syntax-only TypeScript transpilation and ZIP integrity check. Full build/type-check remains blocked by missing `vite/client` and `node` type definitions in the extracted environment; browser regression tests remain skipped as requested.

## Student status confirmation dialog extraction — 2026-10-18

- Added `frontend/src/features/students/components/StudentStatusConfirmationDialogs.tsx` to render the student reactivation and deactivation confirmation dialogs.
- Integrated the component into `StudentDetailPage.tsx` using typed state props and callbacks. The page retains status permission checks, dialog open/close state, error mapping, confirmation handlers, and activation/deactivation mutations.
- Preserved dialog copy, accessible labels and descriptions, error alerts, loading/disabled states, CSS classes, and confirmation actions. No backend files or API contracts changed.
- Verification: syntax-only TypeScript transpilation and ZIP integrity check. Full production build/type-check remains blocked by missing `vite/client` and `node` type definitions in this extracted environment. Browser regression tests remain skipped as requested.

## Parent Portal attendance sections extraction — 2026-10-18

- Added `frontend/src/features/parent-portal/components/ParentPortalComponents.tsx` for shared status/date formatting, loading/error/empty presentation, panel framing, selected-student summary, and attendance-alert presentation.
- Added `frontend/src/features/parent-portal/components/ParentAttendanceHistory.tsx` for daily attendance and lesson history sections, including their local search/filter/sort/pagination UI and state.
- Updated `ParentPortalPage.tsx` to compose these components. The page continues to own linked-student selection, React Query configuration, date-range validation, refresh behavior, summary calculations, CSV generation/download, and all service calls.
- Preserved existing labels, CSS classes, row/status formatting, date-range limits, filter semantics, sort order, page sizes, and CSV formula-injection protection. No backend/API contracts or authorization behavior changed.
- `ParentPortalPage.tsx` decreased from 843 to 355 lines. Syntax-only TypeScript transpilation passed for 175 TS/TSX files with zero diagnostics; ZIP integrity checked. Full type-check/build remains blocked by missing `vite/client` and `node` type definitions in the extracted environment. Browser regression tests remain skipped as requested.

## Parent Portal filter panel extraction — 2026-10-18

- Added `frontend/src/features/parent-portal/components/ParentPortalFilters.tsx` for the linked-student selector, draft date-range controls, quick-range buttons, and date-range validation feedback.
- Integrated the component into `ParentPortalPage.tsx` with typed values and callbacks. Student selection synchronization, applied date-range state, range validation logic, query enabling, refresh behavior, and all service calls remain in the page.
- Preserved the 90-day maximum, future-date restriction, start/end ordering, quick ranges (7/30/90 days), loading/error/empty selector states, existing labels, accessible alert and button labels, and CSS classes.
- No backend files, API contracts, or authorization behavior changed. Browser regression tests remain skipped as requested. Syntax-only TypeScript transpilation and ZIP integrity are checked; full build/type-check remains blocked by missing `vite/client` and `node` type definitions in the extracted environment.

## Parent Portal attendance summary extraction — 2026-10-18

- Added `frontend/src/features/parent-portal/components/ParentAttendanceSummary.tsx` for the attendance-rate progress indicator and attended/missed/excused lesson metrics.
- Updated `ParentPortalPage.tsx` to render the summary component with the existing typed summary response. Query loading/error handling, query ownership, selected-student/date-range state, calculations, and CSV export remain in the page.
- Preserved the existing metric values, number/percentage formatting, progress clamping, labels, icons, and CSS classes. Added a descriptive accessible label to the summary section.
- No backend files, API contracts, or authorization behavior changed. Browser regression tests remain skipped as requested. Syntax-only TypeScript transpilation and ZIP integrity are checked; full build/type-check remains blocked by missing `vite/client` and `node` type definitions in the extracted environment.

## Organization enterprise creation form extraction — 2026-10-18

- Added `frontend/src/features/organization/components/EnterpriseCreateForm.tsx` to isolate the create-enterprise form and its presentation states (open trigger, controlled code/name fields, error message, and cancel/submit actions).
- Updated `OrganizationPage.tsx` to compose the form through typed props and callbacks. Enterprise permission evaluation, field validation, mutation execution, success/refetch behavior, selection updates, and form state remain in the page.
- Preserved field limits, autocomplete values, placeholders, button labels, pending-state disabling, error wording, and reset behavior on cancel. No backend files or API contracts changed.
- Verification: syntax-only TypeScript transpilation and ZIP integrity check. Full production build/type-check remains blocked by missing `vite/client` and `node` type definitions in this extracted environment. Browser regression tests remain skipped as requested.


## Organization hierarchy selection summary extraction — 2026-10-18

- Added `frontend/src/features/organization/components/OrganizationSelectionSummary.tsx`, a typed presentation component that consolidates the repeated selected-cluster, selected-institution, and selected-campus summary layout.
- Reduced `OrganizationPage.tsx` from 624 to 577 lines. Kept each hierarchy level's conditional visibility, entity-specific detail route, selected entity state, and institution-type display decision in the page. The shared component only renders the supplied presentation props.
- Preserved summary CSS classes, icon sizes, labels, detail-link labels, status wording, and code/type/status separators. No backend files, API contracts, or authorization behavior changed.
- Verification: syntax-only TypeScript transpilation passed for 179 TypeScript/TSX files with zero diagnostics; ZIP integrity check passed. Full production build/type-check remains blocked in this extracted environment by missing `vite/client` and `node` type definitions. Browser regression tests remain skipped as requested.


## Build and offline/responsive audit follow-up — 2026-10-18

### Build investigation

- Inspected `frontend/package.json`, `frontend/package-lock.json`, `frontend/tsconfig.json`, `frontend/tsconfig.app.json`, `frontend/tsconfig.node.json`, and `frontend/vite.config.ts` in the latest cumulative archive.
- The lockfile pins Vite `8.3.4` and `@vitejs/plugin-react` `6.1.2`, both declaring Node support `^20.19.0 || >=22.12.0`. The execution environment is Node `v22.16.0`, so the observed runtime meets these package engine requirements.
- `@types/node` and Vite are declared in both the manifest/lockfile. The missing type definitions are consistent with the absent/incomplete dependency installation, not evidence that TypeScript configuration should be weakened.
- Retried `npm ci --no-audit --no-fund --prefer-online`. Package fetches failed with `EAI_AGAIN` while resolving `registry.npmjs.org`; installation did not complete. No dependency versions or TypeScript settings were changed to work around the environment failure.
- The archive contains no `.git` metadata. Git status/history-based recovery is therefore unavailable in this extracted workspace.

### Offline-first audit

- No service-worker registration, PWA/Workbox setup, `navigator.onLine` listener, IndexedDB/openDB usage, or durable sync queue existed in the active frontend source. The `idb` package is declared but not used by application source.
- Attendance and marks drafts are held in React state; they are not durable across refresh. The existing API client reports network errors and does not queue writes.
- The documented attendance create/update and assessment marks create/update endpoints do not document an idempotency key, version precondition, or conflict contract in the inspected frontend API contract. Offline write replay remains blocked until the existing backend contract is verified or an explicitly authorized backend contract is supplied.
- Added `frontend/src/app/NetworkStatusIndicator.tsx` and integrated it into `AppShell.tsx`. It reports browser connectivity and warns that unsaved edits are not durably stored. It does not claim server reachability or synchronization.

### Responsive audit findings

- The active styling system is global CSS plus feature CSS files; no second styling framework was introduced.
- The shell already has a desktop sidebar and a mobile drawer breakpoint at `760px`, plus global layout breakpoints at `1100px` and `480px`. The mobile drawer has an open state and backdrop, but keyboard Escape handling, focus movement/restoration, and scroll locking remain unverified.
- Feature CSS includes responsive rules, but this was a static source audit. Viewports at 320, 375, 390, 430, 768, 1024, 1280, and 1440px were not browser-tested. No claim is made that all pages are responsive or overflow-free.

### Responsive assessment register slice — 2026-10-18

- Updated `frontend/src/features/examinations/pages/AssessmentRegisterTable.tsx` to retain the existing semantic, paginated desktop table and render an equivalent mobile card presentation at narrow widths.
- The mobile cards preserve the same assessment data, scope labels, active/inactive state, permission-dependent Edit action, MARKS_READ-gated View marks action, and original callbacks. Action names include the assessment name for assistive technology.
- Updated `frontend/src/features/examinations/pages/assessment-management-page.css` with card layout styles and a `760px` breakpoint. Desktop table and mobile cards are mutually exclusive via CSS; no API, DTO, permission, pagination, or business logic changed.
- This is a scoped responsive improvement, not evidence that all pages are responsive. Browser testing at 320px and other target viewports remains pending.

### Verification for this follow-up

- Archive integrity of the uploaded ZIP: passed before editing.
- Dependency installation: blocked by registry DNS resolution (`EAI_AGAIN`); the extracted `node_modules` remains incomplete.
- Syntax-only transpilation: passed for all 180 active TypeScript/TSX files with global TypeScript 5.8.3, zero syntax diagnostics. This is not a type-check.
- Actual `npm run build`: failed with TS2688 for missing `vite/client` and `node` type definitions because the dependency installation is incomplete.
- Actual `npm run lint`: failed because `oxlint` is not installed (`sh: 1: oxlint: not found`).
- Automated tests, browser viewport tests, and API integration tests: not run.
- No backup files were created. Source changes are limited to the network status component, its shell integration and styles, and the documentation records above.


## Daily attendance render-loop fix — 2026-10-18

- Fixed `DailyAttendancePanel.tsx` creating a fresh empty enrollment array on every render while the enrollments query had no data. That changed the `enrolledStudents` and `roster` memo dependencies each render, re-triggering the roster synchronization effect, which called `setDrafts` repeatedly and caused React's maximum update depth error.
- Added a module-level typed `EMPTY_ENROLLMENTS` constant and used it as the query-data fallback, keeping memo dependencies stable while loading or when the query has no data. Existing draft synchronization, edit preservation, API calls, permission checks, and date filtering are unchanged.
- Verification: source-level cause and fix inspected; TypeScript/TSX syntax transpilation and ZIP integrity are checked separately for this patch. Full project type-check/build remains blocked by the previously documented incomplete dependency installation; browser regression tests have not been run.


## Organization query-cache and hierarchy correction — 2026-10-18

- Removed the global `OrganizationQueryScopeBoundary` that cancelled all React Query requests and cleared the entire query cache whenever any organization selection level changed. This was causing enterprise and unrelated feature APIs to refetch when selecting a region, cluster, or institution.
- Preserved session-boundary cache clearing on authenticated-user changes/logout. Organization queries retain parent-ID-specific keys (`enterprises`, `regions/{enterpriseId}`, `clusters/{regionId}`, `institutions/{clusterId}`), so only the query for a newly selected parent is needed; existing cached ancestor lists are retained.
- Changed the frontend organization-management hierarchy to Enterprise → Region → Cluster → Institution. Removed the campus panel, campus breadcrumb/summary, campus lookup form, and organization campus-detail route. Legacy persisted campus selection values are ignored when restoring organization scope.
- Removed campus from the shared organization-selection type. Campus IDs remain in existing admissions, student, staff, timetable, inventory, and other feature API models/forms where current backend contracts still use them; this change does not claim that the backend campus entity or its API contracts have been removed. Feature pages no longer inherit a campus selection from the global organization hierarchy.
- No backend files, endpoints, request/response DTO contracts, or authorization rules were changed.
- Verification: source-level inspection and stale-reference grep performed. Full TypeScript type-check, production build, lint, and browser/API regression tests remain unverified because the extracted environment lacks a complete dependency installation.


## Organization workspace and embedded access-context contract — 2026-10-18

- Removed the redundant UUID-based Organization Lookup page from the router, sidebar, and Organization page; organization records are navigated through the hierarchy workspace instead.
- Preserved route and navigation permission gating for Organization Management. Existing create-Enterprise action remains gated by `ENTERPRISE_CREATE`; other create actions must not be added until their real backend endpoints and permission contracts are verified.
- Updated frontend authentication handling to consume an optional `accessContext` from login and refresh responses. While the backend contract is being implemented, it falls back to the existing `GET /api/v1/me/access-context` endpoint when the embedded context is absent. Once the backend returns the field, login/session restoration/refresh no longer needs a second access-context request.
- Added `docs/frontend/audit/AUTH_ACCESS_CONTEXT_MERGED_CONTRACT.md` with request/response schemas, compatibility rollout, security requirements, and backend tests. No backend source or API implementation was changed.
- Verification status for this slice must be confirmed by syntax/build checks; browser and backend integration tests have not been run in this archive-editing environment.


## Authentication context response integration

- Updated `LoginResponse.accessContext` to be required in the frontend contract for both login and refresh responses.
- Removed the `GET /api/v1/me/access-context` service and all runtime fallback calls.
- Login and refresh now validate that the embedded access context exists and matches the returned `userId` and `username` before saving token responses.
- Session restoration and 401-triggered refresh use the access context returned by refresh directly.
- Updated authentication/API contract documentation to record that the frontend no longer calls the separate access-context endpoint.
- Verification is pending below; a successful syntax check alone does not establish a full project type-check or production build.

### Verification for merged authentication response integration

- TypeScript/TSX syntax transpilation using the environment's global TypeScript 5.8.3: passed for 177 source files, zero syntax diagnostics. This is not a project type-check.
- Full project type-check and production build: not run successfully because the extracted frontend has no complete local toolchain (`frontend/node_modules/.bin/tsc` is absent); dependency installation remains subject to the previously recorded registry/network blocker.
- Lint: not run; local `oxlint` executable is unavailable.
- Browser/network regression tests: not run.
- Source scan: no frontend runtime import or call remains for `accessContextService` or `me/access-context`.


## Organization creation actions — 2026-10-18

- Added a permission-gated Region creation form to the selected Enterprise's Regions panel, using the existing `POST /api/v1/regions` service contract and `REGION_CREATE` permission documented in `BACKEND_API_CONTRACTS.md`.
- The selected Enterprise is supplied as the parent; users do not type or choose a parent UUID. Successful creation refreshes the region list and selects the newly created region.
- Cluster and Institution creation controls were not fabricated: the verified frontend API contract currently documents read endpoints for these resources but no create endpoints/request DTOs. Backend contract confirmation is required before wiring these actions.
- Verification for this slice: source-level review only; full type-check/build remains blocked by the documented dependency installation issue; browser testing not run.


## Cluster and institution creation actions — 2026-10-18

- Implemented `POST /api/v1/clusters` and `POST /api/v1/institutions` in the existing organization service using the user-provided organization API contract.
- Added `ClusterCreateForm.tsx` and `InstitutionCreateForm.tsx`, matching the existing organization create-form styling and inline validation conventions.
- Added permission-gated Create Cluster (`CLUSTER_CREATE`) to the selected Region panel and Create Institution (`INSTITUTION_CREATE`) to the selected Cluster panel. Parent IDs are injected from the selected hierarchy node; users do not enter UUIDs.
- On successful creation, the corresponding child list is refreshed, the created record is selected, descendants are reset where appropriate, and form state is cleared. API failures remain visible in the form.
- No Campus creation control was added because the requested Organization Management hierarchy intentionally ends at Institution. Existing campus-dependent module contracts remain unchanged.
- Verification: syntax transpilation and archive integrity are recorded for this slice below. Full type-check/build, lint, and browser/API integration tests remain subject to the previously documented incomplete dependency installation and are not claimed as passed.


## Organization workspace UX refinement — 2026-10-18

- Reworked the Enterprise create form to use the same responsive form classes and visual design as Region, Cluster, and Institution forms; removed one-off inline styles that produced native-looking fields.
- Disabled browser-native validation bubbles on the enterprise form so the existing inline validation/error messaging is used consistently. Added invalid-state styling and consistent primary/secondary actions.
- Changed the desktop hierarchy layout to show all four levels in a single row on wide screens, with two-column tablet layout and one-column mobile layout. This prevents Institutions from unexpectedly wrapping under Enterprises on large screens.
- Capped organization panel body height and enabled internal scrolling so a parent with many regions does not make the whole page excessively tall. Creation actions remain sticky at the top of each panel while its list scrolls.
- Improved visible keyboard focus states and responsive button wrapping.
- Verification: source changes inspected; archive integrity and syntax-only transpilation checked below. Browser screenshot/viewport verification has not been performed.

### Verification for organization workspace UX refinement

- Syntax-only transpilation using the globally installed TypeScript compiler: passed for 180 TypeScript/TSX files with zero syntax diagnostics. This is not a project type-check.
- Updated repository ZIP integrity: passed (`unzip -t`).
- Full project type-check, lint, production build, and browser viewport tests: not run in this slice. The known incomplete local dependency installation remains a blocker for project-level verification.
- Visual verification from an actual running browser: pending. The uploaded screenshots informed the source changes, but no browser regression result is claimed.

## 2026-10-18 — Multi-institution Institution Admin invitation

- Updated the user invitation request types to support `scopes[]` while retaining optional legacy `scopeType`/`scopeId` fields for existing single-scope invitation flows.
- The invitation dialog now switches to a multi-institution assignment workflow when `INSTITUTION_ADMIN` is selected: enterprise → region → cluster → searchable institution checklist.
- Organization choices are loaded from existing organization APIs (`GET /api/v1/enterprises`, `GET /api/v1/regions/by-enterprise/{enterpriseId}`, `GET /api/v1/clusters/by-region/{regionId}`, `GET /api/v1/institutions/by-cluster/{clusterId}`). No new endpoint was introduced.
- Institution Admin invitations submit `scopes[]` with `scopeType: INSTITUTION`; other invitation roles continue using the existing legacy single-scope request.
- Added loading, empty, error, selected-count, responsive, and keyboard-accessible institution selection states.
- Frontend role/scope checks are usability checks only; backend authorization remains authoritative.
- Verification: source-level syntax transpilation only. Full project type-check, production build, lint, API integration, and browser tests are not verified because project dependencies are not installed in this archive environment.


## Academic Setup student-search error visibility — 2026-10-18

- Added the student-search query to Academic Setup's existing query-error banner. A failed student lookup now surfaces the actual API/network error instead of silently presenting an empty student-options list as though no active students matched.
- Preserved the existing search endpoint, query key, request parameters, permissions, and enrollment workflow.
- Verification: syntax-only TypeScript transpilation passed for 180 TS/TSX files with zero diagnostics; updated ZIP integrity passed. Full project type-check/build, lint, and browser/API regression tests remain unverified because this extracted archive has no installed frontend dependencies or Git metadata.


## Academic Setup follow-up — enrollment roster query recovery

- Updated `frontend/src/features/academics/components/StudentEnrollmentsPanel.tsx` to render an inline, accessible error state and retry action when loading a selected section's enrollment roster fails.
- The empty-roster state is now shown only after a successful, non-loading roster query; a failed request can no longer be presented as if the section has no enrollments. Existing roster rows remain visible if a refetch fails after data was already loaded.
- Updated `frontend/src/features/academics/pages/AcademicSetupPage.tsx` to pass the existing query error/refetch state to the panel and avoid duplicating the roster error in the page-level aggregate banner. No endpoint, request/response type, permission, or enrollment workflow was changed. The prior student-search error-handling fix was not repeated or modified.
- Added responsive styling for the inline retry control in `frontend/src/features/academics/pages/academic-setup-page.css`.
- Verification: source assertions passed; TypeScript `transpileModule` syntax checks passed for `AcademicSetupPage.tsx` and `StudentEnrollmentsPanel.tsx`. This does not establish type correctness.
- Full type-check/build: blocked. `tsc -b` reports missing `vite/client` and `node` type definitions because frontend dependencies are not installed. `npm ci --offline` fails because required packages are not cached. A normal `npm ci` attempt could not reach `registry.npmjs.org` (`EAI_AGAIN`) and was stopped. The current Node runtime is v22.16.0, below the declared engine requirements of several locked transitive packages (including jsdom requiring Node `^22.22.2 || ^24.15.0 || >=26.0.0` and undici requiring `>=22.19.0`). `oxlint` is unavailable; browser tests were not run.

## Academic Setup query orchestration extraction — 2026-10-18

- Extracted Academic Setup's eight existing React Query requests and their display-option mapping from `AcademicSetupPage.tsx` into `frontend/src/features/academics/hooks/use-academic-setup-queries.ts`.
- The page now owns user interaction state, tab selection, dependent selection resets, mutations, success/error messaging, and panel composition. The hook owns data fetching and query-derived options for institutions, years, classes, sections, campuses, enrollment roster, and student search.
- Preserved existing query keys, query functions, `enabled` permission/selection conditions, stale times, filtering of inactive students, and option labels. The page retains its existing `academicService` mutation calls. No endpoint, request/response contract, authorization check, or enrollment workflow was changed.
- The previous roster retry/error-state fix and student-search error-visibility fix were preserved and not repeated.
- Verification: inspected the source and imports before editing; syntax-only transpilation passed for all 181 active TypeScript/TSX files with zero diagnostics. Source-level assertions confirmed all eight query keys and existing mutation service calls/import are retained. The actual `npm run build` was executed and failed at `tsc -b` with TS2688 because `vite/client` and `node` type definitions are unavailable in the absent/incomplete dependency installation; `vite build` therefore did not run. The actual `npm run lint` was executed and failed with exit 127 because `oxlint` is not installed. Earlier `npm ci` attempts are documented above as blocked by registry DNS failure (`EAI_AGAIN`); no package versions or compiler settings were changed. Browser/API integration tests were not run. No backup files were created.


## Academic Setup query error recovery across academic years, classes, and sections — 2026-10-18

- Added shared `AcademicQueryError` presentation for inline query failures and accessible retry controls. Reused it for the existing student enrollment roster error state rather than duplicating the same markup.
- Wired the existing React Query `refetch` operations into the academic years, classes, and sections panels. Query errors no longer appear as a false empty state; when stale rows exist, they remain visible alongside the refresh error.
- Removed duplicate page-level reporting for years/classes/sections because their active panels now display the corresponding errors and retry controls. Institution, campus, and student-search errors remain on the existing page-level banner.
- Preserved all query keys, query functions, permission enablement, endpoints, response models, and mutation workflows. No backend changes were made.
- Verification: source assertions passed for query/refetch prop wiring, empty-state guards, shared component reuse, and unchanged academic query keys. Global TypeScript 5.8.3 syntax transpilation passed for 182 TypeScript/TSX files with zero syntax diagnostics. ZIP integrity was checked after packaging. This is syntax-only validation, not a project type-check.
- The actual `npm run build` from `frontend/` failed at `tsc -b` with TS2688 because the `vite/client` and `node` type definitions are unavailable in the incomplete dependency installation; Vite production bundling did not run. The actual `npm run lint` failed with exit 127 because `oxlint` is not installed. Browser/API tests were not run. Prior npm registry installation attempts remain blocked by DNS failure (`EAI_AGAIN`); no package versions, lockfile, or compiler settings were changed.


## Academic Setup query recovery and date-range validation follow-up — 2026-10-18

- Added the shared `AcademicQueryError` component with an accessible retry action and reused it across academic years, classes, sections, and the student enrollment roster. Failed queries no longer show misleading empty states; stale records remain visible when React Query retains prior data. Existing query keys and request functions remain unchanged.
- Added inline, accessible validation for academic-year date ranges. An end date on or before the start date is identified next to the field, connected using `aria-describedby`, styled as invalid, and prevents form submission. The existing submit-handler validation remains as a defensive guard. No backend business rules or request contracts were changed.
- Verification: source assertions passed for query/refetch prop wiring, empty-state guards, shared component reuse, unchanged academic query keys, and date-range validation. Global TypeScript 5.8.3 syntax transpilation passed for 182 TypeScript/TSX files with zero syntax diagnostics. ZIP integrity passed.
- Full project type-check/production build remains blocked at `tsc -b` by missing `vite/client` and `node` type definitions in the incomplete dependency installation. `npm run lint` exits 127 because `oxlint` is unavailable. Browser/API tests were not run. Package manifests, lockfile, endpoints, DTOs, and authorization rules were not changed.


## Academic Setup hierarchy-selection reconciliation extraction — 2026-10-18

- Extracted the existing academic-year/class/section selection reconciliation effects into `frontend/src/features/academics/hooks/use-academic-selection-reconciliation.ts`. The hook preserves the existing preference for an ACTIVE academic year, falls back to the first available year/class/section, and clears selected IDs when the corresponding loaded option list becomes empty.
- `AcademicSetupPage.tsx` retains institution-change resets and user-driven year/class/section changes; the new hook owns only consistency reconciliation against query results. No query keys, endpoints, authorization conditions, mutations, or business rules changed.
- Verification: source assertions and TypeScript syntax transpilation passed for all 183 TypeScript/TSX files with zero syntax diagnostics. Query recovery/date validation checks from the same cumulative ZIP also passed. ZIP integrity passed. Full type-check/build remains blocked by missing `vite/client` and `node` definitions; lint remains blocked because `oxlint` is unavailable. Browser/API tests were not run.


## Leave Management create-form extraction — 2026-10-18

- Extracted the existing leave-request creation panel/form into `frontend/src/features/leave/components/LeaveRequestCreateForm.tsx`. `LeaveManagementPage.tsx` retains request submission, API interaction, validation, notification, and state ownership; the new component renders the form and forwards typed field events/callbacks.
- Preserved staff/student selection, existing lookup options and loading messages, leave-type selection, date constraints, optional reason and 1,000-character limit, institution gating, submit loading state, close behavior, and cancel/reset behavior. No endpoint, request/response contract, or permission behavior was changed.
- Verification: global TypeScript 5.8.3 syntax transpilation passed for 184 TypeScript/TSX files with zero syntax diagnostics. Source assertions passed for component composition, existing submit-handler wiring, staff/student selection reset, date constraint, reason length limit, cancel/reset behavior, and the absence of API calls in the extracted presentation component. ZIP integrity passed. The actual `npm run build` from `frontend/` failed at `tsc -b` with TS2688 because `vite/client` and `node` type definitions are missing; `npm run lint` failed with exit 127 because `oxlint` is unavailable. Browser/API tests were not run. No package manifests, lockfile, API endpoints, DTOs, or backend code were changed.


## Academic Setup class-editor context reset — 2026-10-18

- Fixed stale class-edit state when the user changes the selected institution or academic year. Previously, `editingClassId` and its form values could survive the context change, leaving the Classes panel in edit mode for a class belonging to the previous academic year. Submitting after changing the year could therefore update the old class while the UI showed the new year.
- Added a focused `resetClassEditor` helper and invoke it on explicit institution/year changes. The institution-change effect also clears the editor to cover changes originating outside the page handler (for example, organization-context changes).
- Preserved existing class create/update service calls, permission checks, query keys, selection reconciliation, and backend contracts. No endpoint or DTO changed.
- Verification: source assertions confirmed reset coverage in the institution-change effect and both institution/year handlers, and confirmed the existing update/create calls remain. Global TypeScript 5.8.3 syntax transpilation is run for all source TS/TSX files; this is not a project type-check. Full type-check/build and lint remain blocked by absent `frontend/node_modules` and the previously recorded package-registry DNS failure; browser/API tests were not run.


## Academic Setup year navigation resets class editor — 2026-10-18

- Fixed the Academic Years panel's “View classes” path to use the existing `changeYear` handler rather than setting `yearId` directly. This ensures navigation through that path also clears the previous class editor, dependent class/section selection, and stale messages, consistent with other year-change interactions.
- Preserved existing query keys, query functions, permissions, API calls, and class create/update behavior. No endpoint, DTO, or authorization logic changed.
- Verification: targeted source assertions confirmed the years panel callback delegates to `changeYear` and that the existing handler resets dependent selections and class-editor state. A syntax-only transpilation check and ZIP integrity check were run for this iteration. Full project type-check/build, lint, and browser/API tests remain blocked or unverified as documented in the dependency-environment findings above.


## Academic Setup campus-option query recovery — 2026-10-18

- Inspected the academic sections panel, Academic Setup query hook, and page-level error handling. The campus-options query previously surfaced only through a generic page banner and had no contextual retry control, while the section form's optional campus selector could appear empty after a failed request.
- Added the existing shared `AcademicQueryError` component to the Sections panel when section creation is available and a selected class makes campus options relevant. The error exposes a retry action wired to the existing `campusesQuery.refetch`; the optional campus field remains optional and is not falsely represented as having no campuses after a failed request.
- Removed campus-query errors from the generic page-level banner to avoid duplicate reporting while the contextual Sections panel is active. Institution-list and student-search errors retain their existing page-level handling.
- Preserved the existing campus query key, service method, permission enablement, optional-campus request behavior, and all backend contracts. No endpoint, DTO, or authorization rule changed.
- Verification: targeted source assertions confirmed the error/retry props are passed to the Sections panel, the retry calls the existing query's `refetch`, the campus query key/service call are unchanged, and campus errors are no longer duplicated by the generic banner. TypeScript/TSX syntax transpilation and ZIP integrity are checked for this iteration. Full project type-check/build remains blocked by missing `vite/client` and `node` type definitions in the incomplete dependency installation; lint remains blocked because `oxlint` is unavailable. Browser/API integration tests were not run.


## Academic Setup organization-scope query recovery — 2026-10-18

- Inspected `AcademicOrganizationScopePanel.tsx`, the Academic Setup query hook, page-level error handling, and existing shared `AcademicQueryError` styles before editing. Institution-list failures (cluster-scoped selection) and single-institution failures (direct institution context) were previously displayed only in a generic page banner without a contextual retry action.
- Reused `AcademicQueryError` inside the Organization scope panel and wired its retry button to the already-existing React Query `refetch` for the active institution query. The panel now suppresses the “select an institution first” helper while the institution query is failing, so the error is not obscured by an unrelated empty-context message.
- Removed institution query errors from the generic page banner to prevent duplicate announcements; student-search errors remain there. Query keys, query functions, enablement, API contracts, permission checks, and organization-selection behavior are unchanged. No backend files or endpoints were changed.
- Verification: source assertions and syntax transpilation were run for the updated files and repository; ZIP integrity passed. Full TypeScript type-check/build remains blocked by missing `vite/client` and Node type definitions in the incomplete dependency installation; lint remains unavailable because `oxlint` is not installed. Browser/API and responsive tests were not run.


## Hostel directory data hook and scoped error recovery — 2026-10-18

- Extracted the hostel directory's list state, status filter, pagination, selected-hostel reconciliation, loading/error state, and request lifecycle from `HostelPage.tsx` into `frontend/src/features/hostel/hooks/use-hostel-directory.ts`. The page continues to own room/allocation workflows, mutations, permission decisions, and form state.
- Added request-sequence protection so a stale hostel-directory response cannot overwrite a newer filter/page request. Cleanup invalidates in-flight responses when the hook's request dependencies change or the component unmounts.
- Added institution-context gating so results from the previously selected institution are not rendered while a new institution context is being loaded. The hook clears directory selection/data when the institution changes or directory read access is unavailable.
- Moved the UI-only `EntityFilter` type into `components/hostel-directory-types.ts`, shared by the hook and directory presentation component without coupling the hook to the component module.
- Added contextual loading-failure UI and retry in `HostelDirectoryPanel.tsx`; failed directory loads no longer render as a successful empty result. Added an explicit no-institution state. The directory query error is kept local to the directory panel instead of being duplicated in the page-wide mutation error banner.
- Preserved `hostelService.searchHostels` and its existing arguments (`institutionId`, active filter, page index, page size 20), existing permission checks, filter defaults, pagination semantics, selected-record preference, and all mutation/API contracts. No backend files or endpoints changed.
- Verification: 186 active `.ts`/`.tsx` files passed syntax-only transpilation with zero syntax diagnostics. Eight targeted source assertions passed for service argument preservation, stale-response guards, effect cleanup, institution-scoped rendering, contextual error/retry state, no-institution state, hook delegation, and the shared filter type. ZIP integrity passed.
- Actual `npm run build` was executed and failed at `tsc -b` with TS2688 because `vite/client` and `node` type definitions are unavailable in the incomplete dependency installation; Vite bundling did not run. Actual `npm run lint` was executed and exited 127 because `oxlint` is unavailable. Browser/API integration and automated race-condition tests were not run. No package manifests, lockfile, endpoints, DTOs, or backend files were changed.

## Hostel room/allocation stale-response protection and contextual recovery — 2026-10-18

- Inspected `HostelPage.tsx`, `HostelRoomsPanel.tsx`, `HostelAllocationsPanel.tsx`, the hostel directory hook, existing hostel styles, and the recorded verification notes before editing.
- Added independent request-sequence guards for room and allocation list requests. A response or error from an older request is ignored after a newer request starts, and effect cleanup invalidates requests when the selected hostel, filter, page, permission, or component lifecycle changes. This prevents late responses from replacing the current hostel/filter/page results or incorrectly clearing the current request's loading state.
- Added separate room/allocation query error state and contextual retry controls in their existing panels. Failed requests are no longer rendered as successful empty states, and retry uses the existing `loadRooms` / `loadAllocations` callbacks and existing service methods.
- Preserved existing `hostelService.searchRooms` and `searchAllocations` arguments, page sizes, filters, permission checks, mutations, API contracts, and backend authorization behavior. No backend files, endpoints, DTOs, or dependency manifests changed.
- Verification: TypeScript 5.8.3 syntax-only transpilation passed for 186 active `.ts`/`.tsx` files with zero syntax diagnostics. Ten targeted assertions passed for room/allocation request sequencing, cleanup invalidation, contextual error/retry wiring, and unchanged service arguments. ZIP integrity was checked after packaging. Actual `npm run build` was executed and failed at `tsc -b` with TS2688 because `vite/client` and `node` type definitions are unavailable in the extracted dependency environment. Actual `npm run lint` was executed and exited 127 because `oxlint` is unavailable. Browser/API integration and automated race-condition tests were not run.

## Attendance page query orchestration extraction — 2026-10-18

- Inspected the existing `AttendancePage.tsx`, its child panels, filter/header components, attendance API service/types, and current frontend TypeScript configuration before editing.
- Extracted the eight existing React Query workflows (institution list/fallback, academic years, classes, sections, timetable, occurrences, roster, audit history, plus the dependent audit-actor lookup) and their display-option derivation into `frontend/src/features/attendance/pages/use-attendance-queries.ts`. The page retains attendance mode and selection state, unsaved-draft protection, draft reconciliation, save/correction mutations, permission decisions, and page/panel composition.
- Preserved the existing query keys, query functions/service arguments, `enabled` conditions, stale times, audit-actor visibility behavior, option labels, and selected-occurrence fallback behavior. No endpoint, DTO, permission rule, mutation, or backend code changed.
- Verification: all active frontend `.ts` and `.tsx` files passed TypeScript `transpileModule` syntax checks with zero syntax diagnostics. Targeted source assertions confirmed all existing query keys/service calls remain in the extracted hook, the page calls the hook once, and the page retains attendance write service calls and unsaved-draft handling. ZIP integrity passed.
- Full project type-check/build remains blocked by the existing incomplete dependency environment: `vite/client` and Node type definitions are missing, `npm ci --offline` cannot find required packages in the local cache, and the online install attempt could not reach `registry.npmjs.org` (`EAI_AGAIN`). Current Node is v22.16.0 and does not satisfy all locked transitive package engine ranges. Lint remains unavailable because `oxlint` is not installed. Browser/API integration tests were not run.

## Attendance lesson-draft reconciliation extraction — 2026-10-18

- Inspected `AttendancePage.tsx`, `attendance-page-utils.ts`, the attendance API roster DTO, existing roster/history presentation components, and the current changeset record before editing.
- Extracted lesson-attendance draft state types, server-draft creation, change detection, roster reconciliation, and stale-draft identification into `frontend/src/features/attendance/pages/attendance-draft-utils.ts`. The page now delegates reconciliation and stale-draft detection to these focused helpers rather than embedding the reconciliation loops inside its component body.
- Preserved the existing reconciliation behavior: unchanged local rows adopt the latest server values; locally edited rows retain their status and remarks while refreshing their server baseline; edited rows missing from the latest roster remain present for explicit stale-edit resolution; unchanged rows missing from the roster are dropped.
- Kept compatibility for existing imports by re-exporting `AttendanceDraft` and `createDraft` from `attendance-page-utils.ts`. No query keys, service arguments, endpoint, DTO, permission check, save/correction workflow, or backend code changed.
- Verification: isolated TypeScript compilation of the new helper and attendance API types passed. A Node assertion harness executed 10 checks covering default drafts, edit detection, server baseline refresh, adoption of unchanged server values, new roster rows, preservation of stale edits, removal of unchanged missing rows, and stale-row identification. Full frontend TS/TSX syntax transpilation and ZIP integrity are checked for this iteration.
- The full application type-check/build remains blocked by the incomplete dependency environment (`vite/client` and Node type definitions unavailable); dependency installation is still blocked by unavailable npm registry access (`EAI_AGAIN`) and missing local cache entries. Lint remains unavailable because `oxlint` is not installed. Browser/API integration tests were not run.


## Daily attendance pagination extraction — 2026-10-18

- Added `frontend/src/features/attendance/pages/daily-attendance-query-service.ts` to own the existing paginated loading of all section enrollments and daily attendance records. The fixed page size and sequential page traversal remain unchanged.
- Updated `DailyAttendancePanel.tsx` to call the extracted query-service functions; the component retains React Query keys, enablement, stale times, roster/date filtering, draft lifecycle, permission checks, save/update workflow, and query invalidation.
- Preserved the existing academic and attendance service methods, arguments, and API contracts. No backend files or endpoints were changed.
- Verification is limited to syntax transpilation and source assertions for this change. Full TypeScript type-check, production build, lint, and browser/API integration remain unverified because dependencies are not installed in this extracted environment.

## Daily attendance save-workflow dependency correction — 2026-10-18

- Inspected `DailyAttendancePanel.tsx`, the daily attendance API service and request/response types, and `DailyAttendanceSaveBar.tsx` while reviewing save and partial-failure behavior. The panel invokes `attendanceService.markDailyAttendance` and `attendanceService.updateDailyAttendance` but the current cumulative source did not import `attendanceService`; this is a real TypeScript name-resolution defect that syntax-only transpilation cannot detect.
- Added the missing import from the existing `../api/attendance-service` module. No save logic, request payload, endpoint, permission check, query invalidation, retry behavior, or backend contract was changed.
- Verification for this change: targeted source assertions confirmed the service import resolves to the existing service module and both save calls remain present with their existing arguments; full frontend TS/TSX syntax transpilation and ZIP integrity are checked for this iteration. Full type-check/build remains blocked by the known missing `vite/client` and Node type definitions in the extracted environment; lint remains blocked because `oxlint` is unavailable. Browser/API integration tests were not run.


## Daily attendance ambiguous batch-save retry guard — 2026-10-18

- Inspected `DailyAttendancePanel.tsx`, `DailyAttendanceSaveBar.tsx`, `attendance-service.ts`, the daily attendance request/response types, and the existing changeset record before editing.
- Added an explicit uncertain-outcome state when `markDailyAttendance` rejects. Because the frontend cannot infer whether the backend processed a batch whose response failed, the save handler and save-bar button now block another save until the user explicitly refreshes both enrollment and attendance queries successfully.
- Added a contextual “Refresh and review roster” action to the uncertain-outcome alert. A failed refresh leaves the guard active and reports that saving remains blocked. A successful refresh clears the uncertain-outcome guard and asks the user to review the refreshed records before retrying. Changing the institution/section/date context clears this guard along with the existing draft state.
- Kept individual update-failure reporting separate so successful reconciliation of an ambiguous batch does not erase errors for failed per-record updates. Existing `markDailyAttendance` and `updateDailyAttendance` service methods, request payloads, query keys, permissions, and backend contracts are unchanged.
- Verification: TypeScript syntax-only transpilation passed for 189 active `.ts`/`.tsx` files with zero syntax diagnostics. Eleven targeted source assertions passed for guard activation, save blocking, explicit refresh checks, context cleanup, preserved service calls, and save-bar messaging. ZIP integrity was checked after packaging.
- Full `npm run build`/type-check and lint remain blocked by the known incomplete dependency environment (`vite/client` and Node type definitions missing; `oxlint` unavailable). Browser/API integration tests and automated runtime tests were not run. This frontend guard reduces unsafe immediate retries but cannot guarantee idempotency or prove whether a server-side batch committed; that requires a confirmed backend contract.


## Daily attendance refresh error feedback — 2026-10-18

- Updated `frontend/src/features/attendance/pages/DailyAttendancePanel.tsx` to inspect the `isError` and `error` values returned by both enrollment and daily-record `refetch()` calls. React Query refetch failures do not necessarily throw, so ordinary manual refreshes now show actionable error feedback instead of silently failing.
- When recovering from an ambiguous batch-create result, refresh errors remain attached to the recovery warning and the save block remains active until both queries refresh successfully. Successful ordinary refreshes now show a status message; successful recovery refreshes retain the explicit review-before-retry message.
- Existing query keys, service methods, request payloads, authorization checks, and backend contracts were not changed.
- Verification performed for this change: targeted source assertions and syntax checks where tooling was available; full production type-check/build, lint, and browser/API integration remain blocked or unverified in the extracted environment.

## Attendance Analytics query recovery — 2026-10-19

- Added contextual retry controls for Attendance Analytics institution lookup, academic-year, class, section, section-performance, subject-performance, student-summary, and low-attendance queries. Retries call each existing React Query `refetch`; no new API calls or endpoints were introduced.
- Failed filter queries now show an explicit error and retry action rather than leaving a disabled empty selector with no explanation. Retry controls disable while the corresponding request is fetching.
- Analytics panels retain previously loaded rows when a background refresh fails and show the error/retry action alongside those rows. An initial failed load continues to show the error instead of a misleading empty-state message.
- Added associated labels for the academic-year, class, and section controls while moving retry buttons outside label elements to preserve valid accessible markup.
- Preserved existing query keys, query functions, permission conditions, service arguments, CSV export shape, date-range validation, and analytics calculations. No backend code, API contract, package manifest, or dependency was changed.
- Verification: syntax-only transpilation and targeted source assertions were run for the updated frontend. `npm run build` was attempted and remains blocked at `tsc -b` with TS2688 because `vite/client` and Node type definitions are missing from the extracted dependency environment. Runtime/UI tests were not run. `npm run lint` was attempted from `frontend/` and failed with exit 127 because `oxlint` is not installed. This change does not claim a successful project type-check or production build.


## Focused reliability pass — 2026-10-19

- Added `npm test` (`vitest run`) to the frontend package scripts so the already-declared Vitest dependency has a discoverable test command. No dependency versions or lockfiles were changed.
- Attendance Analytics, Attendance query loading, and Timetable's fallback institution lookup now honor `INSTITUTION_READ` before making the institution-detail request.
- Assessment Management clears previous institution results when the active institution changes, ignores stale list responses, preserves the last successful register when a refresh fails, and shows a real load-error state instead of reporting “No assessments found” after an initial failure.
- User Management directory requests now ignore stale responses from earlier search/filter/scope requests. A failed refresh preserves the last successful directory result, while an initial failure is shown as a load failure rather than a false empty directory.
- Timetable retry now invalidates the organization, academic hierarchy, campus, and timetable queries that contribute to the dashboard error. Campus lookup failures are included in the error state. Timetable tabs now have linked tab/tabpanel semantics and arrow/Home/End keyboard navigation.
- Corrected outdated explanatory copy in the marks workspace. The existing network indicator continues to state clearly that unsaved form edits are not durably persisted; no unsafe offline write queue or automatic replay was added.
- Dependency installation was attempted, but npm registry requests failed with `EAI_AGAIN`; the environment therefore still cannot execute the real build, lint, or Vitest suite. No claim of a successful build/test run is made.

### Verification snapshot for the focused reliability pass

- TypeScript `transpileModule` syntax checks: 191 `.ts`/`.tsx` source and test files, zero syntax diagnostics.
- Direct runtime assertions against the existing attendance draft reconciliation helpers: 5/5 passed.
- `npm test`: command is now declared and discovers `vitest run`, but execution is blocked because `vitest` is not installed in this extracted environment.
- `npm run build`: blocked by missing `vite/client` and Node type definitions because `npm ci` could not fetch packages from the registry (`EAI_AGAIN`).
- `npm run lint`: blocked because `oxlint` is not installed in the extracted environment.
- No browser, responsive viewport, or API integration test was run. The new Vitest tests are authored but remain runtime-unverified.

- Attendance's query-error action now retries only the failed organization/academic/lesson queries instead of reloading the whole page, which could discard unsaved attendance edits.

## Shared page gutter alignment — 2026-10-19

- Standardized the outer horizontal gutter for Organization, Students, Certificates & Documents, Homework & Assignments, Discipline & Behavior, Hostel, Inventory, and Leave pages. Their page-root wrappers no longer add their own 28–32px padding or narrower centered max-width on top of the shared `.app-content` layout.
- The shared workspace shell remains the single owner of page-level horizontal spacing, so page headings and full-width panels align with the Network Status Indicator. Internal panel/card padding and the network indicator itself are unchanged.
- This is a CSS-only layout adjustment. No API, data, authorization, route, or component behavior changed.
- Verification: source selector assertions and archive integrity checks passed. A real browser screenshot/viewport comparison and production build were not run in this environment; the existing dependency installation issue still blocks the build.
