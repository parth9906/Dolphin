
CREATE TABLE guardian (
    id UUID PRIMARY KEY,
    institution_id UUID NOT NULL,
    user_account_id UUID,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(30),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT fk_guardian_institution
        FOREIGN KEY (institution_id) REFERENCES institution(id),

    CONSTRAINT fk_guardian_user_account
        FOREIGN KEY (user_account_id) REFERENCES user_account(id),

    CONSTRAINT uk_guardian_institution_user
        UNIQUE (institution_id, user_account_id)
);

CREATE INDEX idx_guardian_institution
    ON guardian(institution_id);

CREATE TABLE student_guardian (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    guardian_id UUID NOT NULL,
    relationship_type VARCHAR(30) NOT NULL,
    primary_contact BOOLEAN NOT NULL DEFAULT FALSE,
    pickup_authorized BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT fk_student_guardian_student
        FOREIGN KEY (student_id) REFERENCES student(id),

    CONSTRAINT fk_student_guardian_guardian
        FOREIGN KEY (guardian_id) REFERENCES guardian(id),

    CONSTRAINT uk_student_guardian
        UNIQUE (student_id, guardian_id)
);

CREATE INDEX idx_student_guardian_student
    ON student_guardian(student_id);

CREATE INDEX idx_student_guardian_guardian
    ON student_guardian(guardian_id);

CREATE UNIQUE INDEX uk_student_one_primary_guardian
    ON student_guardian(student_id)
    WHERE primary_contact = TRUE;