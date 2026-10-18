# Multi-Institution User Invitation Integration

## Implemented frontend behavior

When the selected role has code `INSTITUTION_ADMIN`, User Management presents hierarchy selectors for enterprise, region, and cluster, followed by a searchable checklist of active institutions in the selected cluster. One or more institutions are required. The UI obtains the role ID from the existing roles API and does not hardcode UUIDs.

The frontend calls only existing endpoints:

- `GET /api/v1/roles?active=true&page=0&size=100`
- `GET /api/v1/enterprises`
- `GET /api/v1/regions/by-enterprise/{enterpriseId}`
- `GET /api/v1/clusters/by-region/{regionId}`
- `GET /api/v1/institutions/by-cluster/{clusterId}`
- `POST /api/v1/user-invitations`

Institution Admin requests use `scopes` with `scopeType: "INSTITUTION"`. Other invitation roles retain the existing single-scope request fields during migration. The UI never treats client-side checks as an authorization boundary.

## Expected Institution Admin request

```json
{
  "email": "admin@example.com",
  "username": "school-admin",
  "firstName": "School",
  "lastName": "Administrator",
  "roleId": "ROLE-UUID",
  "scopes": [
    { "scopeType": "INSTITUTION", "scopeId": "INSTITUTION-UUID-1" },
    { "scopeType": "INSTITUTION", "scopeId": "INSTITUTION-UUID-2" }
  ]
}
```

## Backend confirmations still required

- Confirm multi-scope request parsing and persistence are deployed.
- Confirm invitation success status and exact response DTO.
- Confirm returned `scopes[]` includes every assigned institution.
- Confirm invitation plus all scopes persist atomically and acceptance applies all scopes atomically.
- Confirm role assignability, active institution validation, duplicate-scope rejection, and organization authorization on the server.
- Confirm the existing error envelope and error codes.

The frontend does not infer that the proposed contract is deployed merely because the UI can send it.
