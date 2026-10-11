-- Support date-range attendance reports.
CREATE INDEX idx_lesson_occurrence_date_lesson
    ON timetable_lesson_occurrence (lesson_date, scheduled_lesson_id);

-- Support section-wise and subject-wise lesson aggregation.
CREATE INDEX idx_scheduled_lesson_section_subject
    ON scheduled_lesson (section_id, subject_id);
