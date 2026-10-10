
CREATE TABLE academic_subject (
    id UUID PRIMARY KEY,
    institution_id UUID NOT NULL,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_subject_institution
        FOREIGN KEY (institution_id)
        REFERENCES institution(id),

    CONSTRAINT uk_subject_institution_code
        UNIQUE (institution_id, code),

    CONSTRAINT uk_subject_institution_name
        UNIQUE (institution_id, name)
);

CREATE INDEX idx_subject_institution_active
    ON academic_subject(institution_id, active);


CREATE TABLE teacher_subject_assignment (
    id UUID PRIMARY KEY,
    staff_assignment_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_teacher_subject_staff_assignment
        FOREIGN KEY (staff_assignment_id)
        REFERENCES staff_assignment(id),

    CONSTRAINT fk_teacher_subject_subject
        FOREIGN KEY (subject_id)
        REFERENCES academic_subject(id),

    CONSTRAINT chk_teacher_subject_dates
        CHECK (end_date IS NULL OR end_date >= start_date),

    CONSTRAINT uk_teacher_subject_start
        UNIQUE (staff_assignment_id, subject_id, start_date)
);

CREATE INDEX idx_teacher_subject_staff
    ON teacher_subject_assignment(staff_assignment_id, active);

CREATE INDEX idx_teacher_subject_subject
    ON teacher_subject_assignment(subject_id, active);