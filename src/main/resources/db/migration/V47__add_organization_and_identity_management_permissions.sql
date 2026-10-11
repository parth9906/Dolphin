
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
        'USER_READ',
        'Read User',
        'Read user account details within the platform',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'ENTERPRISE_CREATE',
        'Create Enterprise',
        'Create enterprises in the organization hierarchy',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'ENTERPRISE_READ',
        'Read Enterprise',
        'Read enterprise details',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'REGION_CREATE',
        'Create Region',
        'Create regions within an enterprise',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'REGION_READ',
        'Read Region',
        'Read region details',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'CLUSTER_CREATE',
        'Create Cluster',
        'Create clusters within a region',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'CLUSTER_READ',
        'Read Cluster',
        'Read cluster details',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'INSTITUTION_CREATE',
        'Create Institution',
        'Create institutions within a cluster',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'INSTITUTION_READ',
        'Read Institution',
        'Read institution details',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'CAMPUS_CREATE',
        'Create Campus',
        'Create campuses for an institution',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'CAMPUS_READ',
        'Read Campus',
        'Read campus details',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'ACADEMIC_YEAR_ACTIVATE',
        'Activate Academic Year',
        'Activate an academic year for enrollment and scheduling',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'STUDENT_PORTAL_READ',
        'Read Student Portal',
        'Read self-service data for the authenticated linked student',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'ASSIGNMENT_SUBMISSION_CREATE',
        'Submit Assignment',
        'Create or update the authenticated student own assignment submission',
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
      'USER_READ',
      'ENTERPRISE_CREATE',
      'ENTERPRISE_READ',
      'REGION_CREATE',
      'REGION_READ',
      'CLUSTER_CREATE',
      'CLUSTER_READ',
      'INSTITUTION_CREATE',
      'INSTITUTION_READ',
      'CAMPUS_CREATE',
      'CAMPUS_READ',
      'ACADEMIC_YEAR_ACTIVATE',
      'STUDENT_PORTAL_READ',
      'ASSIGNMENT_SUBMISSION_CREATE'
  )
ON CONFLICT DO NOTHING;
