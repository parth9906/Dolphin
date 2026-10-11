-- V35__create_attendance_alerts.sql

CREATE TABLE attendance_alert (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id UUID NOT NULL REFERENCES student(id),
    institution_id UUID NOT NULL REFERENCES institution(id),

    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    threshold_percent NUMERIC(5, 2) NOT NULL,
    attendance_percent NUMERIC(5, 2) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',

    generated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMPTZ,

    CONSTRAINT chk_attendance_alert_period
        CHECK (period_end >= period_start),

    CONSTRAINT chk_attendance_alert_threshold
        CHECK (threshold_percent >= 0 AND threshold_percent <= 100),

    CONSTRAINT chk_attendance_alert_percentage
        CHECK (attendance_percent >= 0 AND attendance_percent <= 100),

    CONSTRAINT chk_attendance_alert_status
        CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED')),

    CONSTRAINT uk_attendance_alert_period
        UNIQUE (
            student_id,
            period_start,
            period_end,
            threshold_percent
        )
);

CREATE INDEX idx_attendance_alert_student_status
    ON attendance_alert(student_id, status, generated_at DESC);

CREATE INDEX idx_attendance_alert_institution_period
    ON attendance_alert(institution_id, period_start, period_end);


INSERT INTO permission (
    id, code, name, description, active, created_at, updated_at
)
VALUES
(
    gen_random_uuid(),
    'ATTENDANCE_ALERT_GENERATE',
    'Generate Attendance Alerts',
    'Evaluate attendance and create low-attendance alerts',
    TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    gen_random_uuid(),
    'ATTENDANCE_ALERT_READ',
    'Read Attendance Alerts',
    'View attendance alerts',
    TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO NOTHING;


INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code IN (
      'ATTENDANCE_ALERT_GENERATE',
      'ATTENDANCE_ALERT_READ'
  )
ON CONFLICT DO NOTHING;