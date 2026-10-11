
INSERT INTO permission (
    id, code, name, description, active, created_at, updated_at
)
VALUES (
    gen_random_uuid(), 'ANALYTICS_READ',
    'Read Analytics', 'Read aggregate analytics across modules',
    TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code = 'ANALYTICS_READ'
ON CONFLICT DO NOTHING;
