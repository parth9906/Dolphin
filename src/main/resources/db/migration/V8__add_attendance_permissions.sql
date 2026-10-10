
INSERT INTO permission (id, code, name, description, active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'ATTENDANCE_MARK',
     'Mark Attendance', 'Record daily student attendance',
     TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'ATTENDANCE_UPDATE',
     'Correct Attendance', 'Correct previously recorded attendance',
     TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code IN ('ATTENDANCE_MARK', 'ATTENDANCE_UPDATE')
ON CONFLICT DO NOTHING;