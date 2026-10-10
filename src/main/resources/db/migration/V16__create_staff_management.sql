
CREATE TABLE staff_member (
    id UUID PRIMARY KEY,
    user_account_id UUID UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_staff_user_account
        FOREIGN KEY (user_account_id)
        REFERENCES user_account(id)
);

CREATE INDEX idx_staff_member_name
    ON staff_member(last_name, first_name);

CREATE TABLE staff_assignment (
    id UUID PRIMARY KEY,
    staff_member_id UUID NOT NULL,
    institution_id UUID NOT NULL,
    campus_id UUID,
    employee_number VARCHAR(50) NOT NULL,
    staff_type VARCHAR(30) NOT NULL,
    job_title VARCHAR(120) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_staff_assignment_member
        FOREIGN KEY (staff_member_id)
        REFERENCES staff_member(id),

    CONSTRAINT fk_staff_assignment_institution
        FOREIGN KEY (institution_id)
        REFERENCES institution(id),

    CONSTRAINT fk_staff_assignment_campus
        FOREIGN KEY (campus_id)
        REFERENCES campus(id),

    CONSTRAINT uk_staff_employee_number
        UNIQUE (institution_id, employee_number),

    CONSTRAINT chk_staff_type
        CHECK (staff_type IN (
            'TEACHER', 'PRINCIPAL', 'ADMINISTRATOR',
            'LIBRARIAN', 'COUNSELOR', 'SUPPORT'
        )),

    CONSTRAINT chk_staff_status
        CHECK (status IN (
            'ACTIVE', 'ON_LEAVE', 'INACTIVE', 'TERMINATED'
        )),

    CONSTRAINT chk_staff_assignment_dates
        CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_staff_assignment_institution_status
    ON staff_assignment(institution_id, status);

CREATE INDEX idx_staff_assignment_member
    ON staff_assignment(staff_member_id);

CREATE INDEX idx_staff_assignment_campus
    ON staff_assignment(campus_id);