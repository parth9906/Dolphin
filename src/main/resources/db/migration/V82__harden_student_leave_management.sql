-- Add optimistic locking support.
ALTER TABLE student_leave_request
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

-- PostgreSQL extension required for UUID equality in a GiST exclusion constraint.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Prevent overlapping pending or approved leave for the same student.
-- The range is half-open, but end_date + 1 makes both leave dates inclusive.
ALTER TABLE student_leave_request
    ADD CONSTRAINT ex_student_leave_no_overlap
    EXCLUDE USING gist (
        student_id WITH =,
        daterange(start_date, end_date + 1, '[)') WITH &&
    )
    WHERE (status IN ('PENDING', 'APPROVED'));
