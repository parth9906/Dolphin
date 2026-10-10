
INSERT INTO permission (
    id, code, name, description, active, created_at, updated_at
)
VALUES
(
    gen_random_uuid(), 'ACADEMIC_YEAR_CREATE', 'Create academic years',
    'Create academic years for authorized institutions',
    TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    gen_random_uuid(), 'CLASS_CREATE', 'Create classes',
    'Create classes within authorized academic years',
    TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    gen_random_uuid(), 'SECTION_CREATE', 'Create class sections',
    'Create class sections within authorized institutions',
    TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    gen_random_uuid(), 'STUDENT_ENROLL', 'Enroll students',
    'Enroll students into class sections',
    TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code IN (
      'ACADEMIC_YEAR_CREATE',
      'CLASS_CREATE',
      'SECTION_CREATE',
      'STUDENT_ENROLL'
  )
ON CONFLICT DO NOTHING;

CREATE UNIQUE INDEX uk_academic_year_one_active
    ON academic_year(institution_id)
    WHERE status = 'ACTIVE';