
CREATE TABLE student_account_link (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id UUID NOT NULL
        REFERENCES student(id),

    user_account_id UUID NOT NULL
        REFERENCES user_account(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_student_account_link_student
        UNIQUE (student_id),

    CONSTRAINT uq_student_account_link_user
        UNIQUE (user_account_id)
);

CREATE INDEX idx_student_account_link_user
    ON student_account_link (user_account_id);
