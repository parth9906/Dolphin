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
    'STUDENT',
    'Student',
    'Self-service portal access for a user account linked to a student profile',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'STUDENT'
  AND p.code IN (
      'STUDENT_PORTAL_READ',
      'ASSIGNMENT_SUBMISSION_CREATE'
  )
ON CONFLICT DO NOTHING;
