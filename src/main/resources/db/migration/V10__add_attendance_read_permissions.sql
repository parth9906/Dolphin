
INSERT INTO permission (
    id, code, name, description, active, created_at, updated_at
)
VALUES
    (
        gen_random_uuid(),
        'ATTENDANCE_READ',
        'Read Attendance',
        'View attendance records for authorized institutions',
        TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'ATTENDANCE_AUDIT_READ',
        'Read Attendance Audit',
        'View attendance change history for authorized institutions',
        TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code IN ('ATTENDANCE_READ', 'ATTENDANCE_AUDIT_READ')
ON CONFLICT DO NOTHING;