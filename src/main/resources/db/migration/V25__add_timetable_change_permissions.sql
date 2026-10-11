
INSERT INTO permission (
    id, code, name, description, active, created_at, updated_at
)
VALUES
    (
        gen_random_uuid(),
        'TIMETABLE_LESSON_UPDATE',
        'Update Timetable Lessons',
        'Update scheduled lessons',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'TIMETABLE_LESSON_CANCEL',
        'Cancel Timetable Lessons',
        'Cancel scheduled lessons',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code IN (
      'TIMETABLE_LESSON_UPDATE',
      'TIMETABLE_LESSON_CANCEL'
  );
