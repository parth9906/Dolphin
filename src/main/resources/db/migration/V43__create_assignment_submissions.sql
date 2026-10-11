
CREATE TABLE assignment_submission (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    assignment_id UUID NOT NULL
        REFERENCES assignment(id),

    student_id UUID NOT NULL
        REFERENCES student(id),

    submission_text TEXT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',

    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_assignment_submission_student
        UNIQUE (assignment_id, student_id),

    CONSTRAINT chk_assignment_submission_status
        CHECK (status IN ('SUBMITTED', 'LATE', 'GRADED')),

    CONSTRAINT chk_assignment_submission_text
        CHECK (length(trim(submission_text)) > 0)
);

CREATE INDEX idx_assignment_submission_student
    ON assignment_submission (student_id, submitted_at DESC);

CREATE INDEX idx_assignment_submission_assignment
    ON assignment_submission (assignment_id, status, submitted_at DESC);
