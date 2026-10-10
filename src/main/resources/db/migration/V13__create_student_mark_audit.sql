
CREATE TABLE student_mark_audit (
    id UUID PRIMARY KEY,
    student_mark_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    previous_marks NUMERIC(8, 2) NOT NULL,
    new_marks NUMERIC(8, 2) NOT NULL,
    previous_remarks VARCHAR(500),
    new_remarks VARCHAR(500),
    changed_by_user_id UUID NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT fk_student_mark_audit_mark
        FOREIGN KEY (student_mark_id) REFERENCES student_mark(id),

    CONSTRAINT fk_student_mark_audit_user
        FOREIGN KEY (changed_by_user_id) REFERENCES user_account(id),

    CONSTRAINT chk_student_mark_audit_action
        CHECK (action = 'UPDATED'),

    CONSTRAINT chk_student_mark_audit_previous
        CHECK (previous_marks >= 0),

    CONSTRAINT chk_student_mark_audit_new
        CHECK (new_marks >= 0)
);

CREATE INDEX idx_student_mark_audit_history
    ON student_mark_audit(student_mark_id, changed_at DESC);