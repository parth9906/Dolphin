INSERT INTO permission (
    id,
    code,
    name,
    description,
    active,
    created_at,
    updated_at
)
VALUES
    (
        gen_random_uuid(),
        'ADMISSION_APPLICATION_CREATE',
        'Create Admission Application',
        'Record new student admission applications',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'ADMISSION_APPLICATION_READ',
        'Read Admission Application',
        'View student admission applications',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code IN (
      'ADMISSION_APPLICATION_CREATE',
      'ADMISSION_APPLICATION_READ'
  )
ON CONFLICT DO NOTHING;
