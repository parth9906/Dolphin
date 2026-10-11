ALTER TABLE assignment_submission
    ADD COLUMN marks_obtained NUMERIC(8, 2),
    ADD COLUMN feedback TEXT,
    ADD COLUMN graded_by_staff_id UUID,
    ADD COLUMN graded_at TIMESTAMPTZ;

ALTER TABLE assignment_submission
    ADD CONSTRAINT fk_assignment_submission_grader
        FOREIGN KEY (graded_by_staff_id)
        REFERENCES staff_member(id);

ALTER TABLE assignment_submission
    ADD CONSTRAINT chk_assignment_submission_marks_non_negative
        CHECK (marks_obtained IS NULL OR marks_obtained >= 0);

ALTER TABLE assignment_submission
    ADD CONSTRAINT chk_assignment_submission_grading
        CHECK (
            (
                status <> 'GRADED'
                AND marks_obtained IS NULL
                AND feedback IS NULL
                AND graded_by_staff_id IS NULL
                AND graded_at IS NULL
            )
            OR
            (
                status = 'GRADED'
                AND marks_obtained IS NOT NULL
                AND graded_by_staff_id IS NOT NULL
                AND graded_at IS NOT NULL
            )
        );
