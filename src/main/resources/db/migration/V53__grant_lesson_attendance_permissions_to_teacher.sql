-- Lesson attendance is the teacher-facing attendance surface: it is tied to a
-- dated lesson occurrence, so the section can be derived from the occurrence and
-- authorization can be scoped to the teachers currently assigned to that section
-- (see LessonAttendanceService.authorizeOccurrenceAccess).
--
-- Institution-level scope holders keep their existing institution-wide access;
-- these grants only add the teacher path. Daily (institution-wide) attendance
-- permissions remain restricted to administrators.

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'TEACHER'
  AND p.code IN (
      'ATTENDANCE_LESSON_READ',
      'ATTENDANCE_LESSON_MARK',
      'ATTENDANCE_LESSON_UPDATE'
  )
ON CONFLICT DO NOTHING;
