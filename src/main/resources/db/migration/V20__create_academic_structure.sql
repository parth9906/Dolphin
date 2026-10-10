
CREATE TABLE academic_year (
    id UUID PRIMARY KEY,
    institution_id UUID NOT NULL REFERENCES institution(id),
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_academic_year_name
        UNIQUE (institution_id, name),

    CONSTRAINT chk_academic_year_dates
        CHECK (end_date > start_date),

    CONSTRAINT chk_academic_year_status
        CHECK (status IN ('PLANNED', 'ACTIVE', 'CLOSED'))
);

CREATE INDEX idx_academic_year_institution_status
    ON academic_year(institution_id, status);


CREATE TABLE school_class (
    id UUID PRIMARY KEY,
    academic_year_id UUID NOT NULL REFERENCES academic_year(id),
    name VARCHAR(80) NOT NULL,
    code VARCHAR(30) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_school_class_code
        UNIQUE (academic_year_id, code),

    CONSTRAINT uk_school_class_name
        UNIQUE (academic_year_id, name)
);

CREATE INDEX idx_school_class_year_active
    ON school_class(academic_year_id, active);


CREATE TABLE class_section (
    id UUID PRIMARY KEY,
    school_class_id UUID NOT NULL REFERENCES school_class(id),
    campus_id UUID REFERENCES campus(id),
    name VARCHAR(50) NOT NULL,
    capacity INTEGER,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_class_section_name
        UNIQUE (school_class_id, campus_id, name),

    CONSTRAINT chk_class_section_capacity
        CHECK (capacity IS NULL OR capacity > 0)
);

CREATE INDEX idx_class_section_class_active
    ON class_section(school_class_id, active);


CREATE TABLE student_enrollment (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES student(id),
    section_id UUID NOT NULL REFERENCES class_section(id),
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_student_enrollment_dates
        CHECK (end_date IS NULL OR end_date >= start_date),

    CONSTRAINT chk_student_enrollment_status
        CHECK (status IN ('ACTIVE', 'COMPLETED', 'WITHDRAWN'))
);

CREATE UNIQUE INDEX uk_student_active_enrollment
    ON student_enrollment(student_id)
    WHERE status = 'ACTIVE';

CREATE INDEX idx_enrollment_section_status
    ON student_enrollment(section_id, status);

CREATE INDEX idx_enrollment_student
    ON student_enrollment(student_id);

ALTER TABLE class_section
    DROP CONSTRAINT uk_class_section_name;

CREATE UNIQUE INDEX uk_class_section_name_without_campus
    ON class_section(school_class_id, name)
    WHERE campus_id IS NULL;

CREATE UNIQUE INDEX uk_class_section_name_with_campus
    ON class_section(school_class_id, campus_id, name)
    WHERE campus_id IS NOT NULL;