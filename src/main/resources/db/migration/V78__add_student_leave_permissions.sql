
INSERT INTO permission (
    id, code, name, description, active, created_at, updated_at
)
VALUES
    (gen_random_uuid(), 'STUDENT_LEAVE_CREATE',
     'Create Student Leave', 'Submit student leave requests',
     TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'STUDENT_LEAVE_READ',
     'Read Student Leave', 'View student leave requests',
     TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'STUDENT_LEAVE_REVIEW',
     'Review Student Leave', 'Approve or reject student leave requests',
     TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'STUDENT_LEAVE_CANCEL',
     'Cancel Student Leave', 'Cancel a pending student leave request',
     TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'STUDENT_LEAVE_AUDIT_READ',
     'Read Student Leave Audit', 'View student leave request change history',
     TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code IN (
      'STUDENT_LEAVE_CREATE',
      'STUDENT_LEAVE_READ',
      'STUDENT_LEAVE_REVIEW',
      'STUDENT_LEAVE_CANCEL',
      'STUDENT_LEAVE_AUDIT_READ'
  )
ON CONFLICT DO NOTHING;
