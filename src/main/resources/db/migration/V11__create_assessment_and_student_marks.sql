
CREATE TABLE assessment (
    id UUID PRIMARY KEY,
    institution_id UUID NOT NULL,
    name VARCHAR(150) NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    assessment_date DATE NOT NULL,
    max_marks NUMERIC(8, 2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT fk_assessment_institution
        FOREIGN KEY (institution_id) REFERENCES institution(id),

    CONSTRAINT fk_assessment_created_by
        FOREIGN KEY (created_by_user_id) REFERENCES user_account(id),

    CONSTRAINT chk_assessment_max_marks
        CHECK (max_marks > 0)
);

CREATE INDEX idx_assessment_institution_date
    ON assessment(institution_id, assessment_date DESC);

CREATE TABLE student_mark (
    id UUID PRIMARY KEY,
    assessment_id UUID NOT NULL,
    student_id UUID NOT NULL,
    marks_obtained NUMERIC(8, 2) NOT NULL,
    remarks VARCHAR(500),
    marked_by_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT fk_student_mark_assessment
        FOREIGN KEY (assessment_id) REFERENCES assessment(id),

    CONSTRAINT fk_student_mark_student
        FOREIGN KEY (student_id) REFERENCES student(id),

    CONSTRAINT fk_student_mark_marked_by
        FOREIGN KEY (marked_by_user_id) REFERENCES user_account(id),

    CONSTRAINT uk_student_mark_assessment_student
        UNIQUE (assessment_id, student_id),

    CONSTRAINT chk_student_mark_non_negative
        CHECK (marks_obtained >= 0)
);

CREATE INDEX idx_student_mark_student
    ON student_mark(student_id, assessment_id);