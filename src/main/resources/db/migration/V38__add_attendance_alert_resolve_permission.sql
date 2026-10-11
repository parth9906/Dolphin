
INSERT INTO permission (
    id, code, name, description, active, created_at, updated_at
)
VALUES (
    gen_random_uuid(),
    'ATTENDANCE_ALERT_RESOLVE',
    'Resolve attendance alerts',
    'Allow authorized users to resolve attendance alerts',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
JOIN permission p
    ON p.code = 'ATTENDANCE_ALERT_RESOLVE'
WHERE r.code = 'PLATFORM_ADMIN'
ON CONFLICT DO NOTHING;
