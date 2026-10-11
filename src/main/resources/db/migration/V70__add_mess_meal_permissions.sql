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
        'MESS_MEAL_CREATE',
        'Record Mess Meal',
        'Record a canteen/mess meal service and consume inventory items',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'MESS_MEAL_READ',
        'Read Mess Meal',
        'View canteen/mess meal records and their inventory consumption',
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
      'MESS_MEAL_CREATE',
      'MESS_MEAL_READ'
  )
ON CONFLICT DO NOTHING;
