INSERT INTO permission (
    id,
    code,
    name,
    description,
    active,
    created_at,
    updated_at
)
VALUES (
    gen_random_uuid(),
    'ADMISSION_APPLICATION_UPDATE',
    'Update Admission Application',
    'Change the status of a student admission application',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
JOIN permission p ON p.code = 'ADMISSION_APPLICATION_UPDATE'
WHERE r.code = 'PLATFORM_ADMIN'
ON CONFLICT DO NOTHING;
