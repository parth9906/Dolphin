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
        'DISCIPLINE_INCIDENT_CREATE',
        'Create Discipline Incident',
        'Record student discipline and behavior incidents',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'DISCIPLINE_INCIDENT_READ',
        'Read Discipline Incident',
        'View student discipline and behavior incidents',
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
      'DISCIPLINE_INCIDENT_CREATE',
      'DISCIPLINE_INCIDENT_READ'
  )
ON CONFLICT DO NOTHING;
