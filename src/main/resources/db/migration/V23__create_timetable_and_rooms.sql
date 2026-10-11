
CREATE TABLE school_room (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institution(id),
    campus_id UUID REFERENCES campus(id),
    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    capacity INTEGER,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_school_room_code
        UNIQUE (institution_id, code),

    CONSTRAINT chk_school_room_capacity
        CHECK (capacity IS NULL OR capacity > 0)
);

CREATE INDEX idx_school_room_institution
    ON school_room(institution_id, active);

CREATE TABLE timetable_slot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id UUID NOT NULL REFERENCES academic_year(id),
    day_of_week SMALLINT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    label VARCHAR(50),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_timetable_day
        CHECK (day_of_week BETWEEN 1 AND 7),

    CONSTRAINT chk_timetable_time
        CHECK (end_time > start_time)
);

CREATE INDEX idx_timetable_slot_year_day
    ON timetable_slot(academic_year_id, day_of_week, start_time);

CREATE TABLE scheduled_lesson (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES class_section(id),
    slot_id UUID NOT NULL REFERENCES timetable_slot(id),
    staff_assignment_id UUID NOT NULL REFERENCES staff_assignment(id),
    subject_id UUID NOT NULL REFERENCES academic_subject(id),
    room_id UUID REFERENCES school_room(id),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_lesson_section_slot
        UNIQUE (section_id, slot_id),

    CONSTRAINT uk_lesson_teacher_slot
        UNIQUE (staff_assignment_id, slot_id)
);

CREATE UNIQUE INDEX uk_lesson_room_slot
    ON scheduled_lesson(room_id, slot_id)
    WHERE room_id IS NOT NULL;

CREATE INDEX idx_scheduled_lesson_section
    ON scheduled_lesson(section_id, active);

CREATE INDEX idx_scheduled_lesson_teacher
    ON scheduled_lesson(staff_assignment_id, active);