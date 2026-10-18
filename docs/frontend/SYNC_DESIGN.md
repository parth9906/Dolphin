# Synchronization Design

## Status

A durable synchronization engine is not currently implemented in the inspected frontend source. This document describes required design constraints, not a claim that synchronization exists.

## Proposed operation lifecycle

`draft → queued → syncing → synced` or `failed` / `conflict`.

Only a server-confirmed successful response may transition an operation to `synced`. Network timeout is ambiguous: before retrying a write, the implementation must rely on an idempotency contract or a verified duplicate-prevention strategy.

## Queue record (conceptual, not an implemented API DTO)

A future local record will need an operation ID, authenticated user identity, organization scope IDs, operation type, target/resource identity, payload version, creation time, attempt count, last error, and status. This is design guidance only; it must not be used as an invented backend request schema.

## Replay rules

- Never replay an operation under a different user identity.
- Revalidate the active session and scope before replay.
- Serialize conflicting writes to the same resource where necessary.
- Use bounded exponential backoff with jitter for retryable failures.
- Treat 401 as a session problem, 403 as an authorization failure, validation errors as user-actionable failures, and conflicts according to the backend's actual response contract.
- Keep a visible operation-level result and provide safe retry/cancel actions.
- Clear or quarantine queued records after logout or a scope change; never silently reassign them to a new user.

## Backend dependency

Before implementation, confirm whether existing attendance and assessment endpoints support idempotency keys, version/ETag checks, or another duplicate-prevention mechanism. If they do not, Dolphin needs an explicit API contract for safe retry and conflict reporting. No such capability is assumed by this document.
