
INSERT INTO permission (
    id, code, name, description, active, created_at, updated_at
)
VALUES
    (gen_random_uuid(), 'STAFF_LEAVE_CREATE',
     'Create Staff Leave', 'Submit staff leave requests', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'STAFF_LEAVE_READ',
     'Read Staff Leave', 'View staff leave requests', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'STAFF_LEAVE_REVIEW',
     'Review Staff Leave', 'Approve or reject staff leave requests', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'STAFF_LEAVE_AUDIT_READ',
     'Read Staff Leave Audit', 'View leave request change history', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code IN (
      'STAFF_LEAVE_CREATE',
      'STAFF_LEAVE_READ',
      'STAFF_LEAVE_REVIEW',
      'STAFF_LEAVE_AUDIT_READ'
  );