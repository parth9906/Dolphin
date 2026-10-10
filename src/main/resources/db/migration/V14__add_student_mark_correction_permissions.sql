
INSERT INTO permission (
    id, code, name, description, active, created_at, updated_at
)
VALUES
    (
        gen_random_uuid(),
        'MARKS_UPDATE',
        'Correct Student Marks',
        'Correct marks already recorded for students',
        TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'MARKS_AUDIT_READ',
        'Read Marks Audit',
        'View the history of mark corrections',
        TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code IN ('MARKS_UPDATE', 'MARKS_AUDIT_READ')
ON CONFLICT DO NOTHING;