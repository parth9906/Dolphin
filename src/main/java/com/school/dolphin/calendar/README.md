# Events & Calendar

Status: **Implemented**

[Shared conventions](../../../../../../../docs/api/README.md) apply.

## A. Module overview

Owns institution/campus calendar events (holidays, exams, meetings, sports,
cultural, other).

Included in V1: create, search, read-by-id, update, deactivate.

Excluded: recurring events, invitations/RSVP, event-to-timetable linking.

Dependencies: `organization`, `identity`.

Principal classes: `controller/CalendarEventController`,
`service/CalendarEventService`,
`entity/{CalendarEvent,CalendarEventType}`.

## B. API conventions

- Base path: `/api/v1/calendar-events`.
- Authentication: bearer; `CALENDAR_EVENT_CREATE/READ/UPDATE/DEACTIVATE`.
- Scope: institution scope (campus where supplied).
- Pagination: search returns `Page<CalendarEventResponse>` (default `size=20`,
  `sort=startDate`).
- Dates: `LocalDate`; times `LocalTime`.
- `CalendarEventType` = `HOLIDAY | EXAM | MEETING | SPORTS | CULTURAL | OTHER`.

## C. Endpoint inventory

| Method | Path | Purpose | Permission | Scope |
|---|---|---|---|---|
| POST | `/api/v1/calendar-events` | Create event | `CALENDAR_EVENT_CREATE` | institution/campus |
| GET | `/api/v1/calendar-events` | Search events | `CALENDAR_EVENT_READ` | institution/campus |
| GET | `/api/v1/calendar-events/{eventId}` | Read event | `CALENDAR_EVENT_READ` | institution/campus |
| PUT | `/api/v1/calendar-events/{eventId}` | Update event | `CALENDAR_EVENT_UPDATE` | institution/campus |
| POST | `/api/v1/calendar-events/{eventId}/deactivate` | Deactivate event | `CALENDAR_EVENT_DEACTIVATE` | institution/campus |

All `Implemented`.

## D. Endpoint contracts

### POST /api/v1/calendar-events

`CreateCalendarEventRequest`: `institutionId` (required), `campusId`
(optional), `title` (required, <= 200), `description` (<= 2000), `eventType`
(required), `startDate`, `endDate` (required), `startTime`, `endTime`
(optional). Response `201` `CalendarEventResponse`.

```json
{
  "id": "5a1e...",
  "institutionId": "1111...",
  "campusId": null,
  "title": "Annual Sports Day",
  "description": "Inter-house athletics",
  "eventType": "SPORTS",
  "startDate": "2026-02-10",
  "endDate": "2026-02-10",
  "startTime": "09:00:00",
  "endTime": "16:00:00",
  "active": true,
  "createdByUserId": "abcd...",
  "createdAt": "2026-01-20T10:00:00+05:30",
  "updatedAt": "2026-01-20T10:00:00+05:30"
}
```

Errors: `400`, `403`, `404`, `422` (date/type rules).

### GET /api/v1/calendar-events

Query: `institutionId` (required), `campusId` (optional), `eventType`
(optional), `fromDate`/`toDate` (optional), `page`,`size`,`sort`.
Response `200` `Page<CalendarEventResponse>`.

### GET /api/v1/calendar-events/{eventId}

Response `200` `CalendarEventResponse`; `403`/`404`.

### PUT /api/v1/calendar-events/{eventId}

`UpdateCalendarEventRequest`: `campusId` (optional), `title`, `description`,
`eventType`, `startDate`, `endDate`, `startTime`, `endTime`. Response `200`.

### POST /api/v1/calendar-events/{eventId}/deactivate

No body. Response `200` `CalendarEventResponse` with `active=false`.

## E. Validation and business rules

- `title`, `eventType`, `startDate`, `endDate` required.
- Date/time consistency rules enforced in the service (`422` on violation).
- Institution scope required; campus scope enforced where a campus is supplied.
- Deactivated events are excluded from default searches.

## F. Authorization matrix

| Permission | Read | Create | Update | Deactivate |
|---|---|---|---|---|
| `CALENDAR_EVENT_READ` | yes | - | - | - |
| `CALENDAR_EVENT_CREATE` | - | yes | - | - |
| `CALENDAR_EVENT_UPDATE` | - | - | yes | - |
| `CALENDAR_EVENT_DEACTIVATE` | - | - | - | yes |

## G. Error contract

`400`, `403`, `404`, `422 BUSINESS_RULE_VIOLATION`.

## H. State transitions

```
active --POST /{id}/deactivate--> inactive
```

Reversible? No reactivation endpoint in V1.

## I. Dependencies and integrations

- `organization`: institution/campus scope.
- Portals: no dedicated portal calendar endpoint in V1.

## J. Open issues and implementation gaps

- No reactivation or delete.
- No recurring events.
- No student/parent calendar projection.
