
CREATE TABLE attendance_audit (
    id UUID PRIMARY KEY,
    attendance_record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    previous_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    previous_remarks VARCHAR(500),
    new_remarks VARCHAR(500),
    changed_by_user_id UUID NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT fk_attendance_audit_record
        FOREIGN KEY (attendance_record_id)
        REFERENCES attendance_record(id),

    CONSTRAINT fk_attendance_audit_user
        FOREIGN KEY (changed_by_user_id)
        REFERENCES user_account(id),

    CONSTRAINT chk_attendance_audit_action
        CHECK (action IN ('CREATED', 'UPDATED')),

    CONSTRAINT chk_attendance_audit_previous_status
        CHECK (
            previous_status IS NULL
            OR previous_status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')
        ),

    CONSTRAINT chk_attendance_audit_new_status
        CHECK (new_status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED'))
);

CREATE INDEX idx_attendance_audit_record_changed
    ON attendance_audit(attendance_record_id, changed_at DESC);