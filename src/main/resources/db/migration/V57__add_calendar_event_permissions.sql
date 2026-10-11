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
        'CALENDAR_EVENT_CREATE',
        'Create Calendar Event',
        'Create calendar events for an institution or campus',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'CALENDAR_EVENT_READ',
        'Read Calendar Event',
        'View calendar events for an institution or campus',
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
      'CALENDAR_EVENT_CREATE',
      'CALENDAR_EVENT_READ'
  )
ON CONFLICT DO NOTHING;
