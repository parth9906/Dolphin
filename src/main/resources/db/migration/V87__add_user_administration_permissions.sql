
-- Add permissions for user administration.

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
        'USER_ROLE_REVOKE',
        'Revoke User Role',
        'Revoke a role assigned to a user account',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'USER_SCOPE_REVOKE',
        'Revoke User Scope',
        'Revoke an organization scope assigned to a user account',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'USER_INVITATION_CREATE',
        'Create User Invitation',
        'Create an invitation for initial account password setup',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (code) DO NOTHING;


-- Assign all three permissions to PLATFORM_ADMIN.

INSERT INTO role_permission (
    role_id,
    permission_id
)
SELECT
    r.id,
    p.id
FROM role r
         CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code IN (
                 'USER_ROLE_REVOKE',
                 'USER_SCOPE_REVOKE',
                 'USER_INVITATION_CREATE'
    )
    ON CONFLICT DO NOTHING;
