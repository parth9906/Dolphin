
INSERT INTO permission (
    id, code, name, description, active, created_at, updated_at
)
VALUES
(
    gen_random_uuid(), 'STAFF_CREATE', 'Create staff',
    'Create staff members and institution assignments',
    TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    gen_random_uuid(), 'STAFF_READ', 'Read staff',
    'View staff assignments within authorized institutions',
    TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    gen_random_uuid(), 'STAFF_UPDATE', 'Update staff',
    'Update staff assignment status within authorized institutions',
    TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code IN ('STAFF_CREATE', 'STAFF_READ', 'STAFF_UPDATE')
ON CONFLICT DO NOTHING;