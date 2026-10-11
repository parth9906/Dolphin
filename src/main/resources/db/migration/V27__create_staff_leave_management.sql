
CREATE TABLE leave_type (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(80) NOT NULL,
    description VARCHAR(250),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO leave_type (code, name, description)
VALUES
    ('ANNUAL', 'Annual Leave', 'Planned personal or vacation leave'),
    ('SICK', 'Sick Leave', 'Leave due to illness'),
    ('PERSONAL', 'Personal Leave', 'Leave for personal matters'),
    ('UNPAID', 'Unpaid Leave', 'Approved leave without pay');

CREATE TABLE staff_leave_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_member_id UUID NOT NULL REFERENCES staff_member(id),
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

    CONSTRAINT chk_staff_leave_dates
        CHECK (end_date >= start_date),

    CONSTRAINT chk_staff_leave_status
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),

    CONSTRAINT chk_staff_leave_review
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

CREATE INDEX idx_staff_leave_member_dates
    ON staff_leave_request(staff_member_id, start_date, end_date);

CREATE INDEX idx_staff_leave_institution_status
    ON staff_leave_request(institution_id, status, start_date);

CREATE TABLE staff_leave_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leave_request_id UUID NOT NULL REFERENCES staff_leave_request(id),
    previous_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by_user_id UUID NOT NULL REFERENCES user_account(id),
    comment VARCHAR(1000),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_staff_leave_audit_request
    ON staff_leave_audit(leave_request_id, changed_at DESC);