INSERT INTO permission (
    id, code, name, description, active, created_at, updated_at
)
VALUES
    (
        gen_random_uuid(), 'ROOM_CREATE',
        'Create Rooms', 'Create rooms', TRUE,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(), 'ROOM_READ',
        'Read Rooms', 'View rooms', TRUE,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(), 'TIMETABLE_SLOT_CREATE',
        'Create Timetable Slots', 'Create time slots', TRUE,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(), 'TIMETABLE_SLOT_READ',
        'Read Timetable Slots', 'View time slots', TRUE,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(), 'TIMETABLE_LESSON_CREATE',
        'Create Timetable Lessons', 'Schedule lessons', TRUE,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(), 'TIMETABLE_READ',
        'Read Timetable', 'View section timetables', TRUE,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(), 'TEACHER_TIMETABLE_READ',
        'Read Teacher Timetable', 'View teacher schedules', TRUE,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    );

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code IN (
      'ROOM_CREATE',
      'ROOM_READ',
      'TIMETABLE_SLOT_CREATE',
      'TIMETABLE_SLOT_READ',
      'TIMETABLE_LESSON_CREATE',
      'TIMETABLE_READ',
      'TEACHER_TIMETABLE_READ'
  );