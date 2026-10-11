-- Account lifecycle operations for staff users: profile updates and
-- deactivation. A deactivated account can no longer authenticate and existing
-- tokens stop granting authorities, so this closes the operational gap where
-- users could only be disabled by direct database access.
INSERT INTO permission (
    id, code, name, description, active, created_at, updated_at
)
VALUES
    (gen_random_uuid(), 'USER_UPDATE',
     'Update User', 'Update a user account profile or password',
     TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'USER_DEACTIVATE',
     'Deactivate User', 'Deactivate a user account',
     TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code IN ('USER_UPDATE', 'USER_DEACTIVATE')
ON CONFLICT DO NOTHING;
