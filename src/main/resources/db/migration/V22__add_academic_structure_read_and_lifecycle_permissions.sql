
INSERT INTO permission (
    id, code, name, description, active, created_at, updated_at
)
VALUES
    (gen_random_uuid(), 'ACADEMIC_YEAR_READ',
     'Read Academic Years', 'View academic years', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CLASS_READ',
     'Read Classes', 'View classes in an academic year', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SECTION_READ',
     'Read Sections', 'View class sections', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'ENROLLMENT_READ',
     'Read Enrollments', 'View rosters and enrollment history', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'ENROLLMENT_COMPLETE',
     'Complete Enrollment', 'Complete an active enrollment', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'ENROLLMENT_WITHDRAW',
     'Withdraw Student', 'Withdraw a student from an enrollment', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'STUDENT_TRANSFER',
     'Transfer Student', 'Transfer a student to another section', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'ACADEMIC_YEAR_CLOSE',
     'Close Academic Year', 'Close an active academic year', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code IN (
      'ACADEMIC_YEAR_READ',
      'CLASS_READ',
      'SECTION_READ',
      'ENROLLMENT_READ',
      'ENROLLMENT_COMPLETE',
      'ENROLLMENT_WITHDRAW',
      'STUDENT_TRANSFER',
      'ACADEMIC_YEAR_CLOSE'
  );