
CREATE TABLE timetable_lesson_occurrence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    scheduled_lesson_id UUID NOT NULL
        REFERENCES scheduled_lesson(id),

    lesson_date DATE NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',

    substitute_staff_assignment_id UUID
        REFERENCES staff_assignment(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_lesson_occurrence_date
        UNIQUE (scheduled_lesson_id, lesson_date),

    CONSTRAINT chk_lesson_occurrence_status
        CHECK (status IN (
            'SCHEDULED',
            'NEEDS_COVERAGE',
            'CANCELLED',
            'COMPLETED'
        )),

    CONSTRAINT chk_substitute_not_original
        CHECK (substitute_staff_assignment_id IS NULL)
);

CREATE INDEX idx_lesson_occurrence_date_status
    ON timetable_lesson_occurrence(lesson_date, status);

CREATE INDEX idx_lesson_occurrence_lesson_date
    ON timetable_lesson_occurrence(scheduled_lesson_id, lesson_date);

