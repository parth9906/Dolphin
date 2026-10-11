CREATE TABLE admission_application (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institution(id),
    campus_id UUID REFERENCES campus(id),
    applying_class_id UUID NOT NULL REFERENCES school_class(id),
    applicant_first_name VARCHAR(100) NOT NULL,
    applicant_last_name VARCHAR(100) NOT NULL,
    applicant_date_of_birth DATE NOT NULL,
    parent_name VARCHAR(200),
    parent_phone VARCHAR(30),
    parent_email VARCHAR(200),
    notes VARCHAR(2000),
    application_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'APPLIED',
    created_by_user_id UUID NOT NULL REFERENCES user_account(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_admission_application_status
        CHECK (status IN (
            'APPLIED',
            'UNDER_REVIEW',
            'ACCEPTED',
            'REJECTED',
            'WAITLISTED',
            'ENROLLED'
        ))
);

CREATE INDEX idx_admission_application_institution_date
    ON admission_application(institution_id, application_date DESC);

CREATE INDEX idx_admission_application_institution_status
    ON admission_application(institution_id, status);

CREATE INDEX idx_admission_application_class_status
    ON admission_application(applying_class_id, status);
