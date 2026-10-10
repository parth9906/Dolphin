CREATE TABLE student (
    id UUID PRIMARY KEY,

    institution_id UUID NOT NULL,
    campus_id UUID,

    admission_number VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    date_of_birth DATE,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT fk_student_institution
        FOREIGN KEY (institution_id)
        REFERENCES institution(id),

    CONSTRAINT fk_student_campus
        FOREIGN KEY (campus_id)
        REFERENCES campus(id),

    CONSTRAINT uk_student_institution_admission
        UNIQUE (institution_id, admission_number)
);

CREATE INDEX idx_student_institution_id
    ON student(institution_id);

CREATE INDEX idx_student_campus_id
    ON student(campus_id);