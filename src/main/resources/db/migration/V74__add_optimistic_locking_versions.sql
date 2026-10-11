-- Optimistic locking for entities used in read-modify-write flows that
-- previously had last-write-wins semantics.
ALTER TABLE student
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE staff_member
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE staff_assignment
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE guardian
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE student_enrollment
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
