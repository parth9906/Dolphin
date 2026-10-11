# Certificates & Documents

Status: **Proposed — Not Yet Implemented**

[Shared conventions](../../../../../../../docs/api/README.md) apply.

## A. Module overview

The `document` package is currently empty. There are **no** endpoints, entities,
services or migrations for certificates/documents. V1 feature #15
("Certificates and Documents") is not implemented.

Everything below is a proposal and requires approval before implementation.

## B. Proposal: conventions

- Base path (proposed): `/api/v1/documents`.
- Authentication: bearer.
- Permissions (proposed): `DOCUMENT_TEMPLATE_*`, `DOCUMENT_ISSUE`,
  `DOCUMENT_READ`.
- Scope: institution scope; issued documents are owned by a student and must be
  scope-checked.
- Storage: metadata in PostgreSQL; file bytes in object storage (not yet
  chosen). The repository currently has no storage dependency, so this is an
  open decision.
- Timestamps: `OffsetDateTime` for issue/generation times.

## C. Proposal: endpoint inventory

| Method | Path (proposed) | Purpose | Permission (proposed) |
|---|---|---|---|
| POST | `/api/v1/documents/templates` | Create a template | `DOCUMENT_TEMPLATE_CREATE` |
| GET | `/api/v1/documents/templates` | List templates | `DOCUMENT_TEMPLATE_READ` |
| POST | `/api/v1/documents/issue` | Issue a document for a student | `DOCUMENT_ISSUE` |
| GET | `/api/v1/documents/{documentId}` | Read issued document metadata | `DOCUMENT_READ` |
| GET | `/api/v1/students/{studentId}/documents` | List a student's documents | `DOCUMENT_READ` |
| GET | `/api/v1/student-portal/documents` | My documents | `STUDENT_PORTAL_READ` |

All are **proposed**; none exist today.

## D. Proposed data model (unapproved)

- `document_template`: id, institution_id, code, name, body (or template ref),
  active.
- `issued_document`: id, student_id, institution_id, template_id,
  document_number, issued_at, issued_by_user_id, storage_key, status.

These tables do not exist; proposed migrations would need to define foreign keys,
unique `document_number`, and indexes on `(institution_id)` and `(student_id)`.

## E. Proposed behaviour (unapproved)

- Templates are institution-scoped and versioned.
- Issuing renders a template for a student (using data from `student`,
  `academic`, `assessment`) and stores a generated artifact, returning metadata.
- Students/parents can read their own issued documents only.
- Certificates (bonafide, transfer, character) are simply named templates.

## F. Validation and business rules (proposed)

- Unique `document_number`; monotonic numbering per institution/year.
- Only active templates can be used to issue.
- Issue/read enforce institution scope; portal reads enforce ownership.

## G. Authorization matrix (proposed)

| Permission | Read | Create | Issue |
|---|---|---|---|
| `DOCUMENT_TEMPLATE_READ` | yes | - | - |
| `DOCUMENT_TEMPLATE_CREATE` | - | yes | - |
| `DOCUMENT_READ` | yes | - | - |
| `DOCUMENT_ISSUE` | - | - | yes |
| `STUDENT_PORTAL_READ` | self | - | - |

## H. Error contract (proposed)

Standard codes; `403` out-of-scope, `404` unknown document/template, `409`
duplicate `document_number`, `422` issuing from an inactive template.

## I. State transitions (proposed)

```
issued_document: ISSUED --revoke--> REVOKED   (proposal only)
```

## J. Dependencies and integrations (proposed)

`student`, `academic`, `assessment` (data), `identity` (permissions),
object storage (external, undecided).

## K. Open issues and implementation gaps

- Feature entirely unimplemented (V1 #15 outstanding).
- No storage technology decision (object storage vs local filesystem).
- No permissions defined in the database yet; a migration is required.
- Templates/rendering technology undecided (HTML->PDF vs other).
- Open question (product decision): which documents are in scope for V1
  (bonafide, transfer certificate, character certificate, ID card)?
