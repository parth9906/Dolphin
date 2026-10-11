
CREATE TABLE lesson_attendance_record (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    lesson_occurrence_id UUID NOT NULL
        REFERENCES timetable_lesson_occurrence(id),

    student_id UUID NOT NULL
        REFERENCES student(id),

    status VARCHAR(20) NOT NULL,

    marked_by_user_id UUID NOT NULL
        REFERENCES user_account(id),

    marked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    remarks VARCHAR(500),

    version BIGINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_lesson_attendance_occurrence_student
        UNIQUE (lesson_occurrence_id, student_id),

    CONSTRAINT chk_lesson_attendance_status
        CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED'))
);

CREATE INDEX idx_lesson_attendance_student
    ON lesson_attendance_record(student_id, marked_at DESC);

CREATE INDEX idx_lesson_attendance_occurrence_status
    ON lesson_attendance_record(lesson_occurrence_id, status);


CREATE TABLE lesson_attendance_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    lesson_attendance_record_id UUID NOT NULL
        REFERENCES lesson_attendance_record(id),

    previous_status VARCHAR(20),

    new_status VARCHAR(20) NOT NULL,

    previous_remarks VARCHAR(500),

    new_remarks VARCHAR(500),

    changed_by_user_id UUID NOT NULL
        REFERENCES user_account(id),

    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_lesson_attendance_audit_new_status
        CHECK (new_status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')),

    CONSTRAINT chk_lesson_attendance_audit_previous_status
        CHECK (
            previous_status IS NULL
            OR previous_status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')
        )
);

CREATE INDEX idx_lesson_attendance_audit_record
    ON lesson_attendance_audit(
        lesson_attendance_record_id,
        changed_at DESC
    );


-- New permissions for lesson-level attendance.
INSERT INTO permission (
    id, code, name, description, active, created_at, updated_at
)
VALUES
(
    gen_random_uuid(),
    'ATTENDANCE_LESSON_MARK',
    'Mark Lesson Attendance',
    'Record student attendance for a dated lesson',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    gen_random_uuid(),
    'ATTENDANCE_LESSON_READ',
    'Read Lesson Attendance',
    'View student attendance for a dated lesson',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    gen_random_uuid(),
    'ATTENDANCE_LESSON_UPDATE',
    'Update Lesson Attendance',
    'Correct student attendance for a dated lesson',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO NOTHING;


INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code IN (
      'ATTENDANCE_LESSON_MARK',
      'ATTENDANCE_LESSON_READ',
      'ATTENDANCE_LESSON_UPDATE'
  )
ON CONFLICT DO NOTHING;