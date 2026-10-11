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
        'HOSTEL_CREATE',
        'Create Hostel',
        'Create hostels for an institution or campus',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'HOSTEL_READ',
        'Read Hostel',
        'View hostels for an institution or campus',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'HOSTEL_UPDATE',
        'Update Hostel',
        'Update hostel details and deactivate hostels',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'HOSTEL_ROOM_CREATE',
        'Create Hostel Room',
        'Create rooms within a hostel',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'HOSTEL_ROOM_READ',
        'Read Hostel Room',
        'View hostel rooms and their occupancy',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'HOSTEL_ROOM_UPDATE',
        'Update Hostel Room',
        'Update hostel room details and deactivate rooms',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'HOSTEL_ALLOCATION_CREATE',
        'Create Hostel Allocation',
        'Allocate a student to a hostel room',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'HOSTEL_ALLOCATION_READ',
        'Read Hostel Allocation',
        'View hostel room allocations',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'HOSTEL_ALLOCATION_UPDATE',
        'Update Hostel Allocation',
        'Vacate or cancel a hostel room allocation',
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
      'HOSTEL_CREATE',
      'HOSTEL_READ',
      'HOSTEL_UPDATE',
      'HOSTEL_ROOM_CREATE',
      'HOSTEL_ROOM_READ',
      'HOSTEL_ROOM_UPDATE',
      'HOSTEL_ALLOCATION_CREATE',
      'HOSTEL_ALLOCATION_READ',
      'HOSTEL_ALLOCATION_UPDATE'
  )
ON CONFLICT DO NOTHING;
