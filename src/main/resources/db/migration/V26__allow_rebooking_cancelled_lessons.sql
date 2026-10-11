
ALTER TABLE scheduled_lesson
    DROP CONSTRAINT uk_lesson_section_slot;

ALTER TABLE scheduled_lesson
    DROP CONSTRAINT uk_lesson_teacher_slot;

CREATE UNIQUE INDEX uk_lesson_section_slot_active
    ON scheduled_lesson(section_id, slot_id)
    WHERE active = TRUE;

CREATE UNIQUE INDEX uk_lesson_teacher_slot_active
    ON scheduled_lesson(staff_assignment_id, slot_id)
    WHERE active = TRUE;