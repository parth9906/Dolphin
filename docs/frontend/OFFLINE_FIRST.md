# Offline-First Behavior

## Current verified state

The frontend package declares `idb`, but the inspected application source does not currently implement a durable IndexedDB data layer, an application service worker, or a persistent sync queue. Local React state or a form draft is not durable offline storage. Do not advertise the current application as fully offline-first.

## Proposed safe scope

Candidate workflows are attendance entry and assessment marks entry, subject to product approval and backend contract verification. Timetables/rosters may be cached for read-only use only after their authorization and data-retention requirements are defined. Organization administration, role/scope changes, user management, and other security-sensitive operations remain online-first.

## Requirements before enabling offline writes

1. Explicitly list supported operations and the fields stored locally.
2. Partition records by authenticated user and organization/institution/campus scope.
3. Define how logout, user switching, revoked access, and expired sessions clear or quarantine local data.
4. Persist pending operations durably and expose pending/syncing/synced/failed/conflict states.
5. Define duplicate prevention/idempotency and conflict semantics supported by Dolphin.
6. Retry with bounded backoff and never show “synced” until Dolphin confirms success.
7. Preserve user-entered values on recoverable failures and provide a conflict-resolution path.
8. Avoid storing more student information offline than the workflow requires; define retention and local-device protections.

## Connectivity UI slice — 2026-10-18

`frontend/src/app/NetworkStatusIndicator.tsx` now reports the browser's `navigator.onLine` state and listens for `online` / `offline` events. The application shell shows a visible connection indicator and, while offline, warns that unsaved edits are not stored in durable local storage. The message explicitly does not treat browser connectivity as proof that the Dolphin API is reachable.

This is a UX safety improvement only. It does **not** implement a service worker, IndexedDB persistence, cached API data, or a durable operation queue. It must not be described as offline-first functionality, and it does not make current attendance or marks drafts survive a refresh.

## Current behavior

No new offline write behavior is implemented by the current organization-context changes. Until the requirements above are met, network failures must be shown as failures and mutations must not be queued or reported as successful offline operations.


## Current practical boundary — 2026-10-19

Dolphin currently reports browser connectivity but does not durably persist unsaved form edits or replay mutations offline. The UI warns users not to refresh or leave with unsaved edits while offline. This is intentional for this pass: the verified attendance/marks APIs do not provide idempotency keys, so automatic replay after an ambiguous write could produce conflicts or duplicate-attempt confusion. Implement offline draft persistence only as a separately scoped feature with authenticated-user and organization partitioning; do not present an in-memory draft as durable.
