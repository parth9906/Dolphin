
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
    'ASSIGNMENT_CREATE',
    'Create Assignment',
    'Create draft assignments for a class section',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    gen_random_uuid(),
    'ASSIGNMENT_READ',
    'Read Assignments',
    'View assignments within authorized institutions',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    gen_random_uuid(),
    'ASSIGNMENT_UPDATE',
    'Update Assignment',
    'Update draft assignments',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    gen_random_uuid(),
    'ASSIGNMENT_PUBLISH',
    'Publish Assignment',
    'Publish draft assignments for students',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code IN (
      'ASSIGNMENT_CREATE',
      'ASSIGNMENT_READ',
      'ASSIGNMENT_UPDATE',
      'ASSIGNMENT_PUBLISH'
  )
ON CONFLICT DO NOTHING;
