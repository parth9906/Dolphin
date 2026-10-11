CREATE TABLE attendance_alert_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    attendance_alert_id UUID NOT NULL
        REFERENCES attendance_alert(id) ON DELETE RESTRICT,

    previous_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,

    changed_by_user_id UUID NOT NULL
        REFERENCES user_account(id) ON DELETE RESTRICT,

    comment VARCHAR(1000),

    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_attendance_alert_audit_previous_status
        CHECK (
            previous_status IS NULL
            OR previous_status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED')
        ),

    CONSTRAINT chk_attendance_alert_audit_new_status
        CHECK (
            new_status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED')
        )
);

CREATE INDEX idx_attendance_alert_audit_alert_time
    ON attendance_alert_audit (attendance_alert_id, changed_at DESC);

CREATE INDEX idx_attendance_alert_audit_actor_time
    ON attendance_alert_audit (changed_by_user_id, changed_at DESC);