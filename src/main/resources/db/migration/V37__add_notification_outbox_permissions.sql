
INSERT INTO permission (
    id, code, name, description, active, created_at, updated_at
)
VALUES
(
    gen_random_uuid(),
    'NOTIFICATION_OUTBOX_READ',
    'Read notification outbox failures',
    'View failed notification delivery events',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    gen_random_uuid(),
    'NOTIFICATION_OUTBOX_RETRY',
    'Retry notification outbox failures',
    'Manually requeue failed notification delivery events',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
JOIN permission p
  ON p.code IN (
      'NOTIFICATION_OUTBOX_READ',
      'NOTIFICATION_OUTBOX_RETRY'
  )
WHERE r.code = 'PLATFORM_ADMIN'
ON CONFLICT DO NOTHING;
