INSERT INTO permission (
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
    'DISCIPLINE_INCIDENT_UPDATE',
    'Update Discipline Incident',
    'Change the status of a student discipline incident',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
JOIN permission p ON p.code = 'DISCIPLINE_INCIDENT_UPDATE'
WHERE r.code = 'PLATFORM_ADMIN'
ON CONFLICT DO NOTHING;
