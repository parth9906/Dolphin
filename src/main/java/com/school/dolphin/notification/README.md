# Notifications & Outbox

Status: **Implemented**

[Shared conventions](../../../../../../../docs/api/README.md) apply.

## A. Module overview

Owns the per-user notification inbox and the transactional outbox that other
modules use to enqueue side effects (for example attendance-alert notifications),
plus an admin view of failed outbox events.

Included in V1: unread count, mark one/all read, inbox listing (user-scoped);
outbox dead-letter listing, retry, and summary (admin).

Excluded: push/SMS/email transport configuration, user notification preferences,
subscriptions.

Dependencies: `identity` (recipients are user accounts); consumed by
`attendance` (alert notifications).

Principal classes: `controller/{NotificationController,NotificationOutboxAdminController}`,
`service/{NotificationService,NotificationOutboxAdminService,NotificationOutboxClaimService,NotificationOutboxDispatchService,NotificationOutboxStateService,NotificationOutboxWorker,AttendanceAlertNotificationSender,AttendanceAlertNotificationSenderImpl}`,
`entity/{Notification,NotificationOutbox}`.

## B. API conventions

- Base paths: `/api/v1/notifications`, `/api/v1/notification-outbox`.
- Authentication: bearer.
- **Inbox endpoints have no `@PreAuthorize`**: they require only an authenticated
  user and are scoped to that user's own notifications. Outbox admin endpoints
  require permissions.
- Pagination: inbox and dead-letter listings are paginated.
- Outbox statuses: `PENDING`, `PROCESSING`, `DELIVERED`, `DEAD`.

## C. Endpoint inventory

| Method | Path | Purpose | Permission | Scope |
|---|---|---|---|---|
| GET | `/api/v1/notifications/unread-count` | My unread count | none (authenticated) | self |
| GET | `/api/v1/notifications` | My inbox | none (authenticated) | self |
| PATCH | `/api/v1/notifications/{notificationId}/read` | Mark one read | none (authenticated) | self |
| PATCH | `/api/v1/notifications/read-all` | Mark all read | none (authenticated) | self |
| GET | `/api/v1/notification-outbox/dead` | Dead events | `NOTIFICATION_OUTBOX_READ` | platform |
| POST | `/api/v1/notification-outbox/{eventId}/retry` | Retry dead event | `NOTIFICATION_OUTBOX_RETRY` | platform |
| GET | `/api/v1/notification-outbox/summary` | Outbox summary | `NOTIFICATION_OUTBOX_READ` | platform |

All `Implemented`.

## D. Endpoint contracts

### GET /api/v1/notifications/unread-count

No params. Response `200` `{ "unreadCount": <long> }`.

### GET /api/v1/notifications

Query: `page` (default 0), `size` (default 20), `unreadOnly` (default false),
`type` (optional). Response `200` `Page<NotificationResponse>` where
`NotificationResponse` = `{ id, notificationType, title, message,
referenceType, referenceId, createdAt, readAt, read }`.

### PATCH /api/v1/notifications/{notificationId}/read

No body. Response `200` `{ "notificationId": "...", "status": "READ" }`.
Errors: `404` (not found or not owned - ownership enforced in the service).

### PATCH /api/v1/notifications/read-all

No body. Response `200` `{ "status": "SUCCESS", "updatedCount": <int> }`.

### GET /api/v1/notification-outbox/dead

Query: `page` (default 0), `size` (default 20). Response `200`
`Page<NotificationOutboxFailureResponse>` = `{ id, eventType, aggregateType,
aggregateId, status, attempts, createdAt, updatedAt, lastError }`.

### POST /api/v1/notification-outbox/{eventId}/retry

No body. Response `200`
`{ "eventId": "...", "status": "PENDING", "message": "Notification event queued for retry" }`.
Errors: `404`.

### GET /api/v1/notification-outbox/summary

No params. Response `200` `NotificationOutboxSummaryResponse` =
`{ pending, processing, delivered, dead, total }`.

## E. Validation and business rules

- Notifications are unique per recipient/type/reference/idempotency key;
  `createIfAbsent` is idempotent.
- Mark-read operations are ownership-checked against the authenticated user.
- The outbox worker claims `PENDING` events (locking), marks `DELIVERED` or
  reschedules; events exceeding retry attempts become `DEAD`.

## F. Authorization matrix

| Endpoint group | Permission | Restriction |
|---|---|---|
| Inbox (`/notifications`) | none (authenticated) | own notifications only |
| Outbox dead/summary | `NOTIFICATION_OUTBOX_READ` | platform |
| Outbox retry | `NOTIFICATION_OUTBOX_RETRY` | platform |

## G. Error contract

`400`, `403` (outbox permission), `404` (notification/event not found).

## H. State transitions

```
NotificationOutbox: PENDING --claim--> PROCESSING --deliver--> DELIVERED
                     ^                        \--fail--> PENDING (retry)
                     \-------------------------------- DEAD (exhausted)
Notification: unread --mark read--> read
```

## I. Dependencies and integrations

- `attendance`: alert generation publishes notifications into the outbox.
- `guardian`: intended invitation delivery (see the guardian module gap - no
  listener is currently registered for guardian invitation events).

## J. Open issues and implementation gaps

- Inbox endpoints rely solely on authentication with no permission code; this is
  intentional (self-scoped) but should be documented in any security review.
- No per-notification preferences or channel selection.
 The outbox dispatch currently supports only the `ATTENDANCE_ALERT_CREATED`
 event type; any other event type fails dispatch (`IllegalStateException`), and
 there is no external delivery provider in V1.
