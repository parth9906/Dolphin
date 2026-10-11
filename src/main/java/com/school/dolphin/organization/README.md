# Organization Hierarchy

Status: **Implemented**

[Shared conventions](../../../../../../../docs/api/README.md) apply.

## A. Module overview

Owns the organization hierarchy `Enterprise -> Region -> Cluster -> Institution
-> Campus`. Every scoped module resolves institution/campus access through these
nodes.

Included in V1: create and read-by-id for each level; list children
(regions of an enterprise, clusters of a region).

Excluded: update/deactivate/delete of organization nodes; list of campuses or
institutions (only read-by-id).

Dependencies: none (root module). Consumed by `identity` scopes and every
scoped module.

Principal classes: `controller/{EnterpriseController,RegionController,ClusterController,InstitutionController,CampusController}`,
services of the same names, `entity/{Enterprise,Region,Cluster,Institution,Campus}`.

## B. API conventions

- Base path: `/api/v1`.
- Authentication: bearer; permissions as in the inventory.
- Scope: organization nodes are scope-checked like every other module. Reads
  require a scope at or above the requested node (`ENTERPRISE` scope for an
  enterprise; `ENTERPRISE`/`REGION` for a region; the same plus `CLUSTER` for a
  cluster; `INSTITUTION` for an institution; campus rules as elsewhere).
  Create-under-parent requires scope over the parent node (`canAccessEnterprise`
  for regions, `canAccessRegion` for clusters, `canAccessCluster` for
  institutions, `canAccessInstitution` for campuses). Creating an enterprise has
  no parent and remains permission-gated only, consistent with
  `docs/api/README.md`.
- Pagination: none (child listings return full lists).

## C. Endpoint inventory

| Method | Path | Purpose | Permission | Scope | Status |
|---|---|---|---|---|---|
| POST | `/api/v1/enterprises` | Create enterprise | `ENTERPRISE_CREATE` | none (no parent) | Implemented |
| GET | `/api/v1/enterprises/{id}` | Read enterprise | `ENTERPRISE_READ` | enterprise | Implemented |
| POST | `/api/v1/regions` | Create region | `REGION_CREATE` | enterprise (parent) | Implemented |
| GET | `/api/v1/regions/{id}` | Read region | `REGION_READ` | region | Implemented |
| GET | `/api/v1/regions/by-enterprise/{enterpriseId}` | List regions | `REGION_READ` | enterprise | Implemented |
| POST | `/api/v1/clusters` | Create cluster | `CLUSTER_CREATE` | region (parent) | Implemented |
| GET | `/api/v1/clusters/{id}` | Read cluster | `CLUSTER_READ` | cluster | Implemented |
| GET | `/api/v1/clusters/by-region/{regionId}` | List clusters | `CLUSTER_READ` | region | Implemented |
| POST | `/api/v1/institutions` | Create institution | `INSTITUTION_CREATE` | cluster (parent) | Implemented |
| GET | `/api/v1/institutions/{id}` | Read institution | `INSTITUTION_READ` | institution | Implemented |
| POST | `/api/v1/campuses` | Create campus | `CAMPUS_CREATE` | institution (parent) | Implemented |
| GET | `/api/v1/campuses/{id}` | Read campus | `CAMPUS_READ` | campus | Implemented |

## D. Endpoint contracts

All create endpoints return `201` and the corresponding response record; all
read endpoints return `200`. Missing parents return `404 RESOURCE_NOT_FOUND`;
duplicate `code` returns `409 DUPLICATE_RESOURCE` (or `409 CONSTRAINT_VIOLATION`).

### POST /api/v1/enterprises

- Request `CreateEnterpriseRequest`: `code` (required, <= 50), `name` (required, <= 200).
- Response `EnterpriseResponse`: `{ id, code, name, active }`.

```json
{ "code": "DOLPHIN", "name": "Dolphin Education Group" }
```

### POST /api/v1/regions

- Request `CreateRegionRequest`: `enterpriseId` (UUID, required), `code`
  (required, <= 50), `name` (required, <= 200).
- Response `RegionResponse`: `{ id, enterpriseId, code, name, active }`.

### GET /api/v1/regions/by-enterprise/{enterpriseId}

- Returns `List<RegionResponse>` (not paginated).

### POST /api/v1/clusters

- Request `CreateClusterRequest`: `regionId` (UUID, required), `code`, `name`.
- Response `ClusterResponse`: `{ id, regionId, code, name, active }`.

### GET /api/v1/clusters/by-region/{regionId}

- Returns `List<ClusterResponse>` (not paginated).

### POST /api/v1/institutions

- Request `CreateInstitutionRequest`: `clusterId` (UUID, required), `code`,
  `name`, `institutionType` (required, <= 50).
- Response `InstitutionResponse`: `{ id, clusterId, code, name, institutionType, active }`.

### POST /api/v1/campuses

- Request `CreateCampusRequest`: `institutionId` (UUID, required), `code`,
  `name`, `address` (optional).
- Response `CampusResponse`: `{ id, institutionId, code, name, address, active }`.

### GET /api/v1/enterprises/{id} (and sibling read endpoints)

- Response `200` with the matching response record. `404` if absent.

## E. Validation and business rules

- All `code`/`name` fields required, `code` <= 50, `name` <= 200, `institutionType`
  <= 50.
- Parent references must exist; the module does not verify hierarchy-level
  consistency beyond existence.
- New nodes are created `active=true`.

## F. Authorization matrix

| Permission family | Read | Create |
|---|---|---|
| `ENTERPRISE_*`, `REGION_*`, `CLUSTER_*`, `INSTITUTION_*`, `CAMPUS_*` | yes | yes |

No organization-scope restriction: this is the module that defines scopes, and
it is administratively gated by permission only.

## G. Error contract

`400 VALIDATION_ERROR`, `403 ACCESS_DENIED`, `404 RESOURCE_NOT_FOUND`,
`409 DUPLICATE_RESOURCE`/`CONSTRAINT_VIOLATION`.

## H. State transitions

Nodes are created `active` and have no lifecycle endpoint in V1. Deactivation
would be required to cascade correctly (an inactive node blocks scope checks);
no endpoint exists yet.

## I. Dependencies and integrations

Everything that stores an `institution_id` or `campus_id` depends on this module:
`identity` (scopes), `student`, `staff`, `academic`, `attendance`, `assessment`,
`timetable`, `leave`, `calendar`, `guardian`, `homework`, `discipline`,
`admissions`, `hostel`, `inventory`, `mess`, `notification`.

## J. Open issues and implementation gaps

- No update/deactivate/delete endpoints for any node.
- No list endpoint for institutions or campuses (only read-by-id).
- No uniqueness error is guaranteed as `DUPLICATE_RESOURCE`; a race can surface
  as `CONSTRAINT_VIOLATION`.
- No audit trail for organization changes.
