-- Document templates and issued certificates/documents. V1 stores rendered
-- document text in PostgreSQL; binary attachments/object storage remains an
-- open decision (see document/README.md).
CREATE TABLE document_template (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institution(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(120) NOT NULL,
    body TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_document_template_institution_code
        UNIQUE (institution_id, code)
);

CREATE INDEX idx_document_template_institution
    ON document_template(institution_id, active);

CREATE TABLE issued_document (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student(id),
    institution_id UUID NOT NULL REFERENCES institution(id),
    template_id UUID NOT NULL REFERENCES document_template(id),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    issued_by_user_id UUID NOT NULL REFERENCES user_account(id),
    issued_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_issued_document_student
    ON issued_document(student_id, institution_id, issued_at DESC);

CREATE INDEX idx_issued_document_institution
    ON issued_document(institution_id, issued_at DESC);
