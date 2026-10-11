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
        'CALENDAR_EVENT_UPDATE',
        'Update Calendar Event',
        'Update calendar events for an institution or campus',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'CALENDAR_EVENT_DEACTIVATE',
        'Deactivate Calendar Event',
        'Deactivate calendar events for an institution or campus',
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
      'CALENDAR_EVENT_UPDATE',
      'CALENDAR_EVENT_DEACTIVATE'
  )
ON CONFLICT DO NOTHING;
