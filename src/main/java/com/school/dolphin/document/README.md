# Certificates & Documents

Status: **Partially Implemented** (templates + issued documents ship; binary
attachments and rendering-to-PDF remain proposals)

[Shared conventions](../../../../../../../docs/api/README.md) apply.

## A. Module overview

The `document` package owns document templates and issued documents.
`document_template` and `issued_document` tables ship in migrations `V80`/`V81`;
certificates are simply named templates. Rendering substitutes `{{student_name}}`,
`{{student_id}}`, `{{admission_number}}`, `{{institution_name}}` and
`{{issue_date}}` placeholders and stores the rendered text in PostgreSQL.

Everything not marked "Implemented" below remains a proposal.

## B. Conventions

- Base path: `/api/v1/documents`.
- Authentication: bearer.
- Permissions: `DOCUMENT_TEMPLATE_CREATE`, `DOCUMENT_TEMPLATE_READ`,
  `DOCUMENT_ISSUE`,
  `DOCUMENT_READ`.
- Scope: institution scope; issued documents are owned by a student and must be
  scope-checked.
- Storage: metadata and rendered text in PostgreSQL for V1; binary file bytes in
  object storage remain an open decision. The repository has no storage
  dependency, so V1 stores text only.
- Timestamps: `OffsetDateTime` for issue/generation times.

## C. Endpoint inventory

| Method | Path | Purpose | Permission | Status |
|---|---|---|---|
| POST | `/api/v1/documents/templates` | Create a template | `DOCUMENT_TEMPLATE_CREATE` | Implemented |
| GET | `/api/v1/documents/templates?institutionId` | List templates | `DOCUMENT_TEMPLATE_READ` | Implemented |
| POST | `/api/v1/documents/issue` | Issue a document for a student | `DOCUMENT_ISSUE` | Implemented |
| GET | `/api/v1/documents/{documentId}` | Read issued document (admin, institution scope) | `DOCUMENT_READ` | Implemented |
| GET | `/api/v1/students/{studentId}/documents` | List a student's documents | `DOCUMENT_READ` | Implemented |
| GET | `/api/v1/student-portal/documents` | My documents (self) | `STUDENT_PORTAL_READ` | Implemented |

## D. Data model (implemented)

- `document_template`: id, institution_id, code, name, body (or template ref),
  active.
- `issued_document`: id, student_id, institution_id, template_id, title,
  content, issued_by_user_id, issued_at, created_at. Unique
  `(institution_id, code)` on templates; indexes on institution/student.

Unique sequential `document_number` is not yet implemented (V1 stores rendered
text; numbering is a proposal).

## E. Behaviour (implemented)

- Templates are institution-scoped; duplicate `(institution_id, code)` is
  rejected with `409 DUPLICATE_RESOURCE`.
- Issuing renders the template for an active student of the institution and
  stores the artifact, returning metadata.
- Issued documents are immutable after creation in V1.
- Students can read only their own documents via the student portal.
- Certificates (bonafide, transfer, character) are simply named templates.

## F. Validation and business rules

- Unique template code per institution.
- Only active templates can be used to issue.
- Issue/read enforce institution scope; portal reads enforce ownership.

## G. Authorization matrix

| Permission | Read | Create | Issue |
|---|---|---|---|
| `DOCUMENT_TEMPLATE_READ` | yes | - | - |
| `DOCUMENT_TEMPLATE_CREATE` | - | yes | - |
| `DOCUMENT_READ` | yes | - | - |
| `DOCUMENT_ISSUE` | - | - | yes |
| `STUDENT_PORTAL_READ` | self | - | - |

## H. Error contract

Standard codes; `403` out-of-scope, `404` unknown document/template/student,
`409` duplicate template code.

## I. State transitions (proposal)

```
issued_document: ISSUED --revoke--> REVOKED   (proposal only)
```

## J. Dependencies and integrations

`student` (data), `organization` (institution scope), `identity` (permissions).
Object storage is external and undecided.

## K. Open issues and implementation gaps

- No `document_number`/monotonic numbering or issuance audit trail yet.
- No storage technology decision (object storage vs local filesystem).
- Templates/rendering technology: text placeholders only (HTML->PDF undecided).
- Template versioning and parent-portal document reads are proposed but not
  implemented.
- Open question (product decision): which documents are in scope for V1
  (bonafide, transfer certificate, character certificate, ID card)?
