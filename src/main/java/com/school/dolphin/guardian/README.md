# Guardians

Status: **Implemented** (with a broken onboarding path, see K)

[Shared conventions](../../../../../../../docs/api/README.md) apply.

## A. Module overview

Owns guardian profiles, student-guardian relationships and the guardian
invitation flow that lets a guardian create a portal account.

Included in V1: create/read/update/deactivate guardian, link/unlink guardian to
student, list a student's guardians, create an invitation, accept an invitation.

Excluded: guardian self-service, multiple-account linking, guardian app.

Dependencies: `organization`, `student`, `identity` (creates a user account with
the `GUARDIAN` role on acceptance), `notification` (intended invitation delivery).

Principal classes: `controller/{GuardianController,GuardianInvitationController}`,
`service/{GuardianService,GuardianInvitationService,InvitationTokenService}`,
`entity/{Guardian,StudentGuardian,GuardianInvitation}`.

## B. API conventions

- Base paths: `/api/v1/guardians`, `/api/v1/students/...`,
  `/api/v1/guardian-invitations`.
- Authentication: bearer for all except `POST /api/v1/guardian-invitations/accept`
  (public).
- Scope: institution scope for guardian CRUD/link.
- Invitation tokens are hashed at rest. The raw token is returned **once** by
  the create-invitation endpoint (Option A: manual delivery) and is never
  returned or logged again.

## C. Endpoint inventory

| Method | Path | Purpose | Permission | Scope |
|---|---|---|---|---|
| POST | `/api/v1/guardians` | Create guardian | `GUARDIAN_CREATE` | institution |
| GET | `/api/v1/guardians/{guardianId}` | Read guardian | `GUARDIAN_READ` | institution |
| PUT | `/api/v1/guardians/{guardianId}` | Update guardian | `GUARDIAN_UPDATE` | institution |
| PATCH | `/api/v1/guardians/{guardianId}/deactivate` | Deactivate guardian | `GUARDIAN_DEACTIVATE` | institution |
| POST | `/api/v1/students/{studentId}/guardians/{guardianId}` | Link guardian | `STUDENT_GUARDIAN_LINK` | institution |
| GET | `/api/v1/students/{studentId}/guardians` | List student guardians | `GUARDIAN_READ` | institution |
| DELETE | `/api/v1/students/{studentId}/guardians/{guardianId}` | Unlink guardian | `STUDENT_GUARDIAN_UNLINK` | institution |
| POST | `/api/v1/guardian-invitations/{guardianId}` | Create invitation | `GUARDIAN_INVITE` | institution |
| POST | `/api/v1/guardian-invitations/accept` | Accept invitation | none (public) | none |

All `Implemented`.

## D. Endpoint contracts

### POST /api/v1/guardians

`CreateGuardianRequest`: `institutionId` (required), `firstName` (required,
<= 100), `lastName` (<= 100), `email` (valid, <= 255), `phone` (<= 30).
Response `201` `GuardianResponse` (`{ id, institutionId, firstName, lastName,
email, phone, active }`).

### PUT /api/v1/guardians/{guardianId}

`UpdateGuardianRequest`: `firstName` (required), `lastName`, `email`, `phone`.
Response `200` `GuardianResponse`.

### PATCH /api/v1/guardians/{guardianId}/deactivate

No body. Response `200` `GuardianResponse` with `active=false`.

### POST /api/v1/students/{studentId}/guardians/{guardianId}

`LinkGuardianRequest`: `relationshipType` (required, <= 30), `primaryContact`
(boolean), `pickupAuthorized` (boolean). Response `201`
`StudentGuardianResponse` (`{ guardianId, firstName, lastName, email, phone,
relationshipType, primaryContact, pickupAuthorized }`).
Errors: `403`, `404`, `409` (already linked).

### GET /api/v1/students/{studentId}/guardians

Response `200` `List<StudentGuardianResponse>`.

### DELETE /api/v1/students/{studentId}/guardians/{guardianId}

Response `204`. Errors `403`, `404`.

### POST /api/v1/guardian-invitations/{guardianId}

`CreateGuardianInvitationRequest`: `email` (required, valid, <= 255).
Response `201` (`GuardianInvitationResponse`):
`{ invitationId, token, email, expiresAt }`. The `token` is the raw acceptance
secret and is returned **once**, only to a caller holding `GUARDIAN_INVITE`, so
it can be delivered to the guardian out of band (Option A: manual delivery). It
is stored only as a hash, is single-use, and expires after
`INVITATION_VALIDITY_HOURS` (24). Creating an invitation revokes any earlier
pending invitation for the same guardian, so at most one valid token exists at a
time.

### POST /api/v1/guardian-invitations/accept

Public. `AcceptGuardianInvitationRequest`: `token` (required), `password`
(required, 8..72). Response `201` (`GuardianAccountAcceptedResponse`):
`{ userId, username, message }`.
Rules: token must match a stored hash, be unexpired, unaccepted and unrevoked;
creates a `UserAccount` with the `GUARDIAN` role and marks the invitation
accepted. Errors: `400`, `422` (invalid/expired/used invitation; guardian role
missing). No token is issued by this endpoint (log in afterwards).

## E. Validation and business rules

- Invitation tokens: random, stored only as a hash, single-use, expiring,
  row-locked on accept (`findByTokenHashForUpdate`).
- A guardian can be linked to many students; a student-guardian link is unique.
- `@Version` optimistic locking on guardians.

## F. Authorization matrix

| Permission | Read | Create | Update | Deactivate | Link/Unlink | Invite |
|---|---|---|---|---|---|---|
| `GUARDIAN_READ` | yes | - | - | - | (list) | - |
| `GUARDIAN_CREATE` | - | yes | - | - | - | - |
| `GUARDIAN_UPDATE` | - | - | yes | - | - | - |
| `GUARDIAN_DEACTIVATE` | - | - | - | yes | - | - |
| `STUDENT_GUARDIAN_LINK` / `STUDENT_GUARDIAN_UNLINK` | - | - | - | - | yes | - |
| `GUARDIAN_INVITE` | - | - | - | - | - | yes |

## G. Error contract

`400`, `403`, `404`, `409 DUPLICATE_RESOURCE`, `422 BUSINESS_RULE_VIOLATION`
(invalid/expired invitation).

## H. State transitions

```
GuardianInvitation: pending --accept--> accepted
                                \--revoke (superseded)--> revoked
                                \--expiry--> expired
```

## I. Dependencies and integrations

- `identity`: acceptance creates a user account with the `GUARDIAN` role, which
  grants `PARENT_PORTAL_READ`.
- `parent`: the parent portal resolves linked students through these
  relationships.
- `notification`: intended channel for invitation delivery (see K).

## J. Open issues and implementation gaps

- **Resolved (was: broken invitation delivery).** Delivery is now manual
  (Option A): `POST /guardian-invitations/{guardianId}` returns the raw `token`
  once to the authorised caller, who delivers it out of band. The token stays
  hash-only at rest, single-use and 24h-expiring, and acceptance creates the
  guardian account and relationship. `GuardianInvitationCreatedEvent` is still
  published but currently has **no listener**; it is retained only as a possible
  future email/outbox extension point and is **not** part of V1 delivery.
- No endpoint to list/revoke invitations.
- No email-change/`email` ownership verification beyond the token.
- No guardian self-service profile updates.
