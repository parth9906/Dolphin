-- Allow roles that can create classes to edit them as well.
INSERT INTO permission (
    id, code, name, description, active, created_at, updated_at
)
VALUES (
    gen_random_uuid(),
    'CLASS_UPDATE',
    'Update classes',
    'Update class name, code, and sort order',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT existing_grant.role_id, update_permission.id
FROM role_permission existing_grant
JOIN permission create_permission
    ON create_permission.id = existing_grant.permission_id
    AND create_permission.code = 'CLASS_CREATE'
JOIN permission update_permission
    ON update_permission.code = 'CLASS_UPDATE'
ON CONFLICT DO NOTHING;
