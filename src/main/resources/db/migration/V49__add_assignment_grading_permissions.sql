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
        'ASSIGNMENT_SUBMISSION_READ',
        'Read Assignment Submissions',
        'Review student submissions for assignments the staff member manages',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'ASSIGNMENT_SUBMISSION_GRADE',
        'Grade Assignment Submissions',
        'Record or update marks and feedback for assignment submissions',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code IN (
      'ASSIGNMENT_SUBMISSION_READ',
      'ASSIGNMENT_SUBMISSION_GRADE'
  )
ON CONFLICT DO NOTHING;
