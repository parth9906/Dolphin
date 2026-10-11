INSERT INTO role (
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
    'TEACHER',
    'Teacher',
    'Teaching staff who manage and grade homework for their assigned sections',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'TEACHER'
  AND p.code IN (
      'ASSIGNMENT_CREATE',
      'ASSIGNMENT_READ',
      'ASSIGNMENT_UPDATE',
      'ASSIGNMENT_PUBLISH',
      'ASSIGNMENT_SUBMISSION_READ',
      'ASSIGNMENT_SUBMISSION_GRADE'
  )
ON CONFLICT DO NOTHING;
