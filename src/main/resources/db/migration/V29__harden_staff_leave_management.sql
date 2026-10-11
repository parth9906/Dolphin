
-- Add optimistic locking support.
ALTER TABLE staff_leave_request
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

-- PostgreSQL extension required for UUID equality in a GiST exclusion constraint.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Prevent overlapping pending or approved leave for the same staff member.
-- The range is half-open, but end_date + 1 makes both leave dates inclusive.
ALTER TABLE staff_leave_request
    ADD CONSTRAINT ex_staff_leave_no_overlap
    EXCLUDE USING gist (
        staff_member_id WITH =,
        daterange(start_date, end_date + 1, '[)') WITH &&
    )
    WHERE (status IN ('PENDING', 'APPROVED'));

-- Add the cancellation permission.
INSERT INTO permission (
    id, code, name, description, active, created_at, updated_at
)
VALUES (
    gen_random_uuid(),
    'STAFF_LEAVE_CANCEL',
    'Cancel Staff Leave',
    'Cancel a pending staff leave request',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO NOTHING;

-- Grant the permission to PLATFORM_ADMIN using the existing role-permission pattern.
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code = 'STAFF_LEAVE_CANCEL'
ON CONFLICT DO NOTHING;

