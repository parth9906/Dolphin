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
    'ADMISSION_APPLICATION_ENROLL',
    'Enroll Admission Application',
    'Create the student record and enrollment for an accepted application',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
JOIN permission p ON p.code = 'ADMISSION_APPLICATION_ENROLL'
WHERE r.code = 'PLATFORM_ADMIN'
ON CONFLICT DO NOTHING;
