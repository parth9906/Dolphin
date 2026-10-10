
ALTER TABLE student_guardian
    ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;

-- Allow the same guardian to be linked again after an old
-- relationship has been deactivated.
ALTER TABLE student_guardian
    DROP CONSTRAINT uk_student_guardian;

CREATE UNIQUE INDEX uk_student_guardian_active
    ON student_guardian(student_id, guardian_id)
    WHERE active = TRUE;

-- Only active relationships can reserve a student's primary contact.
DROP INDEX uk_student_one_primary_guardian;

CREATE UNIQUE INDEX uk_student_one_primary_guardian
    ON student_guardian(student_id)
    WHERE primary_contact = TRUE AND active = TRUE;