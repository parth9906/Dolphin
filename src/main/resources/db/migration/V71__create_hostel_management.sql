CREATE TABLE hostel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institution(id),
    campus_id UUID REFERENCES campus(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    hostel_type VARCHAR(20) NOT NULL,
    warden_name VARCHAR(200),
    address TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_user_id UUID NOT NULL REFERENCES user_account(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uk_hostel_institution_code
        UNIQUE (institution_id, code),

    CONSTRAINT chk_hostel_type
        CHECK (hostel_type IN ('BOYS', 'GIRLS', 'CO_ED'))
);

CREATE INDEX idx_hostel_institution_active
    ON hostel(institution_id, active);

CREATE INDEX idx_hostel_campus
    ON hostel(campus_id);

CREATE TABLE hostel_room (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hostel_id UUID NOT NULL REFERENCES hostel(id),
    room_number VARCHAR(20) NOT NULL,
    floor INTEGER,
    room_type VARCHAR(20) NOT NULL,
    capacity INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uk_hostel_room_number
        UNIQUE (hostel_id, room_number),

    CONSTRAINT chk_hostel_room_type
        CHECK (room_type IN ('SINGLE', 'DOUBLE', 'TRIPLE', 'DORMITORY')),

    CONSTRAINT chk_hostel_room_capacity
        CHECK (capacity > 0)
);

CREATE INDEX idx_hostel_room_hostel_active
    ON hostel_room(hostel_id, active);

CREATE TABLE hostel_allocation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student(id),
    room_id UUID NOT NULL REFERENCES hostel_room(id),
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    notes VARCHAR(500),
    allocated_by_user_id UUID NOT NULL REFERENCES user_account(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_hostel_allocation_status
        CHECK (status IN ('ACTIVE', 'VACATED')),

    CONSTRAINT chk_hostel_allocation_dates
        CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_hostel_allocation_room_status
    ON hostel_allocation(room_id, status);

CREATE INDEX idx_hostel_allocation_student_status
    ON hostel_allocation(student_id, status);

-- A student may hold at most one active hostel allocation at a time. This is
-- the database backstop for the service-level check; historical (vacated)
-- allocations are unconstrained.
CREATE UNIQUE INDEX uk_hostel_allocation_active_student
    ON hostel_allocation(student_id)
    WHERE status = 'ACTIVE';
