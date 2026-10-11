# Discipline & Behaviour

Status: **Implemented**

[Shared conventions](../../../../../../../docs/api/README.md) apply.

## A. Module overview

Owns student discipline/behaviour incidents and their review workflow.

Included in V1: create incident, search, read-by-id, update status.

Excluded: consequences/actions, guardian notification, appeal workflow,
incident attachments.

Dependencies: `organization`, `student`, `identity`.

Principal classes: `controller/DisciplineIncidentController`,
`service/DisciplineIncidentService`,
`entity/{DisciplineIncident,DisciplineCategory,DisciplineSeverity,DisciplineIncidentStatus}`.

## B. API conventions

- Base path: `/api/v1/discipline/incidents`.
- Authentication: bearer; `DISCIPLINE_INCIDENT_CREATE/READ/UPDATE`.
- Scope: institution/campus scope.
- Pagination: search returns `Page<DisciplineIncidentResponse>` (default
  `size=20`, `sort=incidentDate`).
- Dates: `LocalDate`; timestamps `OffsetDateTime`.

## C. Endpoint inventory

| Method | Path | Purpose | Permission | Scope |
|---|---|---|---|---|
| POST | `/api/v1/discipline/incidents` | Create incident | `DISCIPLINE_INCIDENT_CREATE` | institution/campus |
| GET | `/api/v1/discipline/incidents` | Search incidents | `DISCIPLINE_INCIDENT_READ` | institution/campus |
| GET | `/api/v1/discipline/incidents/{incidentId}` | Read incident | `DISCIPLINE_INCIDENT_READ` | institution/campus |
| PATCH | `/api/v1/discipline/incidents/{incidentId}/status` | Update status | `DISCIPLINE_INCIDENT_UPDATE` | institution/campus |

All `Implemented`.

## D. Endpoint contracts

### POST /api/v1/discipline/incidents

`CreateDisciplineIncidentRequest`: `institutionId` (required), `campusId`
(optional), `studentId` (required), `category` (required), `severity`
(required), `description` (required, <= 2000), `incidentDate` (required, past
or present). Response `201` `DisciplineIncidentResponse` with status `OPEN`.

```json
{
  "institutionId": "1111...",
  "campusId": null,
  "studentId": "3333...",
  "category": "DISRUPTION",
  "severity": "MINOR",
  "description": "Repeatedly talking during class",
  "incidentDate": "2026-01-12"
}
```

`DisciplineCategory` = `BULLYING | PHYSICAL_AGGRESSION | DISRUPTION |
DISRESPECT | ACADEMIC_DISHONESTY | PROPERTY_DAMAGE | ATTENDANCE | OTHER`.
`DisciplineSeverity` = `MINOR | MODERATE | MAJOR`.

### GET /api/v1/discipline/incidents

Query: `institutionId` (required), `studentId` (optional), `campusId`
(optional), `status` (optional), `severity` (optional), `fromDate`/`toDate`
(optional), `page`,`size`,`sort`.

### GET /api/v1/discipline/incidents/{incidentId}

Response `200` `DisciplineIncidentResponse` (`id`, `institutionId`, `campusId`,
`studentId`, `admissionNumber`, `category`, `severity`, `description`,
`incidentDate`, `status`, `reportedByUserId`, `createdAt`, `updatedAt`).

### PATCH /api/v1/discipline/incidents/{incidentId}/status

`UpdateDisciplineIncidentStatusRequest`: `status` (required). Response `200`.
State machine (invalid transitions -> `422`):

```
OPEN         -> UNDER_REVIEW | RESOLVED | CLOSED
UNDER_REVIEW -> RESOLVED | CLOSED
RESOLVED     -> CLOSED
CLOSED       -> (terminal)
```

## E. Validation and business rules

- `incidentDate` must be past or present (`@PastOrPresent`).
- `description` required, <= 2000 chars.
- Status transitions restricted by the map above.

## F. Authorization matrix

| Permission | Read | Create | Update status |
|---|---|---|---|
| `DISCIPLINE_INCIDENT_READ` | yes | - | - |
| `DISCIPLINE_INCIDENT_CREATE` | - | yes | - |
| `DISCIPLINE_INCIDENT_UPDATE` | - | - | yes |

## G. Error contract

`400`, `403`, `404`, `422 BUSINESS_RULE_VIOLATION`.

## H. State transitions

See the map in D. `CLOSED` is terminal; no delete/reopen.

## I. Dependencies and integrations

- `student`: subject of the incident (must be in scope/institution).
- No guardian or student visibility of incidents in V1.

## J. Open issues and implementation gaps

- No consequences/actions, notifications, evidence or appeals.
- No delete or reopen.
- No pagination limit issue, but the search allows wide date ranges.
