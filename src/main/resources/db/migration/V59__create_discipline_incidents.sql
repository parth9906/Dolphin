CREATE TABLE discipline_incident (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institution(id),
    campus_id UUID REFERENCES campus(id),
    student_id UUID NOT NULL REFERENCES student(id),
    category VARCHAR(30) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    incident_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    reported_by_user_id UUID NOT NULL REFERENCES user_account(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_discipline_incident_category
        CHECK (category IN (
            'BULLYING',
            'PHYSICAL_AGGRESSION',
            'DISRUPTION',
            'DISRESPECT',
            'ACADEMIC_DISHONESTY',
            'PROPERTY_DAMAGE',
            'ATTENDANCE',
            'OTHER'
        )),

    CONSTRAINT chk_discipline_incident_severity
        CHECK (severity IN ('MINOR', 'MODERATE', 'MAJOR')),

    CONSTRAINT chk_discipline_incident_status
        CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'))
);

CREATE INDEX idx_discipline_incident_institution_date
    ON discipline_incident(institution_id, incident_date DESC);

CREATE INDEX idx_discipline_incident_student_date
    ON discipline_incident(student_id, incident_date DESC);

CREATE INDEX idx_discipline_incident_institution_status
    ON discipline_incident(institution_id, status);
