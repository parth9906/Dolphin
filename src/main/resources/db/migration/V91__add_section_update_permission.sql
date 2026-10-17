
INSERT INTO permission (
    id,
    code,
    name,
    description,
    active,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    'SECTION_UPDATE',
    'Update class sections',
    'Allows updating class section details',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
    WHERE NOT EXISTS (
    SELECT 1
    FROM permission
    WHERE code = 'SECTION_UPDATE'
);

INSERT INTO role_permission (
    role_id,
    permission_id
)
SELECT
    r.id,
    p.id
FROM role r
         JOIN permission p
              ON p.code = 'SECTION_UPDATE'
WHERE r.code = 'PLATFORM_ADMIN'
  AND NOT EXISTS (
    SELECT 1
    FROM role_permission rp
    WHERE rp.role_id = r.id
      AND rp.permission_id = p.id
);
