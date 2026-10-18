# Dolphin Frontend Refactor Plan

## Guardrails

- Dolphin is the only repository to change. Dolphin is read-only reference material for real API contracts and authorization.
- Preserve working behavior and the current stack.
- No new endpoints, mock responses, fake offline success, speculative abstractions, or backup copies.
- Inspect each file before changing it; keep each change small and run relevant static checks.
- The uploaded ZIP has no `.git` directory or installed dependencies, so use the live repository's Git status and dependency installation before applying any change. Do not overwrite uncommitted user work.

## Ordered work

### Phase 0 — Audit (current)

1. Inventory routes, feature modules, services, auth, styling, package scripts, and docs.
2. Compare every API path changed by a task against Dolphin controller + service + DTO + module contract.
3. Complete the API mapping for each feature before that feature is refactored.
4. Document current UI states and responsive behavior from actual pages/CSS.
5. Record current build/lint/test status in the live repository; this archive cannot establish it.

### P0 — Organization context foundation (implemented in working copy; runtime verification pending)

1. Added a typed organization-selection store using the existing key and validated hierarchy shape.
2. Migrated Organization, Leave, Academic Setup, Timetable, Students, Admissions, Attendance, Attendance Analytics, Assessment Management, Staff, Inventory, Hostel, Discipline, Certificates, and Homework away from independent storage parsing.
3. Student creation now updates the shared store with complete institution/campus records rather than writing partial records directly to storage.
4. Added an application query-scope boundary that cancels in-flight queries and clears cached query/mutation data when organization context changes.
5. Added a session query-cache boundary for logout, session expiry, and user switching.
6. Updated the Vite proxy to honor `VITE_BACKEND_TARGET`.
7. Syntax transpilation passed for 88 active source files. Full typecheck/build/lint remain unverified because dependency installation did not complete in this environment.

### P0 — Leave management correctness and UX

1. Replace local `getInstitutionId()` / mount-only selection with the shared context after it is verified.
2. Add request cancellation or request-generation guards to list/type/lookup/audit requests.
3. Replace `window.confirm()` with an accessible confirmation dialog using the existing design/CSS conventions or a small shared primitive.
4. Preserve backend workflow: create, approve/reject with required comment, cancel pending request, audit.
5. Verify list pagination: page 0/size 50 is currently requested; decide whether pagination UI is required based on actual product expectations and backend Page metadata, not assumptions.
6. Test 401/403/404/409/422/network errors and preserve user-entered values after recoverable failures.

### P1 — Shared state and error UX

1. Inspect current alert/toast/dialog implementations before adding shared primitives.
2. Standardize API error-to-UI mapping for the existing Dolphin error contract.
3. Add consistent loading/empty/error/retry/permission-denied states without suppressing errors.
4. Replace native dialogs one workflow at a time.

### P1 — Oversized pages (one feature at a time)

Priority by risk and coupling: Attendance; Assessment Management; Timetable; User Management; Student Detail/List; Staff; Admissions; Academic Setup; remaining operations modules.

For each page: map state, API calls, handlers, form schemas, and visual sections; extract feature-specific components/hooks; keep API contracts in feature services; avoid moving unrelated behavior into a generic component. Do not start all page refactors simultaneously.

### P1 — Offline capability

1. Verify the exact current draft persistence and any use of `idb` in the entire live repository.
2. Do not describe local React state as offline persistence.
3. Before implementing offline writes, define supported operations and verify backend idempotency/conflict contracts. If safe replay is unsupported, document the exact backend contract needed rather than inventing it.

### P2 — Tooling/configuration

1. Make Vite proxy target honor the documented `VITE_BACKEND_TARGET` while preserving the `/api` proxy behavior.
2. Add tests only using the existing installed Vitest/Testing Library dependencies, with scripts after inspecting the live package state.
3. Verify `npm run build`, `npm run lint`, and tests in the actual repository.

## Definition of verified change

A change is accepted only when its source diff is reviewed, API contract remains valid, existing behavior is retained, TypeScript/build checks are run, relevant tests are run if available, and changed files are reported. No success is claimed for checks that were not executed.

### Progress update — 2026-10-19

- Attendance Analytics now has contextual retry controls for institution and academic hierarchy lookups and each analytics result query. Background-refresh failures preserve previously loaded rows with a warning rather than replacing them with a false empty state.
- Dependency/toolchain verification remains a blocker: `npm run build` currently fails because the extracted environment cannot resolve `vite/client` and Node type definitions. Resolve the environment before claiming the frontend builds; do not alter package versions merely to mask this issue.
- Continue with the next Attendance workflow only after reviewing the actual source for a concrete defect; then proceed to Assessment Management, User Management, and Timetable. Keep scope focused and avoid speculative concurrency/offline infrastructure.


### Focused reliability pass — 2026-10-19

- Fixed misleading empty-state behavior after assessment/user-directory read failures and guarded both lists against stale responses.
- Ensured fallback institution-detail queries are permission-gated.
- Fixed Timetable retry coverage for organization and academic hierarchy queries, surfaced campus lookup errors, and improved keyboard access to tabs.
- Added the missing `npm test` script. Runtime verification remains blocked by npm registry DNS failures (`EAI_AGAIN`) in the execution environment; retry installation in a network-enabled environment before declaring the build or tests green.
- Offline writes remain intentionally unsupported; keep the current connectivity warning until durable drafts and safe synchronization are implemented as a dedicated feature.
