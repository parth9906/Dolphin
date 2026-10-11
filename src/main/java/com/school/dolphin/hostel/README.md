# Hostel Management

Status: **Implemented**

[Shared conventions](../../../../../../../docs/api/README.md) apply.

## A. Module overview

Owns hostels, rooms and student room allocations (V1 feature #4).

Included in V1: hostel create/search/read/update/deactivate, room
create/search/read/update/deactivate, allocation create/search/read/vacate.

Excluded: mess/meal billing for boarders (see `mess`), visitor logs, room
maintenance, fee linkage.

Dependencies: `organization`, `student`, `identity`.

Principal classes: `controller/{HostelController,HostelRoomController,HostelAllocationController}`,
`service/{HostelService,HostelRoomService,HostelAllocationService}`,
`entity/{Hostel,HostelRoom,HostelAllocation,HostelType,HostelRoomType,HostelAllocationStatus}`.

## B. API conventions

- Base paths: `/api/v1/hostels`, `/api/v1/hostels/{hostelId}/rooms`,
  `/api/v1/hostels/{hostelId}/allocations`.
- Authentication: bearer; permissions in the inventory.
- Scope: institution/campus scope.
- Optimistic locking: hostels, rooms and allocations carry `version`; mutating
  calls require the current `version`.
- Pagination: all list endpoints return `Page<...>`.

## C. Endpoint inventory

| Method | Path | Purpose | Permission | Scope |
|---|---|---|---|---|
| POST | `/api/v1/hostels` | Create hostel | `HOSTEL_CREATE` | institution/campus |
| GET | `/api/v1/hostels` | Search hostels | `HOSTEL_READ` | institution/campus |
| GET | `/api/v1/hostels/{hostelId}` | Read hostel | `HOSTEL_READ` | institution/campus |
| PUT | `/api/v1/hostels/{hostelId}` | Update hostel | `HOSTEL_UPDATE` | institution/campus |
| PATCH | `/api/v1/hostels/{hostelId}/deactivate` | Deactivate hostel | `HOSTEL_UPDATE` | institution/campus |
| POST | `/api/v1/hostels/{hostelId}/rooms` | Create room | `HOSTEL_ROOM_CREATE` | institution/campus |
| GET | `/api/v1/hostels/{hostelId}/rooms` | Search rooms | `HOSTEL_ROOM_READ` | institution/campus |
| GET | `/api/v1/hostels/{hostelId}/rooms/{roomId}` | Read room | `HOSTEL_ROOM_READ` | institution/campus |
| PUT | `/api/v1/hostels/{hostelId}/rooms/{roomId}` | Update room | `HOSTEL_ROOM_UPDATE` | institution/campus |
| PATCH | `/api/v1/hostels/{hostelId}/rooms/{roomId}/deactivate` | Deactivate room | `HOSTEL_ROOM_UPDATE` | institution/campus |
| POST | `/api/v1/hostels/{hostelId}/allocations` | Allocate room | `HOSTEL_ALLOCATION_CREATE` | institution/campus |
| GET | `/api/v1/hostels/{hostelId}/allocations` | Search allocations | `HOSTEL_ALLOCATION_READ` | institution/campus |
| GET | `/api/v1/hostels/{hostelId}/allocations/{allocationId}` | Read allocation | `HOSTEL_ALLOCATION_READ` | institution/campus |
| PATCH | `/api/v1/hostels/{hostelId}/allocations/{allocationId}/vacate` | Vacate | `HOSTEL_ALLOCATION_UPDATE` | institution/campus |

All `Implemented`.

## D. Endpoint contracts

### POST /api/v1/hostels

`CreateHostelRequest`: `institutionId` (required), `campusId` (optional),
`code` (required, <= 50, unique per institution case-insensitive), `name`
(required, <= 200), `hostelType` (`BOYS|GIRLS|CO_ED`, required), `wardenName`
(<= 200), `address` (<= 2000). Response `201` `HostelResponse`.

`HostelResponse`: `{ id, institutionId, campusId, code, name, hostelType,
wardenName, address, active, createdByUserId, createdAt, updatedAt, version }`.

### GET /api/v1/hostels

Query: `institutionId` (required), `campusId` (optional), `active` (optional),
`page`,`size`,`sort` (default `size=20`, `sort=name`).

### PUT /api/v1/hostels/{hostelId}

`UpdateHostelRequest`: `name`, `hostelType`, `wardenName`, `address`, `version`
(all `version`/`name`/`hostelType` required). Response `200`. `409` on stale
version.

### PATCH /api/v1/hostels/{hostelId}/deactivate

No body. Response `200` `HostelResponse` with `active=false`.
Rule: blocked (`422`) when active allocations exist.

### POST /api/v1/hostels/{hostelId}/rooms

`CreateHostelRoomRequest`: `roomNumber` (required, <= 20, unique per hostel
case-insensitive), `floor` (optional), `roomType`
(`SINGLE|DOUBLE|TRIPLE|DORMITORY`, required), `capacity` (required, >= 1).
Response `201` `HostelRoomResponse`.

`HostelRoomResponse`: `{ id, hostelId, roomNumber, floor, roomType, capacity,
occupied, available, active, createdAt, updatedAt, version }`. `available =
max(0, capacity - occupied)`.

### PUT /api/v1/hostels/{hostelId}/rooms/{roomId}

`UpdateHostelRoomRequest`: `roomNumber`, `floor`, `roomType`, `capacity`,
`version`. Response `200`. Uses a pessimistic row lock so concurrent updates
cannot over-allocate. `409` on stale version.

### PATCH /api/v1/hostels/{hostelId}/rooms/{roomId}/deactivate

Response `200` with `active=false`.

### POST /api/v1/hostels/{hostelId}/allocations

`CreateHostelAllocationRequest`: `studentId` (required), `roomId` (required),
`startDate` (required), `endDate` (optional), `notes` (<= 500).
Response `201` `HostelAllocationResponse` (status `ACTIVE`).
Rules: hostel and room active; student active; no existing `ACTIVE` allocation
for the student (`409`); room not at capacity (`422`, checked under lock).

### GET /api/v1/hostels/{hostelId}/allocations

Query: `roomId` (optional), `studentId` (optional), `status`
(`ACTIVE|VACATED`, optional), `page`,`size`,`sort` (default `size=20`,
`sort=createdAt,desc`).

### PATCH /api/v1/hostels/{hostelId}/allocations/{allocationId}/vacate

`VacateHostelAllocationRequest`: `endDate` (optional), `version` (required).
Response `200` `HostelAllocationResponse` (status `VACATED`).
Rules: only `ACTIVE` allocations can be vacated; `409` on stale version.

## E. Validation and business rules

- Hostel `code` and room `roomNumber` are unique (case-insensitive).
- Room capacity >= 1; allocation blocked at capacity under a lock.
- A student has at most one `ACTIVE` allocation.
- Deactivation guards prevent orphaning active allocations/occupancy.
- Optimistic locking on all three entities.

## F. Authorization matrix

| Permission | Read | Create | Update | Deactivate | Allocate |
|---|---|---|---|---|---|
| `HOSTEL_READ` | yes | - | - | - | - |
| `HOSTEL_CREATE` | - | yes | - | - | - |
| `HOSTEL_UPDATE` | - | - | yes | yes | - |
| `HOSTEL_ROOM_READ` | yes | - | - | - | - |
| `HOSTEL_ROOM_CREATE` | - | yes | - | - | - |
| `HOSTEL_ROOM_UPDATE` | - | - | yes | yes | - |
| `HOSTEL_ALLOCATION_READ` | yes | - | - | - | - |
| `HOSTEL_ALLOCATION_CREATE` | - | yes | - | - | yes |
| `HOSTEL_ALLOCATION_UPDATE` | - | - | yes (vacate) | - | - |

## G. Error contract

`400`, `403`, `404`, `409 DUPLICATE_RESOURCE`/`CONCURRENT_MODIFICATION`,
`422 BUSINESS_RULE_VIOLATION`.

## H. State transitions

```
HostelAllocation: ACTIVE --vacate--> VACATED (terminal)
```

Hostels/rooms are `active` until deactivated; deactivation is one-way in V1.

## I. Dependencies and integrations

- `student`: allocation ownership.
- `mess`: boarder meal records are independent of allocation in V1 (no linkage).

## J. Open issues and implementation gaps

- No reactivation for hostels/rooms; no delete.
- Room `roomType` and `capacity` are not cross-validated (e.g. `SINGLE` with
  capacity > 1 is allowed).
- No waitlist, room transfer or warden assignment model beyond a free-text name.
- No linkage between hostel occupancy and mess billing.
