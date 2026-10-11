-- V31__add_substitute_assignment_audit.sql

-- Track who assigned the substitute and when.
ALTER TABLE timetable_lesson_occurrence
    ADD COLUMN assigned_by_user_id UUID
        REFERENCES user_account(id),
    ADD COLUMN substitute_assigned_at TIMESTAMPTZ;

-- Add a distinct status for a lesson whose substitute has been assigned.
ALTER TABLE timetable_lesson_occurrence
    DROP CONSTRAINT chk_lesson_occurrence_status;

ALTER TABLE timetable_lesson_occurrence
    ADD CONSTRAINT chk_lesson_occurrence_status
    CHECK (status IN (
        'SCHEDULED',
        'NEEDS_COVERAGE',
        'COVERAGE_ASSIGNED',
        'CANCELLED',
        'COMPLETED'
    ));

-- Audit every substitute assignment or reassignment.
CREATE TABLE lesson_substitute_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    occurrence_id UUID NOT NULL
        REFERENCES timetable_lesson_occurrence(id),

    previous_substitute_assignment_id UUID
        REFERENCES staff_assignment(id),

    new_substitute_assignment_id UUID NOT NULL
        REFERENCES staff_assignment(id),

    changed_by_user_id UUID NOT NULL
        REFERENCES user_account(id),

    comment VARCHAR(1000),

    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_substitute_audit_occurrence
    ON lesson_substitute_audit(occurrence_id, changed_at DESC);