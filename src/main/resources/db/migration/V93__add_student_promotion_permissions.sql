-- Add student promotion permissions.

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
        'STUDENT_PROMOTION_CREATE',
        'Create student promotion batches',
        'Create promotion batches between academic years',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'STUDENT_PROMOTION_READ',
        'Read student promotion batches',
        'View promotion batches, student decisions, and previews',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'STUDENT_PROMOTION_UPDATE',
        'Update student promotion decisions',
        'Assign promotion decisions and target sections',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'STUDENT_PROMOTION_EXECUTE',
        'Execute student promotion',
        'Finalize academic-year promotion and create new enrollments',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'STUDENT_PROMOTION_CANCEL',
        'Cancel student promotion batches',
        'Cancel draft promotion batches',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (code) DO NOTHING;


-- Grant the permissions to PLATFORM_ADMIN.

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
         CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code IN (
                 'STUDENT_PROMOTION_CREATE',
                 'STUDENT_PROMOTION_READ',
                 'STUDENT_PROMOTION_UPDATE',
                 'STUDENT_PROMOTION_EXECUTE',
                 'STUDENT_PROMOTION_CANCEL'
    )
    ON CONFLICT DO NOTHING;