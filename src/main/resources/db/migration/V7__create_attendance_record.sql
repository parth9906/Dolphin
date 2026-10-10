
CREATE TABLE attendance_record (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    remarks VARCHAR(500),
    marked_by_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT fk_attendance_student
        FOREIGN KEY (student_id) REFERENCES student(id),

    CONSTRAINT fk_attendance_marked_by
        FOREIGN KEY (marked_by_user_id) REFERENCES user_account(id),

    CONSTRAINT uk_attendance_student_date
        UNIQUE (student_id, attendance_date),

    CONSTRAINT chk_attendance_status
        CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED'))
);

CREATE INDEX idx_attendance_student_date
    ON attendance_record(student_id, attendance_date DESC);