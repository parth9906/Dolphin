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
    'STUDENT_ACCOUNT_LINK',
    'Link Student Account',
    'Link an existing user account to a student profile',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
JOIN permission p ON p.code = 'STUDENT_ACCOUNT_LINK'
WHERE r.code = 'PLATFORM_ADMIN'
ON CONFLICT DO NOTHING;
