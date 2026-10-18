# Frontend Implementation Plan

## Working constraints

- Whale is the only repository to modify; Dolphin is read-only and is the contract/security source of truth.
- Inspect the current source before every change. Do not guess file contents or invent endpoints/DTOs.
- Preserve current functionality and user changes. Do not create timestamped `.bak` files or duplicate source files.
- Make small changes, run checks that are actually available, and record limitations honestly.

## Completed in the current working copy

1. Added/used the shared typed organization selection store at `src/features/organization/hooks/organization-selection.ts`.
2. Migrated Organization, Leave, Academic Setup, and Timetable to the shared observable selection.
3. Migrated Student List and Create Student to reactive organization context; student creation now updates the shared store with the complete institution/campus records rather than writing partial objects directly to storage.
4. Migrated Admissions, Attendance, Attendance Analytics, Assessment Management, Staff, Inventory, Hostel, Discipline, Certificates, and Homework away from direct `sessionStorage` parsing.
5. Removed User Management behavior that appended a manually selected institution to available scope options without proof it was in the authenticated user's accessible scopes.
6. Updated the Vite proxy to honor the documented `VITE_BACKEND_TARGET` variable, retaining `http://localhost:8080` as fallback.
7. Added five evidence-based audit documents under `docs/frontend/audit/` and filled the existing architecture/API/auth/design/offline/sync/implementation documentation files.

## Remaining prioritized work

### P0 — Scope safety and regression tests
- Verify organization parent-child selection reset behavior in all selector screens.
- Verify in-flight responses cannot overwrite the newly selected scope.
- Clear sensitive TanStack Query data on logout/account change and define cache invalidation for organization switches.
- Test malformed storage, 401/403/404, and deep links against the real backend contracts.

### P1 — Page decomposition and UX
- Refactor Attendance, Assessment Management, Timetable, User Management, Student List/Detail, Staff, Admissions, and Academic Setup one page at a time.
- Replace native browser confirmation/alert calls with accessible application dialogs and notifications.
- Standardize loading, empty, error, retry, permission-denied, and form-validation patterns.
- Test mobile-specific layouts and keyboard interaction at the widths listed in `DESIGN_SYSTEM.md`.

### P1 — Offline support
- Do not enable write queueing until backend idempotency/conflict contracts and local-data security requirements are confirmed.
- Implement IndexedDB persistence, durable queue, retries, per-operation status, and conflict UI only after that contract review.

### P2 — Verification and cleanup
- Run `npm ci`, `npm run build`, `npm run lint`, and the available tests in the actual repository environment.
- Remove obsolete source files only after proving they are unused; do not bulk-delete historical backups as part of this refactor.
- Inspect the final diff and document all unverified behavior and missing contracts.

## Current verification limitation

The extracted archive has no Git metadata. Dependency installation did not complete in the execution environment; `npm run build` cannot resolve the `vite/client` and Node type definitions. A TypeScript transpilation syntax check was run against 88 active source files and reported no syntax diagnostics. This is not a substitute for a full type check, lint run, or production build.
