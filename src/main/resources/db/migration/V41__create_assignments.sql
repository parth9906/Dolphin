CREATE TABLE assignment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    institution_id UUID NOT NULL
        REFERENCES institution(id),

    section_id UUID NOT NULL
        REFERENCES class_section(id),

    created_by_staff_id UUID NOT NULL
        REFERENCES staff_member(id),

    title VARCHAR(200) NOT NULL,
    instructions TEXT NOT NULL,

    due_at TIMESTAMPTZ NOT NULL,
    max_marks NUMERIC(8, 2) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    published_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_assignment_max_marks
        CHECK (max_marks > 0),

    CONSTRAINT chk_assignment_status
        CHECK (status IN ('DRAFT', 'PUBLISHED')),

    CONSTRAINT chk_assignment_published_at
        CHECK (
            (status = 'DRAFT' AND published_at IS NULL)
            OR
            (status = 'PUBLISHED' AND published_at IS NOT NULL)
        )
);

CREATE INDEX idx_assignment_institution_created
    ON assignment (institution_id, created_at DESC);

CREATE INDEX idx_assignment_section_status_due
    ON assignment (section_id, status, due_at);

CREATE INDEX idx_assignment_creator
    ON assignment (created_by_staff_id, created_at DESC);