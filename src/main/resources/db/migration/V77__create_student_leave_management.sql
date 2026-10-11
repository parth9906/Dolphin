-- Student leave requests, mirroring the staff leave workflow (V27/V29).
-- Reuses the shared leave_type catalogue and LeaveRequestStatus state machine.
CREATE TABLE student_leave_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student(id),
    institution_id UUID NOT NULL REFERENCES institution(id),
    leave_type_id UUID NOT NULL REFERENCES leave_type(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(1000),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reviewed_by_user_id UUID REFERENCES user_account(id),
    reviewed_at TIMESTAMPTZ,
    decision_comment VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_student_leave_dates
        CHECK (end_date >= start_date),

    CONSTRAINT chk_student_leave_status
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),

    CONSTRAINT chk_student_leave_review
        CHECK (
            (status IN ('PENDING', 'CANCELLED')
                AND reviewed_by_user_id IS NULL
                AND reviewed_at IS NULL)
            OR
            (status IN ('APPROVED', 'REJECTED')
                AND reviewed_by_user_id IS NOT NULL
                AND reviewed_at IS NOT NULL)
        )
);

CREATE INDEX idx_student_leave_student_dates
    ON student_leave_request(student_id, start_date, end_date);

CREATE INDEX idx_student_leave_institution_status
    ON student_leave_request(institution_id, status, start_date);

CREATE TABLE student_leave_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leave_request_id UUID NOT NULL REFERENCES student_leave_request(id),
    previous_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by_user_id UUID NOT NULL REFERENCES user_account(id),
    comment VARCHAR(1000),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_student_leave_audit_request
    ON student_leave_audit(leave_request_id, changed_at DESC);
